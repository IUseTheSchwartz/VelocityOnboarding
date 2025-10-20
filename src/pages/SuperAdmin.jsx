import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import {
  LayoutDashboard, Users, Search, RefreshCw, ShieldAlert, Edit3, Save, X,
  PauseCircle, PlayCircle, Trash2, UserMinus, UserCog, Plus, ClipboardCopy, Link2
} from "lucide-react";

export default function SuperAdmin() {
  const [me, setMe] = useState(null);
  const [tab, setTab] = useState("agencies"); // agencies | admins
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [agencies, setAgencies] = useState([]);
  const [selected, setSelected] = useState(null); // agency row selected
  const [members, setMembers] = useState([]);
  const [invites, setInvites] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [msg, setMsg] = useState("");

  // invite creator controls (for Super Admin)
  const [inviteRole, setInviteRole] = useState("agent");   // agent | manager | owner
  const [inviteUses, setInviteUses] = useState(1);
  const [inviteDays, setInviteDays] = useState(7);

  useEffect(() => { (async () => {
    const { data } = await supabase.auth.getUser();
    setMe(data?.user ?? null);
  })(); }, []);

  const isAdminUI = async () => {
    const { data, error } = await supabase.rpc("is_current_admin");
    if (error) return false;
    return !!data;
  };

  async function fetchAgencies() {
    setLoading(true); setErr("");
    const { data, error } = await supabase
      .from("agencies")
      .select("id, name, slug, logo_url, theme, suspended, created_at, agency_users(count)")
      .order("created_at", { ascending: false });

    if (error) setErr(error.message);
    setAgencies(data || []);
    setLoading(false);
  }

  async function fetchMembers(agencyId) {
    setMembers([]);
    const { data, error } = await supabase
      .from("agency_users")
      .select("user_id, user_email, role, progress")
      .eq("agency_id", agencyId)
      .order("user_email", { ascending: true });
    if (!error) setMembers(data || []);
  }

  async function fetchInvites(agencyId) {
    setInvites([]);
    const { data, error } = await supabase
      .from("invite_codes")
      .select("id, code, status, expires_at, max_uses, uses, created_at, role")
      .eq("agency_id", agencyId)
      .order("created_at", { ascending: false });
    if (!error) setInvites(data || []);
  }

  async function fetchAdmins() {
    const { data, error } = await supabase
      .from("admin_users")
      .select("email, created_at")
      .order("created_at", { ascending: false });
    if (!error) setAdmins(data || []);
  }

  useEffect(() => { if (me) { fetchAgencies(); fetchAdmins(); } }, [me]);

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return agencies;
    return agencies.filter(a => a.name?.toLowerCase().includes(t) || a.slug?.toLowerCase().includes(t));
  }, [q, agencies]);

  // ---- Agencies: edit/save/suspend ----
  function startEdit(agency) {
    setSelected({
      ...agency,
      _edit: { name: agency.name, slug: agency.slug, primary: agency.theme?.primary || "#1E63F0", ink: agency.theme?.ink || "#0B1535", logo_url: agency.logo_url || "" }
    });
    fetchMembers(agency.id);
    fetchInvites(agency.id);
    setMsg("");
  }

  function cancelEdit() {
    setSelected(null);
    setMembers([]);
    setInvites([]);
  }

  async function saveAgency() {
    if (!selected?._edit) return;
    setMsg("");
    const { name, slug, primary, ink, logo_url } = selected._edit;
    const { error } = await supabase
      .from("agencies")
      .update({ name, slug, theme: { primary, ink }, logo_url })
      .eq("id", selected.id);
    if (error) return setMsg(error.message);
    setMsg("Saved agency.");
    await fetchAgencies();
  }

  async function toggleSuspend(agency) {
    setMsg("");
    const { error } = await supabase
      .from("agencies")
      .update({ suspended: !agency.suspended })
      .eq("id", agency.id);
    if (error) return setMsg(error.message);
    setMsg(agency.suspended ? "Agency unsuspended." : "Agency suspended.");
    await fetchAgencies();
    if (selected?.id === agency.id) setSelected({ ...agency, suspended: !agency.suspended });
  }

  // ---- Members: remove / change role ----
  async function removeMember(agencyId, userId) {
    setMsg("");
    const { error } = await supabase.from("agency_users").delete().match({ agency_id: agencyId, user_id: userId });
    if (error) return setMsg(error.message);
    setMsg("Member removed.");
    await fetchMembers(agencyId);
  }

  async function changeRole(agencyId, userId, role) {
    setMsg("");
    const { error } = await supabase.from("agency_users").update({ role }).match({ agency_id: agencyId, user_id: userId });
    if (error) return setMsg(error.message);
    setMsg("Role updated.");
    await fetchMembers(agencyId);
  }

  // ---- Invite making (any role) ----
  function makeCode(len = 6) {
    const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    return Array.from({ length: len }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join("");
  }

  async function createInvite(agencyId) {
    setMsg("");
    const { data: meRes } = await supabase.auth.getUser();
    const code = makeCode(6);
    const expires = new Date(Date.now() + Number(inviteDays) * 24*60*60*1000).toISOString();
    const uses = Math.max(1, Number(inviteUses) || 1);

    const { error } = await supabase.from("invite_codes").insert({
      agency_id: agencyId,
      code,
      role: inviteRole,       // agent | manager | owner
      max_uses: uses,
      expires_at: expires,
      created_by: meRes?.user?.id || null
    });
    if (error) return setMsg(error.message);
    setMsg("Invite created.");
    await fetchInvites(agencyId);
  }

  async function disableInvite(id, agencyId) {
    setMsg("");
    const { error } = await supabase.from("invite_codes").update({ status: "disabled" }).eq("id", id);
    if (error) return setMsg(error.message);
    setMsg("Invite disabled.");
    await fetchInvites(agencyId);
  }

  function copy(text) {
    navigator.clipboard.writeText(text);
    setMsg("Copied.");
  }

  // ---- Admins tab: add/remove admin emails ----
  const [newAdminEmail, setNewAdminEmail] = useState("");

  async function addAdmin() {
    setMsg("");
    const email = (newAdminEmail || "").trim().toLowerCase();
    if (!email) return;
    const { error } = await supabase.from("admin_users").insert({ email });
    if (error) return setMsg(error.message);
    setNewAdminEmail("");
    setMsg("Admin added.");
    await fetchAdmins();
  }

  async function removeAdmin(email) {
    setMsg("");
    if (email === (me?.email || "").toLowerCase()) return setMsg("You can’t remove yourself.");
    const { error } = await supabase.from("admin_users").delete().eq("email", email);
    if (error) return setMsg(error.message);
    setMsg("Admin removed.");
    await fetchAdmins();
  }

  // ---- Gate non-admin users in UI (defense-in-depth) ----
  const [uiAdmin, setUiAdmin] = useState(false);
  useEffect(() => { (async () => setUiAdmin(await isAdminUI()))(); /* eslint-disable-next-line */ }, [me]);

  if (!me) return <Section><div className="sub">Loading…</div></Section>;
  if (!uiAdmin) {
    return (
      <Section>
        <div className="card" style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <ShieldAlert size={18} /><strong>Not authorized</strong>
          <div className="sub">This page is restricted.</div>
        </div>
      </Section>
    );
  }

  return (
    <section className="section">
      <div className="container">
        <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
          <h2 className="h2" style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <LayoutDashboard size={18}/> Super Admin
          </h2>

          <div className="row" style={{ gap: 8, alignItems: "center" }}>
            <button className={`btn ${tab==='agencies'?'btn-primary':'btn-ghost'}`} onClick={()=>setTab('agencies')}>Agencies</button>
            <button className={`btn ${tab==='admins'?'btn-primary':'btn-ghost'}`} onClick={()=>setTab('admins')}>Admins</button>

            {tab === "agencies" && (
              <>
                <div className="row" style={{ gap: 8, alignItems: "center", background: "var(--panel)", padding: "6px 10px", borderRadius: 10, marginLeft: 8 }}>
                  <Search size={14}/>
                  <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search agencies…" style={{ border: "none", outline: "none", background: "transparent" }} />
                </div>
                <button className="btn btn-ghost" onClick={fetchAgencies} disabled={loading}><RefreshCw size={14}/> Refresh</button>
              </>
            )}
          </div>
        </div>

        {msg && <div className="sub" style={{ color: /saved|created|disabled|copied|removed|unsuspended|suspended/i.test(msg) ? "green" : "crimson", marginTop: 8 }}>{msg}</div>}
        {err && <div className="sub" style={{ color: "crimson", marginTop: 8 }}>{err}</div>}

        {tab === "agencies" ? (
          <>
            <div className="card" style={{ marginTop: 12 }}>
              {loading ? (
                <div className="sub">Loading…</div>
              ) : (
                <table className="table">
                  <thead>
                    <tr>
                      <th style={{ width: 36 }}></th>
                      <th>Name</th>
                      <th>Slug</th>
                      <th>Agents</th>
                      <th>Status</th>
                      <th>Created</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 && <tr><td className="sub" colSpan="7">No agencies found.</td></tr>}
                    {filtered.map((a) => {
                      const count = a.agency_users?.[0]?.count ?? 0;
                      const primary = a.theme?.primary || "#1E63F0";
                      return (
                        <tr key={a.id}>
                          <td>
                            {a.logo_url
                              ? <img src={a.logo_url} alt="logo" style={{ height: 22, borderRadius: 6 }} />
                              : <div style={{ width: 22, height: 22, borderRadius: 6, background: primary }} />}
                          </td>
                          <td>{a.name}</td>
                          <td><code>{a.slug}</code></td>
                          <td className="row" style={{ gap: 6, alignItems: "center" }}><Users size={14}/>{count}</td>
                          <td>{a.suspended ? <span className="badge" style={{ background: "#fee" }}>suspended</span> : <span className="badge">active</span>}</td>
                          <td>{new Date(a.created_at).toLocaleDateString()}</td>
                          <td className="row" style={{ gap: 6, flexWrap: "wrap" }}>
                            <button className="btn btn-ghost" onClick={() => startEdit(a)} title="Edit"><Edit3 size={14}/></button>
                            <button className="btn btn-ghost" onClick={() => toggleSuspend(a)} title={a.suspended?'Unsuspend':'Suspend'}>
                              {a.suspended ? <PlayCircle size={14}/> : <PauseCircle size={14}/>}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {selected && (
              <div className="card" style={{ marginTop: 12 }}>
                <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
                  <strong>Edit Agency</strong>
                  <div className="row" style={{ gap: 6 }}>
                    <button className="btn btn-ghost" onClick={cancelEdit}><X size={14}/> Close</button>
                    <button className="btn btn-primary" onClick={saveAgency}><Save size={14}/> Save</button>
                  </div>
                </div>
                <div className="sep" />

                {/* Branding */}
                <div className="grid grid-3">
                  <div>
                    <label>Name</label>
                    <input style={input} value={selected._edit.name} onChange={(e)=>setSelected({...selected, _edit:{...selected._edit, name:e.target.value}})} />
                    <label style={{ marginTop: 8 }}>Slug</label>
                    <input style={input} value={selected._edit.slug} onChange={(e)=>setSelected({...selected, _edit:{...selected._edit, slug:e.target.value.replace(/\s+/g,'-').toLowerCase()}})} />
                  </div>
                  <div>
                    <label>Primary</label>
                    <input style={input} value={selected._edit.primary} onChange={(e)=>setSelected({...selected, _edit:{...selected._edit, primary:e.target.value}})} />
                    <label style={{ marginTop: 8 }}>Heading Color</label>
                    <input style={input} value={selected._edit.ink} onChange={(e)=>setSelected({...selected, _edit:{...selected._edit, ink:e.target.value}})} />
                  </div>
                  <div>
                    <label>Logo URL</label>
                    <input style={input} value={selected._edit.logo_url} onChange={(e)=>setSelected({...selected, _edit:{...selected._edit, logo_url:e.target.value}})} />
                    {selected._edit.logo_url && <div style={{ marginTop: 8 }}><img src={selected._edit.logo_url} alt="logo" style={{ maxHeight: 44 }}/></div>}
                  </div>
                </div>

                {/* Members */}
                <div className="sep" />
                <strong>Members</strong>
                <table className="table" style={{ marginTop: 8 }}>
                  <thead><tr><th>Email</th><th>Role</th><th>Progress</th><th>Actions</th></tr></thead>
                  <tbody>
                    {members.length === 0 && <tr><td className="sub" colSpan="4">No members</td></tr>}
                    {members.map(m => (
                      <tr key={m.user_id}>
                        <td>{m.user_email}</td>
                        <td>{m.role}</td>
                        <td>{m.progress ?? 0}%</td>
                        <td className="row" style={{ gap: 6 }}>
                          {m.role !== "owner" && (
                            <>
                              <button className="btn btn-ghost" onClick={()=>changeRole(selected.id, m.user_id, m.role === "manager" ? "agent" : "manager")} title="Toggle role">
                                <UserCog size={14}/> {m.role === "manager" ? "Make agent" : "Make manager"}
                              </button>
                              <button className="btn btn-ghost" onClick={()=>removeMember(selected.id, m.user_id)} title="Remove">
                                <UserMinus size={14}/> Remove
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Invites (role, uses, expiry; copy/open/disable) */}
                <div className="sep" />
                <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
                  <strong>Invite Codes</strong>
                  <div className="row" style={{ gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                    <label className="sub">Role</label>
                    <select value={inviteRole} onChange={(e)=>setInviteRole(e.target.value)} className="btn btn-ghost">
                      <option value="agent">agent</option>
                      <option value="manager">manager</option>
                      <option value="owner">owner</option>
                    </select>
                    <label className="sub">Uses</label>
                    <input type="number" min={1} value={inviteUses} onChange={(e)=>setInviteUses(e.target.value)} className="btn btn-ghost" style={{ width: 80 }} />
                    <label className="sub">Days</label>
                    <input type="number" min={1} value={inviteDays} onChange={(e)=>setInviteDays(e.target.value)} className="btn btn-ghost" style={{ width: 80 }} />
                    <button className="btn btn-ghost" onClick={()=>createInvite(selected.id)}><Plus size={14}/> New invite</button>
                  </div>
                </div>
                <table className="table" style={{ marginTop: 8 }}>
                  <thead><tr><th>Code</th><th>Role</th><th>Status</th><th>Expires</th><th>Actions</th></tr></thead>
                  <tbody>
                    {invites.length === 0 && <tr><td className="sub" colSpan="5">No invites</td></tr>}
                    {invites.map(inv => {
                      const url = `${window.location.origin}/login/agent?code=${encodeURIComponent(inv.code)}`;
                      return (
                        <tr key={inv.id}>
                          <td><code>{inv.code}</code></td>
                          <td>{inv.role}</td>
                          <td><span className="badge">{inv.status}</span></td>
                          <td>{inv.expires_at ? new Date(inv.expires_at).toLocaleString() : "—"}</td>
                          <td className="row" style={{ gap: 6 }}>
                            <button className="btn btn-ghost" onClick={()=>copy(url)} title="Copy signup link"><ClipboardCopy size={14}/> Copy</button>
                            {inv.status === "active" && (
                              <button className="btn btn-ghost" onClick={()=>disableInvite(inv.id, selected.id)} title="Disable"><Trash2 size={14}/> Disable</button>
                            )}
                            <a className="btn btn-ghost" href={url} target="_blank" rel="noreferrer" title="Open link">
                              <Link2 size={14}/> Open
                            </a>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        ) : (
          <div className="card" style={{ marginTop: 12 }}>
            <div className="row" style={{ gap: 8, alignItems: "center" }}>
              <input
                placeholder="new-admin@email.com"
                value={newAdminEmail}
                onChange={(e)=>setNewAdminEmail(e.target.value)}
                style={input}
              />
              <button className="btn btn-primary" onClick={addAdmin}><Plus size={14}/> Add admin</button>
            </div>
            <div className="sep" />
            <table className="table">
              <thead><tr><th>Email</th><th>Added</th><th>Actions</th></tr></thead>
              <tbody>
                {admins.length === 0 && <tr><td className="sub" colSpan="3">No admins yet</td></tr>}
                {admins.map(a => (
                  <tr key={a.email}>
                    <td>{a.email}</td>
                    <td>{new Date(a.created_at).toLocaleString()}</td>
                    <td>
                      <button className="btn btn-ghost" onClick={()=>removeAdmin(a.email)}><Trash2 size={14}/> Remove</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}

function Section({ children }) {
  return <section className="section"><div className="container">{children}</div></section>;
}

const input = { width:"100%", border:"1px solid var(--border)", borderRadius:10, padding:"10px 12px", outline:"none", fontSize:14 };

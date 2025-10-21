// File: src/pages/SuperAdmin.jsx
import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import {
  LayoutDashboard, Users, Search, RefreshCw, ShieldAlert, Edit3, Save, X,
  PauseCircle, PlayCircle, Trash2, UserMinus, UserCog, Plus, ClipboardCopy, Upload
} from "lucide-react";

const SUPER = (import.meta.env.VITE_SUPER_ADMIN_EMAIL || "").toLowerCase();

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
  const [msg, setMsg] = useState("");

  // invite creator controls (for Super Admin)
  const [inviteRole, setInviteRole] = useState("agent");   // agent | manager | owner
  const [inviteUses, setInviteUses] = useState(1);
  const [inviteDays, setInviteDays] = useState(7);

  // --- Admin UI gate with fallback to env super admin email ---
  const [uiAdmin, setUiAdmin] = useState(false);
  const [adminCheckDone, setAdminCheckDone] = useState(false);

  const isAdminUI = async (user) => {
    const myEmail = (user?.email || "").toLowerCase();
    if (SUPER && myEmail === SUPER) return true; // fallback
    const { data, error } = await supabase.rpc("is_current_admin");
    if (error) {
      console.warn("is_current_admin error:", error);
      return false;
    }
    return !!data;
  };

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      const user = data?.user ?? null;
      setMe(user);

      const ok = await isAdminUI(user);
      setUiAdmin(ok);
      setAdminCheckDone(true);
    })();
  }, []);

  async function fetchAgencies() {
    setLoading(true); setErr("");
    const { data, error } = await supabase
      .from("agencies")
      .select("id, name, slug, logo_url, theme, suspended, created_at, owner_user_id, pending_owner_email, agency_users(count)")
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

  useEffect(() => { if (uiAdmin) { fetchAgencies(); } }, [uiAdmin]);

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return agencies;
    return agencies.filter(a => a.name?.toLowerCase().includes(t) || a.slug?.toLowerCase().includes(t));
  }, [q, agencies]);

  // ---- Agencies: edit/save/suspend ----
  function startEdit(agency) {
    setSelected({
      ...agency,
      _edit: {
        name: agency.name,
        slug: agency.slug,
        primary: agency.theme?.primary || "#1E63F0",
        ink: agency.theme?.ink || "#0B1535",
        logo_url: agency.logo_url || ""
      }
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

  // ---- Invite making (now via RPC) ----
  function copy(text) {
    navigator.clipboard.writeText(text);
    setMsg("Copied.");
  }

  async function createInvite(agencyId) {
    setMsg("");
    try {
      if (!agencyId) throw new Error("Select an agency first (click Edit).");

      const uses = Math.max(1, Number(inviteUses) || 1);
      const days = Math.max(1, Number(inviteDays) || 1);

      const { data, error } = await supabase.rpc("admin_create_invite", {
        p_agency_id: agencyId,
        p_role: (inviteRole || "agent").toLowerCase(),
        p_max_uses: uses,
        p_days: days,
      });

      if (error) throw error;

      const row = Array.isArray(data) ? data[0] : data;
      setMsg(`Invite created (${row.role}). Code: ${row.code}`);
      await fetchInvites(agencyId);
    } catch (e) {
      setMsg(e.message || String(e));
    }
  }

  async function disableInvite(id, agencyId) {
    setMsg("");
    const { error } = await supabase.rpc("admin_disable_invite", { p_id: id });
    if (error) return setMsg(error.message);
    setMsg("Invite disabled.");
    await fetchInvites(agencyId);
  }

  // --- Gate renders ---
  if (!adminCheckDone) return <Section><div className="sub">Checking access…</div></Section>;
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
            {/* Provision card */}
            <div className="card" style={{ marginTop: 12 }}>
              <div className="row" style={{ gap: 8 }}>
                <strong>Provision Agency (Done-For-You)</strong>
              </div>
              <div className="sub" style={{ marginTop: 6 }}>
                Create an agency and assign it to an email. If the user doesn’t exist yet,
                it’ll wait and auto-claim on their first login.
              </div>
              <div className="sep" />
              <ProvisionAgencyForm />
            </div>

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
                          <td>
                            {a.suspended ? (
                              <span className="badge" style={{ background: "#fee" }}>suspended</span>
                            ) : a.owner_user_id ? (
                              <span className="badge">active</span>
                            ) : (
                              <span className="badge" style={{ background: "#f4f4f5", color: "#555" }}>no owner</span>
                            )}
                          </td>
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
                    <input
                      style={input}
                      value={selected._edit.name}
                      onChange={(e)=>setSelected({...selected, _edit:{...selected._edit, name:e.target.value}})}
                    />
                    <label style={{ marginTop: 8 }}>Slug</label>
                    <input
                      style={input}
                      value={selected._edit.slug}
                      onChange={(e)=>setSelected({...selected, _edit:{...selected._edit, slug:e.target.value.replace(/\s+/g,'-').toLowerCase()}})}
                    />
                  </div>
                  <div>
                    <label>Primary</label>
                    <input
                      style={input}
                      value={selected._edit.primary}
                      onChange={(e)=>setSelected({...selected, _edit:{...selected._edit, primary:e.target.value}})}
                    />
                    <label style={{ marginTop: 8 }}>Heading Color</label>
                    <input
                      style={input}
                      value={selected._edit.ink}
                      onChange={(e)=>setSelected({...selected, _edit:{...selected._edit, ink:e.target.value}})}
                    />
                  </div>
                  <div>
                    <label>Logo URL</label>
                    <input
                      style={input}
                      value={selected._edit.logo_url}
                      onChange={(e)=>setSelected({...selected, _edit:{...selected._edit, logo_url:e.target.value}})}
                    />
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
                              <button
                                className="btn btn-ghost"
                                onClick={()=>changeRole(selected.id, m.user_id, m.role === "manager" ? "agent" : "manager")}
                                title="Toggle role"
                              >
                                <UserCog size={14}/> {m.role === "manager" ? "Make agent" : "Make manager"}
                              </button>
                              <button
                                className="btn btn-ghost"
                                onClick={()=>removeMember(selected.id, m.user_id)}
                                title="Remove"
                              >
                                <UserMinus size={14}/> Remove
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Invite Codes (create/copy/disable) */}
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
                    <button
                      className="btn btn-ghost"
                      onClick={()=>createInvite(selected?.id)}
                      disabled={!selected?.id}
                      title={!selected?.id ? "Select an agency (Edit) first" : "Create invite code"}
                    >
                      <Plus size={14}/> New invite
                    </button>
                  </div>
                </div>
                <table className="table" style={{ marginTop: 8 }}>
                  <thead><tr><th>Code</th><th>Role</th><th>Status</th><th>Expires</th><th>Actions</th></tr></thead>
                  <tbody>
                    {invites.length === 0 && <tr><td className="sub" colSpan="5">No invites</td></tr>}
                    {invites.map(inv => {
                      return (
                        <tr key={inv.id}>
                          <td><code>{inv.code}</code></td>
                          <td>{inv.role}</td>
                          <td><span className="badge">{inv.status}</span></td>
                          <td>{inv.expires_at ? new Date(inv.expires_at).toLocaleString() : "—"}</td>
                          <td className="row" style={{ gap: 6 }}>
                            <button className="btn btn-ghost" onClick={()=>copy(inv.code)} title="Copy invite code">
                              <ClipboardCopy size={14}/> Copy code
                            </button>
                            {inv.status === "active" && (
                              <button className="btn btn-ghost" onClick={()=>disableInvite(inv.id, selected.id)} title="Disable">
                                <Trash2 size={14}/> Disable
                              </button>
                            )}
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
            <AdminsTab />
          </div>
        )}
      </div>
    </section>
  );
}

function Section({ children }) {
  return <section className="section"><div className="container">{children}</div></section>;
}

/* -------------------- Admins tab -------------------- */
function AdminsTab() {
  const [admins, setAdmins] = useState([]);
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [msg, setMsg] = useState("");

  async function fetchAdmins() {
    const { data, error } = await supabase
      .from("admin_users")
      .select("email, created_at")
      .order("created_at", { ascending: false });
    if (!error) setAdmins(data || []);
  }

  useEffect(() => { fetchAdmins(); }, []);

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
    const me = (await supabase.auth.getUser())?.data?.user?.email?.toLowerCase();
    if (email === (me || "")) return setMsg("You can’t remove yourself.");
    const { error } = await supabase.from("admin_users").delete().eq("email", email);
    if (error) return setMsg(error.message);
    setMsg("Admin removed.");
    await fetchAdmins();
  }

  return (
    <>
      {msg && <div className="sub" style={{ color: /added|removed/i.test(msg) ? "green" : "crimson" }}>{msg}</div>}
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
    </>
  );
}

/* -------------------- Provision form component -------------------- */

function ProvisionAgencyForm() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [llc, setLLC] = useState("");
  const [calendly, setCalendly] = useState("");

  // theme + visibility
  const [primary, setPrimary] = useState("#1e63f0");
  const [ink, setInk] = useState("#0b1220");
  const [isPublic, setIsPublic] = useState(false);
  const [publicSlug, setPublicSlug] = useState("");

  // logo upload
  const [logoUrl, setLogoUrl] = useState("");
  const [logoUploading, setLogoUploading] = useState(false);
  const [out, setOut] = useState("");
  const [loading, setLoading] = useState(false);

  function normSlug(s) {
    return (s || "").trim().toLowerCase().replace(/\s+/g, "-");
  }

  async function handleLogoUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    const okTypes = ["image/png", "image/jpeg", "image/svg+xml", "image/webp"];
    if (!okTypes.includes(file.type)) {
      setOut("Please upload PNG, JPG, SVG, or WEBP.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setOut("Max file size is 2MB.");
      return;
    }

    setOut("");
    setLogoUploading(true);
    try {
      const { data: userRes } = await supabase.auth.getUser();
      const uid = userRes?.user?.id || "superadmin";
      const safe = file.name.replace(/\s+/g, "_");
      const path = `${uid}/${Date.now()}_${safe}`;

      const { data, error } = await supabase.storage
        .from("agency-logos")
        .upload(path, file, { upsert: false });

      if (error) throw error;

      const { data: pub } = supabase.storage.from("agency-logos").getPublicUrl(data.path);
      setLogoUrl(pub.publicUrl);
      setOut("Logo uploaded.");
    } catch (err) {
      setOut(err.message || String(err));
    } finally {
      setLogoUploading(false);
    }
  }

  async function handleProvision(e) {
    e.preventDefault();
    setOut("");
    setLoading(true);

    const slug = normSlug(name);
    const theme = { primary, ink };

    const { data, error } = await supabase.rpc("admin_upsert_agency", {
      p_owner_email: (email || "").trim().toLowerCase(),
      p_name: name.trim(),
      p_slug: slug, // auto from name
      p_logo_url: logoUrl || null,
      p_theme: theme,
      p_legal_name: llc || null,               // label "LLC", maps to legal_name
      p_calendly_url: calendly || null,
      p_is_public: isPublic,
      p_public_slug: normSlug(publicSlug || slug),
    });

    setLoading(false);

    if (error) {
      setOut(error.message);
      return;
    }

    const row = Array.isArray(data) ? data[0] : data;
    setOut(`Agency ${row?.id} • ${row?.status === "assigned" ? "Owner assigned" : "Pending owner signup"}`);
  }

  return (
    <form onSubmit={handleProvision} style={{ display: "grid", gap: 10 }}>
      <label>Owner Email</label>
      <input
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={input}
        placeholder="owner@example.com"
        required
      />

      <label style={{ marginTop: 4 }}>Agency Name</label>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        style={input}
        placeholder="Velocity Financial"
        required
      />
      <div className="sub">Slug will be <code>{name ? name.trim().toLowerCase().replace(/\s+/g, "-") : "…"}</code></div>

      <div className="row" style={{ gap: 10, flexWrap: "wrap", marginTop: 6 }}>
        <div>
          <div className="sub" style={{ marginBottom: 6 }}>Primary</div>
          <input type="color" value={primary} onChange={(e) => setPrimary(e.target.value)} />
        </div>
        <div>
          <div className="sub" style={{ marginBottom: 6 }}>Ink</div>
          <input type="color" value={ink} onChange={(e) => setInk(e.target.value)} />
        </div>
      </div>

      {/* Logo file upload */}
      <div>
        <div className="sub" style={{ marginBottom: 6 }}>Logo</div>
        <label className="btn btn-ghost" style={{ display: "inline-flex", gap: 8, alignItems: "center", cursor: "pointer" }}>
          <Upload size={16} /> {logoUploading ? "Uploading…" : "Upload logo"}
          <input type="file" accept="image/*" onChange={handleLogoUpload} style={{ display: "none" }} />
        </label>
        {logoUrl && <div style={{ marginTop: 8 }}><img src={logoUrl} alt="logo preview" style={{ maxHeight: 44 }} /></div>}
      </div>

      {/* LLC name */}
      <label style={{ marginTop: 4 }}>LLC (optional)</label>
      <input
        value={llc}
        onChange={(e) => setLLC(e.target.value)}
        style={input}
        placeholder="Your LLC (defaults to PRIETO INSURANCE SOLUTIONS LLC)"
      />

      <label style={{ marginTop: 4 }}>Calendly URL (optional)</label>
      <input
        value={calendly}
        onChange={(e) => setCalendly(e.target.value)}
        style={input}
        placeholder="https://calendly.com/…"
      />

      <label className="row" style={{ marginTop: 6, gap: 8, alignItems: "center" }}>
        <input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} />
        <span>Make page public now</span>
      </label>

      <label>Public Slug (optional)</label>
      <input
        value={publicSlug}
        onChange={(e) => setPublicSlug(e.target.value)}
        style={input}
        placeholder="velocity-financial"
      />

      <div className="row" style={{ gap: 8, marginTop: 8 }}>
        <button className="btn btn-primary" disabled={loading || logoUploading}>
          {loading ? "Provisioning…" : "Provision Agency"}
        </button>
      </div>

      {out && (
        <div className="sub" style={{ color: /assigned|pending|uploaded/i.test(out) ? "green" : "crimson" }}>
          {out}
        </div>
      )}
    </form>
  );
}

const input = { width:"100%", border:"1px solid var(--border)", borderRadius:10, padding:"10px 12px", outline:"none", fontSize:14 };

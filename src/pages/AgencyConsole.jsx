// src/pages/AgencyConsole.jsx
import React, { useEffect, useState } from "react";
import { Settings2, Users, Film, LayoutDashboard, Upload, ClipboardCopy, Ban } from "lucide-react";
import { useTheme } from "../theme";
import { supabase } from "../lib/supabaseClient";
import { getUser, getCurrentAgency, listAgentsForMyAgency, upsertMyAgency } from "../lib/db";
import { useNavigate } from "react-router-dom";

export default function AgencyConsole() {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();

  // Branding
  const [name, setName] = useState("Your Agency");
  const [slug, setSlug] = useState("your-agency"); // internal; auto from name
  const [primary, setPrimary] = useState(theme.primary);
  const [ink, setInk] = useState(theme.ink);
  const [logoUrl, setLogoUrl] = useState("");

  // Team/Invites
  const [agents, setAgents] = useState([]);
  const [invites, setInvites] = useState([]);

  // Publishing + legal + CTA
  const [isPublic, setIsPublic] = useState(false);
  const [publicSlug, setPublicSlug] = useState("your-agency");
  const [legalName, setLegalName] = useState("");
  const [calendlyUrl, setCalendlyUrl] = useState("");

  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [msg, setMsg] = useState("");

  const normSlug = (s) => (s || "").trim().toLowerCase().replace(/\s+/g, "-");

  // 🚧 If the signed-in user is an admin, bounce them to /super
  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.rpc("is_current_admin");
      if (!error && data) navigate("/super");
    })();
  }, [navigate]);

  useEffect(() => {
    (async () => {
      const a = await getCurrentAgency();
      if (a) {
        setName(a.name || "Your Agency");
        setSlug(a.slug || "your-agency"); // internal value (will be overwritten by name on save)
        setLogoUrl(a.logo_url || "");
        if (a.theme?.primary) setPrimary(a.theme.primary);
        if (a.theme?.ink) setInk(a.theme.ink);
        setTheme(a.theme || theme);

        setIsPublic(Boolean(a.is_public));
        setPublicSlug(a.public_slug || a.slug || "your-agency");
        setLegalName(a.legal_name || "");
        setCalendlyUrl(a.calendly_url || "");
        await fetchInvites(a.id);
      }
      const list = await listAgentsForMyAgency();
      setAgents(list);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { setTheme({ primary, ink }); }, [primary, ink, setTheme]);

  // ------- Invites --------
  async function fetchInvites(agencyId) {
    const { data, error } = await supabase
      .from("invite_codes")
      .select("id, code, status, expires_at, max_uses, uses, created_at")
      .eq("agency_id", agencyId)
      .order("created_at", { ascending: false })
      .limit(50);
    if (!error) setInvites(data || []);
  }

  function makeCode(len = 6) {
    const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // avoid similar chars
    return Array.from({ length: len }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join("");
  }

  async function generateInvite() {
    setMsg("");
    const { data: userRes } = await supabase.auth.getUser();
    if (!userRes?.user) return setMsg("Not signed in.");
    const a = await getCurrentAgency();
    if (!a) return setMsg("Create your agency first.");

    const code = makeCode(6);
    const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const { error } = await supabase.from("invite_codes").insert({
      agency_id: a.id,
      code,
      role: "agent",
      max_uses: 1,
      expires_at: expires,
      created_by: userRes.user.id
    });

    if (error) return setMsg(error.message);
    setMsg("Invite created.");
    await fetchInvites(a.id);
  }

  async function disableInvite(id) {
    setMsg("");
    const { error } = await supabase.from("invite_codes").update({ status: "disabled" }).eq("id", id);
    if (error) return setMsg(error.message);
    const a = await getCurrentAgency();
    if (a) await fetchInvites(a.id);
    setMsg("Invite disabled.");
  }

  function copy(text) {
    navigator.clipboard.writeText(text);
    setMsg("Copied to clipboard.");
  }

  // ------- Logo upload (public bucket) --------
  async function handleLogoFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    const okTypes = ["image/png", "image/jpeg", "image/svg+xml", "image/webp"];
    if (!okTypes.includes(file.type)) {
      setMsg("Please upload PNG, JPG, SVG, or WEBP.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setMsg("Max file size is 2MB.");
      return;
    }

    const user = await getUser();
    if (!user) {
      setMsg("Not signed in.");
      return;
    }

    const safeName = file.name.replace(/\s+/g, "_");
    const path = `${user.id}/${Date.now()}_${safeName}`;

    const { data, error } = await supabase.storage
      .from("agency-logos")
      .upload(path, file, { upsert: false });

    if (error) {
      setMsg(error.message);
      return;
    }

    const { data: pub } = supabase.storage.from("agency-logos").getPublicUrl(data.path);
    setLogoUrl(pub.publicUrl);
    setMsg("Logo uploaded.");
  }

  // ------- Save / Publish --------
  async function handleSave() {
    try {
      setSaving(true); setMsg("");
      const legal = (legalName || "PRIETO INSURANCE SOLUTIONS LLC").trim();
      const slugFromName = normSlug(name) || slug || "your-agency";

      const payload = {
        name,
        slug: slugFromName, // auto from name
        logo_url: logoUrl || null,
        theme: { primary, ink },
        is_public: isPublic,
        public_slug: (publicSlug || slugFromName || "your-agency").toLowerCase(),
        legal_name: legal,
        calendly_url: calendlyUrl || null
      };

      await upsertMyAgency(payload);
      setSlug(slugFromName);
      setMsg("Saved agency settings.");
    } catch (e) {
      setMsg(String(e.message || e));
    } finally {
      setSaving(false);
    }
  }

  async function handlePublish() {
    try {
      setPublishing(true); setMsg("");
      const legal = (legalName || "PRIETO INSURANCE SOLUTIONS LLC").trim();
      const slugFromName = normSlug(name) || slug || "your-agency";
      const pubSlug = (publicSlug || slugFromName || "your-agency").toLowerCase().replace(/\s+/g, "-");

      await upsertMyAgency({
        name,
        slug: slugFromName, // auto from name
        logo_url: logoUrl || null,
        theme: { primary, ink },
        is_public: true,
        public_slug: pubSlug,
        legal_name: legal,
        calendly_url: calendlyUrl || null
      });

      setIsPublic(true);
      setPublicSlug(pubSlug);
      setSlug(slugFromName);
      setMsg("Published! Your page is now public.");
    } catch (e) {
      setMsg(String(e.message || e));
    } finally {
      setPublishing(false);
    }
  }

  const publicUrl = `${window.location.origin}/a/${(publicSlug || normSlug(name) || "your-agency")}`;

  return (
    <section className="section">
      <div className="container">
        <div className="row" style={{ justifyContent: "space-between" }}>
          <h2 className="h2">Agency Console</h2>
          <span className="badge">Authenticated</span>
        </div>

        {msg && (
          <div className="sub" style={{ margin: "8px 0", color: /saved|uploaded|copied|created|disabled|Published/i.test(msg) ? "green" : "crimson" }}>
            {msg}
          </div>
        )}

        <div className="grid grid-3" style={{ marginTop: 8 }}>
          {/* Brand */}
          <div className="card">
            <div className="row" style={{ gap: 8 }}><Settings2 size={16} /><strong>Brand</strong></div>
            <div className="sep" />
            <label>Agency Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} style={input} />
            {/* Slug is auto from name */}
            <div className="sub" style={{ marginTop: 6 }}>
              Slug will be <code>{name ? normSlug(name) : slug || "your-agency"}</code>
            </div>

            <div className="row" style={{ gap: 16, marginTop: 12, flexWrap: "wrap" }}>
              <ColorPicker label="Primary Color" value={primary} setValue={setPrimary} />
              <ColorPicker label="Heading Color" value={ink} setValue={setInk} />
            </div>

            <div style={{ marginTop: 12 }}>
              <div className="sub" style={{ marginBottom: 6 }}>Logo</div>
              <label className="btn btn-ghost" style={{ display: "inline-flex", gap: 8, alignItems: "center", cursor: "pointer" }}>
                <Upload size={16} /> Upload logo
                <input type="file" accept="image/*" onChange={handleLogoFile} style={{ display: "none" }} />
              </label>
              {logoUrl && <div style={{ marginTop: 8 }}><img src={logoUrl} alt="logo preview" style={{ maxHeight: 44 }} /></div>}
            </div>

            <div className="row" style={{ gap: 10, marginTop: 14 }}>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save"}</button>
            </div>
          </div>

          {/* Curriculum (placeholder content; DB next phase) */}
          <div className="card">
            <div className="row" style={{ gap: 8 }}><Film size={16} /><strong>Curriculum</strong></div>
            <div className="sub" style={{ marginTop: 6 }}>Pre-Exam / Post-Exam / Pre-Sales</div>
            <div className="sep" />
            <ul style={{ paddingLeft: 18 }}>
              <li>Pre-Exam (4 lessons)</li>
              <li>Post-Exam (4 lessons)</li>
              <li>Pre-Sales (4 lessons)</li>
            </ul>
          </div>

          {/* Team from DB */}
          <div className="card">
            <div className="row" style={{ gap: 8 }}><Users size={16} /><strong>Team</strong></div>
            <div className="sep" />
            <table className="table">
              <thead><tr><th>Email</th><th>Role</th><th>Progress</th></tr></thead>
              <tbody>
                {agents.map((a, i) => (
                  <tr key={i}>
                    <td>{a.user_email}</td>
                    <td><span className="badge">{a.role}</span></td>
                    <td>{a.progress ?? 0}%</td>
                  </tr>
                ))}
                {agents.length === 0 && <tr><td colSpan="3" className="sub">No agents yet</td></tr>}
              </tbody>
            </table>
          </div>

          {/* Invites */}
          <div className="card" style={{ gridColumn: "1 / -1" }}>
            <div className="row" style={{ gap: 8 }}><Settings2 size={16} /><strong>Invite Agents</strong></div>
            <div className="sep" />

            <div className="row" style={{ gap: 10, flexWrap: "wrap" }}>
              <button className="btn btn-primary" onClick={generateInvite}>Generate invite code</button>
              <div className="sub">Codes expire in 7 days • 1 use (owner can disable)</div>
            </div>

            <table className="table" style={{ marginTop: 12 }}>
              <thead>
                <tr><th>Code</th><th>Status</th><th>Expires</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {invites.length === 0 && (
                  <tr><td className="sub" colSpan="4">No invites yet</td></tr>
                )}
                {invites.map(inv => {
                  const url = `${window.location.origin}/login/agent?code=${encodeURIComponent(inv.code)}`;
                  return (
                    <tr key={inv.id}>
                      <td><code>{inv.code}</code></td>
                      <td><span className="badge">{inv.status}</span></td>
                      <td>{inv.expires_at ? new Date(inv.expires_at).toLocaleString() : "—"}</td>
                      <td className="row" style={{ gap: 8 }}>
                        <button className="btn btn-ghost" onClick={() => copy(url)} title="Copy signup link">
                          <ClipboardCopy size={14} /> Copy link
                        </button>
                        {inv.status === "active" && (
                          <button className="btn btn-ghost" onClick={() => disableInvite(inv.id)} title="Disable">
                            <Ban size={14} /> Disable
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Public page controls */}
          <div className="card" style={{ gridColumn: "1 / -1" }}>
            <div className="row" style={{ gap: 8 }}><LayoutDashboard size={16} /><strong>Public Recruiting Page</strong></div>
            <div className="sub" style={{ marginTop: 6 }}>
              Build your public landing page to book calls with recruits. Toggle visibility and customize your URL.
            </div>
            <div className="sep" />

            <label className="row" style={{ gap: 10, alignItems: "center" }}>
              <input
                type="checkbox"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
              /> <span>Make page public</span>
            </label>

            <label style={{ marginTop: 10 }}>Public URL slug</label>
            <input
              value={publicSlug}
              onChange={(e) => setPublicSlug(e.target.value.replace(/\s+/g, "-").toLowerCase())}
              style={input}
              placeholder="my-agency"
            />

            <label style={{ marginTop: 10 }}>Calendly URL (optional)</label>
            <input
              value={calendlyUrl}
              onChange={(e) => setCalendlyUrl(e.target.value)}
              style={input}
              placeholder="https://calendly.com/your-link"
            />

            <div className="sub" style={{ marginTop: 10 }}>
              Your page will be live at: <a href={publicUrl} target="_blank" rel="noreferrer">{publicUrl}</a>
            </div>

            <div className="row" style={{ gap: 8, marginTop: 10, flexWrap: "wrap" }}>
              <button className="btn btn-primary" onClick={handlePublish} disabled={publishing}>
                {publishing ? "Publishing..." : (isPublic ? "Republish" : "Publish")}
              </button>
              <button className="btn btn-ghost" onClick={() => copy(publicUrl)}>
                <ClipboardCopy size={14} /> Copy public link
              </button>
              <a className="btn btn-ghost" href={publicUrl} target="_blank" rel="noreferrer">Open</a>
            </div>

            <div className="sep" style={{ marginTop: 12 }} />

            <div className="sub" style={{ marginTop: 6 }}>LLC (optional)</div>
            <input
              value={legalName}
              onChange={(e) => setLegalName(e.target.value)}
              style={input}
              placeholder="Your LLC (defaults to PRIETO INSURANCE SOLUTIONS LLC)"
            />
            <div className="sub" style={{ marginTop: 6 }}>
              If blank, it will default to <strong>PRIETO INSURANCE SOLUTIONS LLC</strong> on your public page.
            </div>
          </div>

          {/* Live preview */}
          <div className="card" style={{ gridColumn: "1 / -1" }}>
            <div className="row" style={{ gap: 8 }}><LayoutDashboard size={16} /><strong>Live Preview</strong></div>
            <div className="sep" />
            <Preview name={name} logoUrl={logoUrl} primary={primary} ink={ink} legalName={legalName} calendlyUrl={calendlyUrl} />
          </div>
        </div>
      </div>
    </section>
  );
}

function ColorPicker({ label, value, setValue }) {
  return (
    <div>
      <div className="sub" style={{ marginBottom: 6 }}>{label}</div>
      <div className="row" style={{ gap: 8 }}>
        <input type="color" value={value} onChange={(e) => setValue(e.target.value)} title={label} />
        <span className="kbd">{value}</span>
      </div>
    </div>
  );
}

function Preview({ name, logoUrl, primary, ink, legalName, calendlyUrl }) {
  const footerLegal = (legalName || "PRIETO INSURANCE SOLUTIONS LLC").trim();
  const hasCalendly = !!(calendlyUrl && calendlyUrl.trim());
  return (
    <div style={{ border: "1px dashed var(--border)", borderRadius: 12, overflow: "hidden" }}>
      <div style={{ background: "#fff" }}>
        <div style={{ padding: 16, display: "flex", alignItems: "center", gap: 10, borderBottom: "1px solid var(--border)" }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: `linear-gradient(135deg, ${lighten(primary, 30)} 0%, ${primary} 70%)` }} />
          {logoUrl ? <img src={logoUrl} alt="logo" style={{ height: 22 }} /> : <strong style={{ color: ink }}>{name}</strong>}
        </div>
        <div style={{ padding: 22 }}>
          <h3 style={{ margin: 0, color: ink }}>Join {name}</h3>
          <p className="sub" style={{ marginTop: 6 }}>Book a call and get onboarded fast.</p>
          <div className="row" style={{ marginTop: 12 }}>
            {hasCalendly ? (
              <a className="btn" href={calendlyUrl} target="_blank" rel="noreferrer" style={{ background: primary, color: "#fff", textDecoration: "none" }}>
                Book a Call
              </a>
            ) : (
              <button className="btn" style={{ background: primary, color: "#fff" }}>Book a Call</button>
            )}
            <button className="btn btn-ghost">Learn More</button>
          </div>
        </div>
        <div style={{ padding: "10px 22px", borderTop: "1px solid var(--border)", color: "var(--muted)", fontSize: 12 }}>
          © {new Date().getFullYear()} {footerLegal}
        </div>
      </div>
    </div>
  );
}

function lighten(hex, amount = 30) {
  const n = hex.replace("#", ""); const num = parseInt(n, 16);
  let r = (num >> 16) + amount, g = ((num >> 8) & 0xff) + amount, b = (num & 0xff) + amount;
  r = Math.min(255, Math.max(0, r)); g = Math.min(255, Math.max(0, g)); b = Math.min(255, Math.max(0, b));
  return `#${(r << 16 | g << 8 | b).toString(16).padStart(6, "0")}`;
}

const input = { width: "100%", border: "1px solid var(--border)", borderRadius: 10, padding: "10px 12px", outline: "none", fontSize: 14 };

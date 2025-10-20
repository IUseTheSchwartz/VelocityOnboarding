import React, { useEffect, useState } from "react";
import { Settings2, Users, Film, LayoutDashboard, Upload } from "lucide-react";
import { useTheme } from "../theme";
import { supabase } from "../lib/supabaseClient";
import { getCurrentAgency, listAgentsForMyAgency, upsertMyAgency } from "../lib/db";

export default function AgencyConsole() {
  const { theme, setTheme } = useTheme();
  const [name, setName] = useState("Your Agency");
  const [slug, setSlug] = useState("your-agency");
  const [primary, setPrimary] = useState(theme.primary);
  const [ink, setInk] = useState(theme.ink);
  const [logoUrl, setLogoUrl] = useState("");
  const [agents, setAgents] = useState([]);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    (async () => {
      const a = await getCurrentAgency();
      if (a) {
        setName(a.name || "Your Agency");
        setSlug(a.slug || "your-agency");
        setLogoUrl(a.logo_url || "");
        if (a.theme?.primary) setPrimary(a.theme.primary);
        if (a.theme?.ink) setInk(a.theme.ink);
        setTheme(a.theme || theme);
      }
      const list = await listAgentsForMyAgency();
      setAgents(list);
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { setTheme({ primary, ink }); }, [primary, ink, setTheme]);

  async function handleLogoFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Ensure bucket exists: 'agency-logos'
    const fileName = `${Date.now()}_${file.name.replace(/\s+/g,'_')}`;
    const { data, error } = await supabase.storage
      .from("agency-logos")
      .upload(fileName, file, { upsert: false });
    if (error) return setMsg(error.message);

    const { data: pub } = supabase.storage.from("agency-logos").getPublicUrl(data.path);
    setLogoUrl(pub.publicUrl);
    setMsg("Logo uploaded.");
  }

  async function handleSave() {
    try {
      setSaving(true); setMsg("");
      const saved = await upsertMyAgency({
        name,
        slug,
        logo_url: logoUrl || null,
        theme: { primary, ink },
      });
      setMsg("Saved agency settings.");
    } catch (e) {
      setMsg(String(e.message || e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="section">
      <div className="container">
        <div className="row" style={{ justifyContent: "space-between" }}>
          <h2 className="h2">Agency Console</h2>
          <span className="badge">Authenticated</span>
        </div>

        {msg && <div className="sub" style={{ margin: "8px 0", color: msg.includes("Saved") ? "green" : "crimson" }}>{msg}</div>}

        <div className="grid grid-3" style={{ marginTop: 8 }}>
          {/* Brand */}
          <div className="card">
            <div className="row" style={{ gap: 8 }}><Settings2 size={16}/><strong>Brand</strong></div>
            <div className="sep" />
            <label>Agency Name</label>
            <input value={name} onChange={(e)=>setName(e.target.value)} style={input} />
            <label style={{ marginTop: 8 }}>Agency Slug (for URL)</label>
            <input value={slug} onChange={(e)=>setSlug(e.target.value.replace(/\s+/g,'-').toLowerCase())} style={input} />

            <div className="row" style={{ gap: 16, marginTop: 12, flexWrap: "wrap" }}>
              <ColorPicker label="Primary Color" value={primary} setValue={setPrimary} />
              <ColorPicker label="Heading Color" value={ink} setValue={setInk} />
            </div>

            <div style={{ marginTop: 12 }}>
              <div className="sub" style={{ marginBottom: 6 }}>Logo</div>
              <label className="btn btn-ghost" style={{ display: "inline-flex", gap: 8, alignItems: "center", cursor: "pointer" }}>
                <Upload size={16}/> Upload logo
                <input type="file" accept="image/*" onChange={handleLogoFile} style={{ display: "none" }} />
              </label>
              {logoUrl && <div style={{ marginTop: 8 }}><img src={logoUrl} alt="logo preview" style={{ maxHeight: 44 }}/></div>}
            </div>

            <div className="row" style={{ gap: 10, marginTop: 14 }}>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save"}</button>
            </div>
          </div>

          {/* Curriculum (placeholder content; DB next phase) */}
          <div className="card">
            <div className="row" style={{ gap: 8 }}><Film size={16}/><strong>Curriculum</strong></div>
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
            <div className="row" style={{ gap: 8 }}><Users size={16}/><strong>Team</strong></div>
            <div className="sep" />
            <table className="table">
              <thead><tr><th>Email</th><th>Role</th><th>Progress</th></tr></thead>
              <tbody>
                {agents.map((a,i)=>(
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

          {/* Live preview */}
          <div className="card" style={{ gridColumn: "1 / -1" }}>
            <div className="row" style={{ gap: 8 }}><LayoutDashboard size={16}/><strong>Live Preview</strong></div>
            <div className="sep" />
            <Preview name={name} logoUrl={logoUrl} primary={primary} ink={ink} />
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
        <input type="color" value={value} onChange={(e)=>setValue(e.target.value)} title={label} />
        <span className="kbd">{value}</span>
      </div>
    </div>
  );
}

function Preview({ name, logoUrl, primary, ink }) {
  return (
    <div style={{ border: "1px dashed var(--border)", borderRadius: 12, overflow: "hidden" }}>
      <div style={{ background: "#fff" }}>
        <div style={{ padding: 16, display: "flex", alignItems: "center", gap: 10, borderBottom: "1px solid var(--border)" }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: `linear-gradient(135deg, ${lighten(primary,30)} 0%, ${primary} 70%)` }} />
          {logoUrl ? <img src={logoUrl} alt="logo" style={{ height: 22 }} /> : <strong style={{ color: ink }}>{name}</strong>}
        </div>
        <div style={{ padding: 22 }}>
          <h3 style={{ margin: 0, color: ink }}>Welcome to {name}</h3>
          <p className="sub" style={{ marginTop: 6 }}>Your agency’s white-labeled onboarding hub.</p>
          <div className="row" style={{ marginTop: 12 }}>
            <button className="btn" style={{ background: primary, color: "#fff" }}>Start Pre-Exam</button>
            <button className="btn btn-ghost">View Curriculum</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function lighten(hex, amount=30) {
  const n = hex.replace("#",""); const num = parseInt(n,16);
  let r=(num>>16)+amount, g=((num>>8)&0xff)+amount, b=(num&0xff)+amount;
  r=Math.min(255,Math.max(0,r)); g=Math.min(255,Math.max(0,g)); b=Math.min(255,Math.max(0,b));
  return `#${(r<<16 | g<<8 | b).toString(16).padStart(6,"0")}`;
}

const input = { width:"100%", border:"1px solid var(--border)", borderRadius:10, padding:"10px 12px", outline:"none", fontSize:14 };

import React, { useEffect, useMemo, useState } from "react";
import { Settings2, Users, Film, LayoutDashboard, Upload, Droplet } from "lucide-react";
import { useTheme } from "../theme";
import { loadAgency, saveAgency, loadAgents } from "../lib/storage";

export default function AgencyConsole() {
  const { theme, setTheme } = useTheme();
  const existing = useMemo(() => loadAgency(), []);
  const [name, setName] = useState(existing?.name || "Your Agency");
  const [slug, setSlug] = useState(existing?.slug || "your-agency");
  const [primary, setPrimary] = useState(existing?.theme?.primary || theme.primary);
  const [ink, setInk] = useState(existing?.theme?.ink || theme.ink);
  const [logoUrl, setLogoUrl] = useState(existing?.logoUrl || "");
  const agents = loadAgents();

  // propagate to ThemeProvider for live preview
  useEffect(() => { setTheme({ primary, ink }); }, [primary, ink, setTheme]);

  function handleLogoFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setLogoUrl(url);
  }

  function handleSave() {
    const settings = { name, slug, logoUrl, theme: { primary, ink } };
    saveAgency(settings);
    alert("Saved agency settings to local preview.");
  }

  return (
    <section className="section">
      <div className="container">
        <div className="row" style={{ justifyContent: "space-between" }}>
          <h2 className="h2">Agency Console (demo)</h2>
          <span className="badge">Preview mode</span>
        </div>

        <div className="grid grid-3" style={{ marginTop: 8 }}>
          {/* Brand builder */}
          <div className="card">
            <div className="row" style={{ gap: 8 }}><Settings2 size={16}/><strong>Brand</strong></div>
            <div className="sep" />
            <label>Agency Name</label>
            <input value={name} onChange={(e)=>setName(e.target.value)} style={input} />
            <label style={{ marginTop: 8 }}>Agency Slug (for URL)</label>
            <input value={slug} onChange={(e)=>setSlug(e.target.value.replace(/\s+/g,'-').toLowerCase())} style={input} />

            <div className="row" style={{ gap: 16, marginTop: 12, flexWrap: "wrap" }}>
              <div>
                <div className="sub" style={{ marginBottom: 6 }}>Primary Color</div>
                <div className="row" style={{ gap: 8 }}>
                  <input type="color" value={primary} onChange={(e)=>setPrimary(e.target.value)} title="Primary color" />
                  <span className="kbd">{primary}</span>
                </div>
              </div>
              <div>
                <div className="sub" style={{ marginBottom: 6 }}>Heading Color</div>
                <div className="row" style={{ gap: 8 }}>
                  <input type="color" value={ink} onChange={(e)=>setInk(e.target.value)} title="Heading color" />
                  <span className="kbd">{ink}</span>
                </div>
              </div>
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
              <button className="btn btn-primary" onClick={handleSave}>Save</button>
              <button className="btn btn-ghost" onClick={()=>{setName("Your Agency");setSlug("your-agency");setPrimary("#1E63F0");setInk("#0B1535");setLogoUrl("");}}>
                Reset
              </button>
            </div>
          </div>

          {/* Curriculum overview (static) */}
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

          {/* Team table (demo from local storage) */}
          <div className="card">
            <div className="row" style={{ gap: 8 }}><Users size={16}/><strong>Team</strong></div>
            <div className="sep" />
            <table className="table">
              <thead><tr><th>Agent</th><th>Status</th><th>Progress</th></tr></thead>
              <tbody>
                {agents.map((a,i)=>(
                  <tr key={i}>
                    <td>{a.name}</td>
                    <td><span className="badge">{a.status}</span></td>
                    <td>{a.progress}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Live preview */}
          <div className="card" style={{ gridColumn: "1 / -1" }}>
            <div className="row" style={{ gap: 8 }}><LayoutDashboard size={16}/><strong>Live Preview</strong></div>
            <div className="sep" />
            <PreviewArea name={name} logoUrl={logoUrl} primary={primary} ink={ink} />
          </div>
        </div>
      </div>
    </section>
  );
}

function PreviewArea({ name, logoUrl, primary, ink }) {
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

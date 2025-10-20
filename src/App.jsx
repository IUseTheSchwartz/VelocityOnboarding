import { useState } from "react";
import {
  Rocket,
  CheckCircle2,
  Users,
  Film,
  LayoutDashboard,
  Settings2,
  MessageSquare,
  Lock,
  LogIn,
  CreditCard,
  BarChart3,
  HelpCircle,
} from "lucide-react";

/**
 * VelocityOnboard — zero-backend UI shell (light/blue)
 * Pages: Landing, Login, Sign Up, Agent (demo), Agency Console (demo), Super Admin (demo)
 * All forms are non-functional; buttons just switch "views".
 */

const PRICING = {
  setup: [
    {
      tier: "Starter",
      price: "$1,499 one-time",
      bullets: [
        "Brand, colors, logo placement",
        "Base life-insurance curriculum",
      ],
    },
    {
      tier: "Pro",
      price: "$2,499 one-time",
      tag: "Most popular",
      bullets: [
        "Everything in Starter",
        "Custom welcome video",
        "Contracting packet walkthrough",
        "CRM quick links",
      ],
    },
    {
      tier: "Elite",
      price: "$3,499 one-time",
      bullets: [
        "Everything in Pro",
        "3 custom micro-videos (scripts, rebuttals, dial day)",
        "Migration support",
      ],
    },
  ],
  monthly: [
    { tier: "Standard", price: "$399/mo", sub: "Includes up to 25 agents" },
    { tier: "Scale", price: "$699/mo", sub: "Includes up to 60 agents" },
  ],
  overage: "+$6/agent/mo beyond included seats",
  addons: [
    { name: "SMS nudges", price: "+$49/mo" },
    { name: "Custom micro-videos (3/mo)", price: "+$199/mo" },
    { name: "Quarterly live workshop", price: "+$299/qtr" },
  ],
};

export default function App() {
  const [view, setView] = useState("landing");

  return (
    <div>
      <Nav view={view} onNav={setView} />
      {view === "landing" && <Landing onStart={() => setView("signup")} onDemo={() => setView("owner")} />}
      {view === "login" && <Auth mode="login" onSwitch={() => setView("signup")} onSuccess={() => setView("owner")} />}
      {view === "signup" && <Auth mode="signup" onSwitch={() => setView("login")} onSuccess={() => setView("owner")} />}
      {view === "agent" && <AgentPortal onBack={() => setView("landing")} />}
      {view === "owner" && <OwnerConsole onBack={() => setView("landing")} onAgent={() => setView("agent")} />}
      {view === "super" && <SuperAdmin onBack={() => setView("landing")} />}
      <Footer />
    </div>
  );
}

function Nav({ view, onNav }) {
  return (
    <div className="nav">
      <div className="container" style={{ display: "flex", alignItems: "center", gap: 16, padding: "12px 0" }}>
        <div className="brand">
          <div className="brand-mark" />
          <div>VelocityOnboard</div>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: 6, flexWrap: "wrap" }}>
          {[
            ["Landing", "landing"],
            ["Login", "login"],
            ["Sign up", "signup"],
            ["Agent (demo)", "agent"],
            ["Agency Console", "owner"],
            ["Super Admin", "super"],
          ].map(([label, key]) => (
            <button
              key={key}
              className="btn btn-ghost"
              style={{ background: view === key ? "var(--panel)" : "transparent" }}
              onClick={() => onNav(key)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Landing (marketing) */
function Landing({ onStart, onDemo }) {
  return (
    <>
      <section className="hero">
        <div className="container">
          <div className="badge">
            <Rocket size={16} /> Done-for-you onboarding for life agencies
          </div>
          <h1 className="h1">Onboard life agents in days, not months.</h1>
          <p className="sub" style={{ maxWidth: 700 }}>
            We build a white-labeled training hub for your agency—study plan to first sale—with checklists, quizzes,
            progress tracking, and Q&amp;A.
          </p>
          <div style={{ display: "flex", gap: 10, marginTop: 16, flexWrap: "wrap" }}>
            <button className="btn btn-primary" onClick={onStart}>Start demo</button>
            <button className="btn btn-ghost" onClick={onDemo}>View console preview</button>
          </div>

          <div className="grid grid-3" style={{ marginTop: 28 }}>
            <Feature
              icon={<Film size={18} />}
              title="Guided lessons"
              desc="Pre-Exam, Post-Exam, and Pre-Sales tracks with videos & quick reads."
            />
            <Feature
              icon={<CheckCircle2 size={18} />}
              title="Checklists & quizzes"
              desc="Gate progress with required steps and lightweight quizzes."
            />
            <Feature
              icon={<Users size={18} />}
              title="Team progress"
              desc="Owners see who’s stuck, who’s launch-ready."
            />
          </div>
        </div>
      </section>

      <section className="section" style={{ background: "var(--panel)" }}>
        <div className="container">
          <h2 className="h2">Pricing</h2>
          <p className="sub">Setup fee covers branding & content tailoring. Monthly covers hosting, updates, and support.</p>

          <div className="grid grid-3" style={{ marginTop: 16 }}>
            {PRICING.setup.map((p) => (
              <div key={p.tier} className="card">
                <div className="row" style={{ justifyContent: "space-between" }}>
                  <strong>{p.tier}</strong>
                  {p.tag && <span className="badge">{p.tag}</span>}
                </div>
                <div className="h2" style={{ marginTop: 6 }}>{p.price}</div>
                <ul style={{ paddingLeft: 18, marginTop: 6 }}>
                  {p.bullets.map((b, i) => <li key={i}>{b}</li>)}
                </ul>
              </div>
            ))}
          </div>

          <div className="grid grid-2" style={{ marginTop: 16 }}>
            {PRICING.monthly.map((p) => (
              <div key={p.tier} className="card">
                <strong>{p.tier}</strong>
                <div className="h2" style={{ marginTop: 6 }}>{p.price}</div>
                <div className="sub">{p.sub}</div>
              </div>
            ))}
          </div>

          <div className="sub" style={{ marginTop: 8 }}>
            Overages: {PRICING.overage}. Add-ons: {PRICING.addons.map(a => `${a.name} (${a.price})`).join(", ")}.
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container grid grid-3">
          <MiniCard icon={<LayoutDashboard size={16} />} title="Owner console" desc="Brand settings, curriculum, invites, and progress." />
          <MiniCard icon={<MessageSquare size={16} />} title="Lesson Q&A" desc="Agents ask, owners answer. Escalate if needed." />
          <MiniCard icon={<BarChart3 size={16} />} title="Readiness metrics" desc="See time-to-first-sale and bottlenecks at a glance." />
        </div>
      </section>
    </>
  );
}

function Feature({ icon, title, desc }) {
  return (
    <div className="card">
      <div className="row">
        <div className="badge">{icon} {title}</div>
      </div>
      <div className="sub" style={{ marginTop: 8 }}>{desc}</div>
    </div>
  );
}
function MiniCard({ icon, title, desc }) {
  return (
    <div className="card">
      <div className="row" style={{ gap: 8 }}>
        {icon} <strong>{title}</strong>
      </div>
      <div className="sub" style={{ marginTop: 6 }}>{desc}</div>
    </div>
  );
}

/** Auth (mock) */
function Auth({ mode = "login", onSwitch, onSuccess }) {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");

  return (
    <section className="section">
      <div className="container" style={{ maxWidth: 520 }}>
        <div className="card">
          <div className="row" style={{ gap: 8 }}>
            {mode === "login" ? <LogIn size={18} /> : <Lock size={18} />}
            <strong>{mode === "login" ? "Login" : "Create your account"}</strong>
          </div>
          <div className="sep" />
          <label>Email</label>
          <input
            value={email}
            onChange={(e)=>setEmail(e.target.value)}
            placeholder="you@agency.com"
            style={inputStyle}
          />
          <label style={{ marginTop: 10 }}>Password</label>
          <input
            type="password"
            value={pass}
            onChange={(e)=>setPass(e.target.value)}
            placeholder="••••••••"
            style={inputStyle}
          />
          <div className="row" style={{ gap: 10, marginTop: 14 }}>
            <button className="btn btn-primary" onClick={onSuccess}>
              {mode === "login" ? "Login" : "Create account"}
            </button>
            <button className="btn btn-ghost" onClick={onSwitch}>
              {mode === "login" ? "Need an account? Sign up" : "Have an account? Log in"}
            </button>
          </div>
        </div>
        <p className="sub" style={{ marginTop: 10 }}>
          This is a visual preview only. No data is saved.
        </p>
      </div>
    </section>
  );
}

const inputStyle = {
  width: "100%",
  border: "1px solid var(--border)",
  borderRadius: 10,
  padding: "10px 12px",
  outline: "none",
  fontSize: 14,
};

/** Agent Portal (demo) */
function AgentPortal({ onBack }) {
  const phases = [
    { name: "Pre-Exam", items: ["Study plan overview", "State licensing basics", "Practice quiz 1", "Exam tips video"] },
    { name: "Post-Exam", items: ["Carrier contracting", "E&O + AML", "Tools setup checklist", "Profile & compliance"] },
    { name: "Pre-Sales", items: ["Scripts & rebuttals", "Dial day expectations", "CRM quickstart", "First 10 leads plan"] },
  ];

  return (
    <section className="section">
      <div className="container">
        <div className="row" style={{ justifyContent: "space-between" }}>
          <h2 className="h2">Agent Portal (demo)</h2>
          <button className="btn btn-ghost" onClick={onBack}>Back</button>
        </div>
        <div className="grid grid-3" style={{ marginTop: 8 }}>
          {phases.map((p) => (
            <div key={p.name} className="card">
              <div className="row" style={{ justifyContent: "space-between" }}>
                <strong>{p.name}</strong>
                <span className="badge"><CheckCircle2 size={14}/> 0% complete</span>
              </div>
              <ul style={{ paddingLeft: 18, marginTop: 6 }}>
                {p.items.map((it, i) => <li key={i}>{it}</li>)}
              </ul>
              <div className="row" style={{ gap: 10, marginTop: 10 }}>
                <button className="btn btn-primary">Continue</button>
                <button className="btn btn-ghost">Ask a question</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/** Agency Owner Console (demo) */
function OwnerConsole({ onBack, onAgent }) {
  return (
    <section className="section">
      <div className="container">
        <div className="row" style={{ justifyContent: "space-between" }}>
          <h2 className="h2">Agency Console (demo)</h2>
          <div className="row" style={{ gap: 8 }}>
            <button className="btn btn-ghost" onClick={onAgent}>View as Agent</button>
            <button className="btn btn-ghost" onClick={onBack}>Back</button>
          </div>
        </div>

        <div className="grid grid-3" style={{ marginTop: 8 }}>
          <div className="card">
            <div className="row" style={{ gap: 8 }}><Settings2 size={16}/><strong>Brand</strong></div>
            <div className="sub" style={{ marginTop: 6 }}>Logo, primary color, welcome headline.</div>
            <div className="sep" />
            <div className="row" style={{ gap: 10 }}>
              <span className="badge">Logo: upload.png</span>
              <span className="badge">Primary: <span className="kbd">#1E63F0</span></span>
            </div>
          </div>

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

          <div className="card">
            <div className="row" style={{ gap: 8 }}><Users size={16}/><strong>Team</strong></div>
            <div className="sep" />
            <table className="table">
              <thead><tr><th>Agent</th><th>Status</th><th>Progress</th></tr></thead>
              <tbody>
                <tr><td>Avery L.</td><td><span className="badge">Invited</span></td><td>—</td></tr>
                <tr><td>Jordan S.</td><td><span className="badge">Active</span></td><td>12%</td></tr>
                <tr><td>Riley P.</td><td><span className="badge">Active</span></td><td>0%</td></tr>
              </tbody>
            </table>
          </div>

          <div className="card">
            <div className="row" style={{ gap: 8 }}><LayoutDashboard size={16}/><strong>Progress</strong></div>
            <div className="sep" />
            <ul style={{ paddingLeft: 18 }}>
              <li>Stuck &gt; 5 days: 2 agents</li>
              <li>Launch-ready: 1 agent</li>
              <li>Avg. time to Pre-Sales: 11 days</li>
            </ul>
          </div>

          <div className="card">
            <div className="row" style={{ gap: 8 }}><MessageSquare size={16}/><strong>Q&A</strong></div>
            <div className="sep" />
            <ul style={{ paddingLeft: 18 }}>
              <li>“Do I need AML before contracting?” — <span className="badge">Open</span></li>
              <li>“Where’s the dial day script?” — <span className="badge">Answered</span></li>
            </ul>
          </div>

          <div className="card">
            <div className="row" style={{ gap: 8 }}><CreditCard size={16}/><strong>Billing</strong></div>
            <div className="sep" />
            <div className="sub">Plan: <strong>Standard</strong> — $399/mo • Next invoice: Nov 1</div>
            <div className="row" style={{ gap: 10, marginTop: 10 }}>
              <button className="btn btn-ghost">Manage payment method</button>
              <button className="btn btn-link">View invoices</button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/** Super Admin (demo) */
function SuperAdmin({ onBack }) {
  return (
    <section className="section">
      <div className="container">
        <div className="row" style={{ justifyContent: "space-between" }}>
          <h2 className="h2">Super Admin (demo)</h2>
          <button className="btn btn-ghost" onClick={onBack}>Back</button>
        </div>

        <div className="grid grid-3" style={{ marginTop: 8 }}>
          <div className="card">
            <div className="row" style={{ gap: 8 }}><LayoutDashboard size={16}/><strong>Agencies</strong></div>
            <div className="sep" />
            <table className="table">
              <thead><tr><th>Name</th><th>Status</th><th>Agents</th></tr></thead>
              <tbody>
                <tr><td>PrimeLife Group</td><td><span className="badge">Active</span></td><td>31</td></tr>
                <tr><td>Summit Shield</td><td><span className="badge">Trial</span></td><td>9</td></tr>
                <tr><td>Blue Oak</td><td><span className="badge">Past Due</span></td><td>54</td></tr>
              </tbody>
            </table>
          </div>

          <div className="card">
            <div className="row" style={{ gap: 8 }}><Film size={16}/><strong>Templates</strong></div>
            <div className="sep" />
            <ul style={{ paddingLeft: 18 }}>
              <li>Pre-Exam v1.2</li>
              <li>Post-Exam v1.0</li>
              <li>Pre-Sales v1.3</li>
            </ul>
          </div>

          <div className="card">
            <div className="row" style={{ gap: 8 }}><HelpCircle size={16}/><strong>Support Queue</strong></div>
            <div className="sep" />
            <ul style={{ paddingLeft: 18 }}>
              <li>PrimeLife — add carrier video (awaiting)</li>
              <li>Blue Oak — billing issue (in review)</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="section" style={{ borderTop: "1px solid var(--border)" }}>
      <div className="container" style={{ display: "flex", gap: 12, alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" }}>
        <div className="brand"><div className="brand-mark" /><div>VelocityOnboard</div></div>
        <div className="sub">© {new Date().getFullYear()} VelocityOnboard • Life-insurance onboarding</div>
      </div>
    </footer>
  );
}

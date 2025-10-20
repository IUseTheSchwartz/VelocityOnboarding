import React from "react";
import { Film, CheckCircle2, Users, LayoutDashboard, MessageSquare, BarChart3, Rocket } from "lucide-react";

const PRICING = {
  setup: [
    { tier: "Starter", price: "$1,499 one-time", bullets: ["Brand, colors, logo placement", "Base life-insurance curriculum"] },
    { tier: "Pro", price: "$2,499 one-time", tag: "Most popular", bullets: ["Everything in Starter", "Custom welcome video", "Contracting packet walkthrough", "CRM quick links"] },
    { tier: "Elite", price: "$3,499 one-time", bullets: ["Everything in Pro", "3 custom micro-videos (scripts, rebuttals, dial day)", "Migration support"] },
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

export default function Landing() {
  return (
    <>
      <section className="hero">
        <div className="container">
          <div className="badge"><Rocket size={16}/> Done-for-you onboarding for life agencies</div>
          <h1 className="h1">Onboard life agents in days, not months.</h1>
          <p className="sub" style={{ maxWidth: 700 }}>
            We build a white-labeled training hub for your agency—study plan to first sale—with checklists, quizzes, progress tracking, and Q&amp;A.
          </p>

          <div className="grid grid-3" style={{ marginTop: 28 }}>
            <Feature icon={<Film size={18} />} title="Guided lessons" desc="Pre-Exam, Post-Exam, and Pre-Sales tracks with videos & quick reads." />
            <Feature icon={<CheckCircle2 size={18} />} title="Checklists & quizzes" desc="Gate progress with required steps and lightweight quizzes." />
            <Feature icon={<Users size={18} />} title="Team progress" desc="Owners see who’s stuck, who’s launch-ready." />
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
          <MiniCard icon={<Users size={16} />} title="Readiness metrics" desc="See time-to-first-sale and bottlenecks at a glance." />
        </div>
      </section>
    </>
  );
}

function Feature({ icon, title, desc }) {
  return (
    <div className="card">
      <div className="row"><div className="badge">{icon} {title}</div></div>
      <div className="sub" style={{ marginTop: 8 }}>{desc}</div>
    </div>
  );
}
function MiniCard({ icon, title, desc }) {
  return (
    <div className="card">
      <div className="row" style={{ gap: 8 }}>{icon} <strong>{title}</strong></div>
      <div className="sub" style={{ marginTop: 6 }}>{desc}</div>
    </div>
  );
}

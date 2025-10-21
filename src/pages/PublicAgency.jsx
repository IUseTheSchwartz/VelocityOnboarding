// src/pages/PublicAgency.jsx
import { useEffect, useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { ArrowRight, CheckCircle2, Clock4, Sparkles, Shield, Rocket, Users, PlayCircle } from "lucide-react";

/**
 * Public recruiting page for a published agency.
 * Reads by /a/:slug where :slug = agencies.public_slug
 */
export default function PublicAgency() {
  const { slug } = useParams();
  const [agency, setAgency] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch agency by public_slug and must be published
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("agencies")
        .select("name, logo_url, theme, legal_name, calendly_url, is_public")
        .eq("public_slug", slug)
        .eq("is_public", true)
        .maybeSingle();

      if (!cancelled) {
        if (!error) setAgency(data);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [slug]);

  if (loading) {
    return (
      <div className="container" style={{ padding: 32 }}>
        Loading…
      </div>
    );
  }

  if (!agency) {
    return (
      <div className="container" style={{ padding: 48 }}>
        <h2 style={{ margin: 0 }}>This page is unavailable.</h2>
        <p className="sub" style={{ marginTop: 8 }}>
          The agency may not be published yet, or the link is incorrect.
        </p>
        <div style={{ marginTop: 16 }}>
          <Link className="btn btn-ghost" to="/">Back to home</Link>
        </div>
      </div>
    );
  }

  const primary = agency.theme?.primary || "#1e63f0";
  const ink = agency.theme?.ink || "#0b1220";
  const legal = (agency.legal_name || "PRIETO INSURANCE SOLUTIONS LLC").trim();
  const heroGrad = `radial-gradient(1200px 500px at 50% -10%, ${withAlpha(primary, 0.20)} 0%, transparent 70%)`;

  const features = useMemo(() => ([
    { icon: <CheckCircle2 size={18} />, t: "Clear Playbook", d: "Day-1 steps, checklists, and scripts so you always know what’s next." },
    { icon: <Rocket size={18} />,       t: "Fast Ramp",      d: "Bite-size trainings and live help to get you producing quickly." },
    { icon: <Users size={18} />,        t: "Team Support",   d: "Mentorship, feedback, and accountability—we win together." },
    { icon: <Sparkles size={18} />,     t: "Tools that Work",d: "Dialers, messaging, and a simple CRM that keeps you focused." },
    { icon: <Clock4 size={18} />,       t: "Track Progress", d: "See your milestones and time-to-first-deal improve weekly." },
    { icon: <Shield size={18} />,       t: "Grow Safely",    d: "Systems that scale with guardrails as you become a top producer." },
  ]), []);

  const calendlyBtn = agency.calendly_url ? (
    <a
      className="btn btn-primary"
      href={agency.calendly_url}
      target="_blank"
      rel="noreferrer"
      style={{ background: primary, textDecoration: "none", display: "inline-flex", gap: 8, alignItems: "center" }}
    >
      <PlayCircle size={16} /> Book a Call
    </a>
  ) : (
    <button className="btn btn-primary" style={{ background: primary, display: "inline-flex", gap: 8, alignItems: "center" }}>
      <PlayCircle size={16} /> Book a Call
    </button>
  );

  return (
    <div style={{ background: "#fff" }}>
      {/* Header */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          borderBottom: "1px solid var(--border)",
          background: "rgba(255,255,255,0.8)",
          backdropFilter: "saturate(120%) blur(8px)"
        }}
      >
        <div className="container" style={{ padding: 12, display: "flex", alignItems: "center", gap: 12 }}>
          <AgencyLogo src={agency.logo_url} name={agency.name} primary={primary} />
          <div style={{ fontWeight: 600, color: "var(--ink)" }}>{agency.name}</div>
          <div style={{ marginLeft: "auto" }}>
            <Link to="/" className="btn btn-ghost" style={{ textDecoration: "none" }}>
              VelocityOnboard
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section
        style={{
          backgroundImage: `${heroGrad}, ${gridPattern()}`,
          backgroundBlendMode: "multiply, normal",
          borderBottom: "1px solid var(--border)"
        }}
      >
        <div className="container" style={{ padding: "56px 0 28px" }}>
          <div className="badge" style={{ background: withAlpha(primary, 0.12), color: ink }}>
            Join {agency.name}
          </div>
          <h1 style={{ margin: "12px 0 10px", color: ink, lineHeight: 1.15 }}>
            Book a call and get onboarded fast.
          </h1>
          <p className="sub" style={{ maxWidth: 720 }}>
            We help new agents ramp quickly with a clear playbook, hands-on support, and a trackable path to first commissions.
          </p>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 18 }}>
            {calendlyBtn}
            <a className="btn btn-ghost" href="#learn" style={{ textDecoration: "none", display: "inline-flex", gap: 8, alignItems: "center" }}>
              Learn More <ArrowRight size={16} />
            </a>
          </div>
        </div>
      </section>

      {/* Social proof strip (subtle) */}
      <section className="container" style={{ padding: "18px 0 0" }}>
        <div
          className="card"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 18,
            padding: "10px 14px",
            background: "linear-gradient(180deg, #fff, #fafafa)",
            border: "1px solid var(--border)"
          }}
        >
          <span className="sub">Built for speed • Focused on results • Community you can count on</span>
        </div>
      </section>

      {/* Highlights */}
      <section id="learn" className="container" style={{ padding: "32px 0 48px" }}>
        <div className="grid-3">
          {features.map((f) => (
            <div key={f.t} className="card" style={{ display: "grid", gap: 8, padding: 16 }}>
              <div className="row" style={{ gap: 8, alignItems: "center" }}>
                <div
                  style={{
                    width: 28, height: 28, borderRadius: 8,
                    background: withAlpha(primary, 0.12),
                    display: "grid", placeItems: "center"
                  }}
                >
                  {f.icon}
                </div>
                <div style={{ fontWeight: 600, color: "var(--ink)" }}>{f.t}</div>
              </div>
              <div className="sub" style={{ color: "var(--ink)" }}>{f.d}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA panel */}
      <section style={{ borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)", background: "#fff" }}>
        <div className="container" style={{ padding: "28px 0" }}>
          <div className="card" style={{ padding: 18, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
            <div>
              <div className="sub" style={{ marginBottom: 4 }}>Ready to move?</div>
              <div style={{ fontWeight: 600, color: ink }}>Book a call—get your first-week plan today.</div>
            </div>
            {calendlyBtn}
          </div>
        </div>
      </section>

      {/* Footer / legal */}
      <footer>
        <div className="container" style={{ padding: "14px 0", fontSize: 12, color: "var(--muted)", display: "flex", alignItems: "center", gap: 10 }}>
          <span>© {new Date().getFullYear()} {legal}</span>
          <span style={{ marginLeft: "auto" }}>
            <Link to="/" className="sub" style={{ textDecoration: "none" }}>VelocityOnboard</Link>
          </span>
        </div>
      </footer>
    </div>
  );
}

/* ---------- Components & helpers ---------- */

function AgencyLogo({ src, name, primary }) {
  // Nice-looking logo container regardless of source dimensions
  const bg = `linear-gradient(135deg, ${lighten(primary, 28)} 0%, ${primary} 70%)`;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div
        style={{
          width: 40, height: 40, borderRadius: 10, overflow: "hidden",
          border: "1px solid var(--border)",
          background: "#fff",
          boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
          display: "grid", placeItems: "center"
        }}
      >
        {src ? (
          <img
            src={src}
            alt={`${name} logo`}
            style={{
              width: "90%", height: "90%",
              objectFit: "contain", objectPosition: "center",
              imageRendering: "auto",
              filter: "drop-shadow(0 1px 1px rgba(0,0,0,0.15))"
            }}
          />
        ) : (
          <div
            aria-hidden
            style={{
              width: "100%", height: "100%", display: "grid", placeItems: "center",
              background: bg, color: "#fff", fontWeight: 700
            }}
          >
            {initials(name)}
          </div>
        )}
      </div>
    </div>
  );
}

function initials(s = "") {
  const parts = s.split(/\s+/).filter(Boolean);
  const [a, b] = [parts[0]?.[0], parts[1]?.[0]];
  return (a || "?").toUpperCase() + (b ? b.toUpperCase() : "");
}

function lighten(hex, amount = 28) {
  const n = hex?.startsWith("#") ? hex.slice(1) : hex;
  if (!/^[0-9a-fA-F]{6}$/.test(n)) return hex || "#1e63f0";
  const num = parseInt(n, 16);
  let r = (num >> 16) + amount, g = ((num >> 8) & 0xff) + amount, b = (num & 0xff) + amount;
  r = Math.min(255, Math.max(0, r)); g = Math.min(255, Math.max(0, g)); b = Math.min(255, Math.max(0, b));
  return `#${(r << 16 | g << 8 | b).toString(16).padStart(6, "0")}`;
}

function withAlpha(hex, alpha = 0.2) {
  // convert #rrggbb to rgba
  const n = hex?.startsWith("#") ? hex.slice(1) : hex;
  if (!/^[0-9a-fA-F]{6}$/.test(n)) return `rgba(30,99,240,${alpha})`;
  const r = parseInt(n.slice(0, 2), 16);
  const g = parseInt(n.slice(2, 4), 16);
  const b = parseInt(n.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function gridPattern() {
  // a subtle grid background pattern
  return `radial-gradient(circle at 1px 1px, rgba(0,0,0,0.06) 1px, transparent 0) 0 0/20px 20px`;
}

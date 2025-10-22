// src/pages/PublicAgency.jsx
import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

/* ---------- local, defensive theme helpers (no external import) ---------- */
function normalizeTheme(t = {}) {
  return {
    primary: t.primary || "#1e63f0",
    primaryContrast: t.primaryContrast || "#ffffff",
    accent: t.accent || "#22c55e",
    accentContrast: t.accentContrast || "#0b1220",
    ink: t.ink || "#0b1220",
    muted: t.muted || "#6b7280",
    bg: t.bg || "#ffffff",
    surface: t.surface || "#ffffff",
    card: t.card || "#ffffff",
    border: t.border || "#e5e7eb",
    mode: t.mode || "light",
    heroPattern: t.heroPattern || "grid",
    heroTint: typeof t.heroTint === "number" ? t.heroTint : 0.2,
    radius: typeof t.radius === "number" ? t.radius : 12,
    elev: t.elev || "soft",
  };
}
function clamp01(n) { const x = Number(n); return Number.isFinite(x) ? Math.max(0, Math.min(1, x)) : 0; }
function lighten(hex, amount = 30) {
  const h = (hex || "#000000").replace("#", "");
  const ok = /^[0-9a-fA-F]{6}$/.test(h) ? h : "000000";
  const num = parseInt(ok, 16);
  let r = (num >> 16) + amount, g = ((num >> 8) & 0xff) + amount, b = (num & 0xff) + amount;
  r = Math.min(255, Math.max(0, r)); g = Math.min(255, Math.max(0, g)); b = Math.min(255, Math.max(0, b));
  return `#${(r << 16 | g << 8 | b).toString(16).padStart(6, "0")}`;
}
function heroStyleFromTheme(t) {
  const base = { background: "var(--surface)", borderBottom: "1px solid var(--border)" };
  const tint = clamp01(t.heroTint ?? 0.2);
  const overlay = `linear-gradient(rgba(0,0,0,${tint * 0.04}), rgba(0,0,0,${tint * 0.06}))`;
  if (t.heroPattern === "grid") {
    const grid = `linear-gradient(rgba(0,0,0,${tint * 0.03}) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(0,0,0,${tint * 0.03}) 1px, transparent 1px)`;
    return { ...base, backgroundImage: `${overlay}, ${grid}`, backgroundSize: "20px 20px, 20px 20px" };
  }
  if (t.heroPattern === "dots") {
    const dots = `radial-gradient(circle at 1px 1px, rgba(0,0,0,${tint * 0.05}) 1px, transparent 1px)`;
    return { ...base, backgroundImage: `${overlay}, ${dots}`, backgroundSize: "18px 18px" };
  }
  if (t.heroPattern === "gradient") {
    const g = `linear-gradient(135deg, ${lighten(t.primary, 40)} 0%, ${t.primary} 70%)`;
    return { ...base, backgroundImage: `${g}, ${overlay}`, backgroundBlendMode: "multiply" };
  }
  return base;
}

/* -------------------------------- component ------------------------------- */
export default function PublicAgency() {
  const { slug } = useParams();
  const [agency, setAgency] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setErr("");
      try {
        const { data, error } = await supabase
          .from("agencies")
          .select("name, logo_url, theme, legal_name, calendly_url, is_public")
          .eq("public_slug", slug)
          .eq("is_public", true)
          .maybeSingle();
        if (error) throw error;
        if (!cancelled) setAgency(data || null);
      } catch (e) {
        console.error("PublicAgency fetch error:", e);
        if (!cancelled) setErr(e?.message || String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [slug]);

  if (loading) {
    return <div className="container" style={{ padding: 48 }}><div className="sub">Loading…</div></div>;
  }

  if (err) {
    return (
      <div className="container" style={{ padding: 48 }}>
        <h2 style={{ marginTop: 0 }}>Something went wrong</h2>
        <div className="sub" style={{ marginTop: 8 }}>{err}</div>
        <div style={{ marginTop: 16 }}><Link className="btn btn-ghost" to="/">Back to home</Link></div>
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
        <div style={{ marginTop: 16 }}><Link className="btn btn-ghost" to="/">Back to home</Link></div>
      </div>
    );
  }

  const t = normalizeTheme(agency.theme);
  const cssVars = useMemo(() => ({
    /* colors */
    ["--primary"]: t.primary,
    ["--primary-contrast"]: t.primaryContrast,
    ["--accent"]: t.accent,
    ["--accent-contrast"]: t.accentContrast,
    ["--ink"]: t.ink,
    ["--muted"]: t.muted,
    ["--bg"]: t.bg,
    ["--surface"]: t.surface,
    ["--card"]: t.card,
    ["--border"]: t.border,
    /* shape/effects */
    ["--radius"]: `${t.radius}px`,
    ["--shadow"]:
      t.elev === "lifted" ? "0 20px 40px rgba(0,0,0,.08), 0 4px 10px rgba(0,0,0,.06)" :
      t.elev === "soft"   ? "0 12px 24px rgba(0,0,0,.06), 0 2px 6px rgba(0,0,0,.05)" :
                            "none",
  }), [t]);

  const heroStyle = heroStyleFromTheme(t);
  const legal = (agency.legal_name || "PRIETO INSURANCE SOLUTIONS LLC").trim();

  return (
    // Attach CSS variables to the whole page scope
    <div style={{ ...cssVars, background: "var(--bg)", minHeight: "100vh" }}>
      {/* Header */}
      <header style={{ borderBottom: "1px solid var(--border)", background: "var(--surface)", position: "sticky", top: 0, zIndex: 20 }}>
        <div className="container" style={{ padding: 14, display: "flex", alignItems: "center", gap: 12 }}>
          <Brand name={agency.name} logoUrl={agency.logo_url} primary={t.primary} />
          <div style={{ marginLeft: "auto" }}>
            <Link to="/" className="btn btn-ghost" style={{ textDecoration: "none" }}>VelocityOnboard</Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section style={{ ...heroStyle }}>
        <div className="container" style={{ padding: "64px 0 36px" }}>
          <span className="badge" style={{ background: "rgba(0,0,0,0.04)", border: "1px solid var(--border)" }}>
            Join {agency.name}
          </span>
          <h1 style={{ margin: "12px 0 10px", color: "var(--ink)", letterSpacing: "-0.02em", fontSize: 36 }}>
            Book a call and get onboarded fast.
          </h1>
          <p className="sub" style={{ maxWidth: 720, color: "var(--muted)" }}>
            We help new agents ramp quickly with a clear playbook, hands-on support, and a trackable path to first commissions.
          </p>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 18 }}>
            {agency.calendly_url ? (
              <a className="btn" href={agency.calendly_url} target="_blank" rel="noreferrer"
                 style={{ background: "var(--primary)", color: "var(--primary-contrast)", textDecoration: "none",
                          borderRadius: "var(--radius)", boxShadow: "var(--shadow)" }}>
                Book a Call
              </a>
            ) : (
              <button className="btn" style={{ background: "var(--primary)", color: "var(--primary-contrast)",
                                               borderRadius: "var(--radius)", boxShadow: "var(--shadow)" }}>
                Book a Call
              </button>
            )}
            <a className="btn btn-ghost" href="#learn" style={{ textDecoration: "none" }}>Learn More</a>
          </div>
        </div>
      </section>

      {/* Highlights */}
      <section id="learn" className="container" style={{ padding: "32px 0 48px" }}>
        <div className="grid-3">
          {FEATURES.map((f) => (
            <div key={f.t} className="card"
                 style={{ background: "var(--card)", border: "1px solid var(--border)",
                          borderRadius: "var(--radius)", boxShadow: "var(--shadow)" }}>
              <div className="badge" style={{ marginBottom: 8, background: "rgba(0,0,0,0.04)", border: "1px solid var(--border)" }}>{f.t}</div>
              <div style={{ color: "var(--ink)" }}>{f.d}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="container" style={{ paddingBottom: 56 }}>
        <h3 style={{ marginTop: 0, color: "var(--ink)" }}>FAQs</h3>
        <div className="card" style={{ display: "grid", gap: 10, background: "var(--card)",
                                       border: "1px solid var(--border)", borderRadius: "var(--radius)",
                                       boxShadow: "var(--shadow)" }}>
          {FAQS.map((qa) => (
            <div key={qa.q}>
              <div className="sub" style={{ fontWeight: 600 }}>{qa.q}</div>
              <div>{qa.a}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: "1px solid var(--border)", background: "var(--surface)" }}>
        <div className="container" style={{ padding: "12px 0", fontSize: 12, color: "var(--muted)" }}>
          © {new Date().getFullYear()} {legal}
        </div>
      </footer>
    </div>
  );
}

/* ----------------------------- subcomponents ------------------------------ */
function Brand({ name, logoUrl, primary }) {
  if (!logoUrl) {
    return (
      <div className="brand" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
        <div style={{
          width: 28, height: 28, borderRadius: 8,
          background: `linear-gradient(135deg, ${lighten(primary, 30)} 0%, ${primary} 70%)`
        }} />
        <strong style={{ color: "var(--ink)" }}>{name}</strong>
      </div>
    );
  }
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{
        height: 36, width: 160, display: "flex", alignItems: "center", justifyContent: "flex-start",
        borderRadius: "calc(var(--radius) - 4px)", background: "var(--card)", border: "1px solid var(--border)",
        padding: "6px 8px", boxShadow: "var(--shadow)"
      }}>
        <img
          src={logoUrl}
          alt={`${name} logo`}
          style={{ maxHeight: 24, maxWidth: 140, objectFit: "contain", display: "block" }}
          onError={(e) => { e.currentTarget.style.display = "none"; }}
        />
      </div>
      <strong style={{ color: "var(--ink)" }}>{name}</strong>
    </div>
  );
}

/* ---------------------------------- data ---------------------------------- */
const FEATURES = [
  { t: "Clear Playbook", d: "Day-1 steps, checklists, and scripts so you always know what’s next." },
  { t: "Fast Ramp", d: "Short trainings and live help so you can start producing quickly." },
  { t: "Team Support", d: "Mentorship, feedback, and accountability." },
  { t: "Tools that Work", d: "Dialers, messaging, and a simple CRM that keeps you focused." },
  { t: "Track Progress", d: "See your milestones and time-to-first-deal improve week over week." },
  { t: "Grow Your Book", d: "Systems that scale with you as you become a top producer." },
];
const FAQS = [
  { q: "What happens after I book?", a: "You'll meet with our team, review expectations, and get your first-week checklist." },
  { q: "Do I need experience?", a: "Nope. If you’re coachable and motivated, we’ll get you up to speed." },
  { q: "Is there training?", a: "Yes — short video modules plus live support during your first weeks." },
];

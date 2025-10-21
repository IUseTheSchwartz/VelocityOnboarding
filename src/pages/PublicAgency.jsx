// src/pages/PublicAgency.jsx
import { useEffect, useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { normalizeTheme } from "../theme";

/**
 * Public recruiting page for a published agency.
 * Reads by /a/:slug where :slug = agencies.public_slug
 * Uses Theme v2 tokens (with fallbacks) and CSS variables.
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

  // Normalize theme and expose CSS vars with safe fallbacks
  const t = normalizeTheme(agency.theme || {});
  const cssVars = useMemo(() => ({
    // colors
    ["--primary"]: t.primary,
    ["--primary-contrast"]: t.primaryContrast || "#ffffff",
    ["--accent"]: t.accent || "#22c55e",
    ["--accent-contrast"]: t.accentContrast || "#0b1220",
    ["--ink"]: t.ink || "#0b1535",
    ["--muted"]: t.muted || "#6b7280",
    ["--bg"]: t.bg || "#ffffff",
    ["--surface"]: t.surface || "#ffffff",
    ["--card"]: t.card || "#ffffff",
    ["--border"]: t.border || "#e5e7eb",
    // shape/effects
    ["--radius"]: `${Number.isFinite(t.radius) ? t.radius : 12}px`,
    ["--shadow"]:
      t.elev === "lifted" ? "0 20px 40px rgba(0,0,0,.08), 0 4px 10px rgba(0,0,0,.06)" :
      t.elev === "soft"   ? "0 12px 24px rgba(0,0,0,.06), 0 2px 6px rgba(0,0,0,.05)" :
                            "none",
  }), [t]);

  const legal = (agency.legal_name || "PRIETO INSURANCE SOLUTIONS LLC").trim();

  // Hero background style based on pattern + tint
  const heroStyle = getHeroStyle(t);

  return (
    <div style={{ background: "var(--bg)" }}>
      {/* Header */}
      <header style={{
        borderBottom: "1px solid var(--border)",
        background: "var(--surface)",
        position: "sticky", top: 0, zIndex: 20
      }}>
        <div className="container" style={{
          padding: 14, display: "flex", alignItems: "center", gap: 12
        }}>
          <Brand name={agency.name} logoUrl={agency.logo_url} />
          <div style={{ marginLeft: "auto" }}>
            <Link to="/" className="btn btn-ghost" style={{ textDecoration: "none" }}>
              VelocityOnboard
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section style={{ ...heroStyle }}>
        <div className="container" style={{ padding: "64px 0 36px" }}>
          <span className="badge" style={{
            background: "rgba(0,0,0,0.04)", border: "1px solid var(--border)"
          }}>
            Join {agency.name}
          </span>
          <h1 style={{
            margin: "12px 0 10px",
            color: "var(--ink)",
            letterSpacing: "-0.02em",
            fontSize: 36
          }}>
            Book a call and get onboarded fast.
          </h1>
          <p className="sub" style={{ maxWidth: 720 }}>
            We help new agents ramp quickly with a clear playbook, hands-on support, and a trackable path to first commissions.
          </p>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 18 }}>
            {agency.calendly_url ? (
              <a
                className="btn"
                href={agency.calendly_url}
                target="_blank"
                rel="noreferrer"
                style={{
                  background: "var(--primary)",
                  color: "var(--primary-contrast)",
                  textDecoration: "none",
                  borderRadius: "calc(var(--radius))",
                  boxShadow: "var(--shadow)"
                }}
              >
                Book a Call
              </a>
            ) : (
              <button className="btn" style={{
                background: "var(--primary)",
                color: "var(--primary-contrast)",
                borderRadius: "calc(var(--radius))",
                boxShadow: "var(--shadow)"
              }}>
                Book a Call
              </button>
            )}
            <a className="btn btn-ghost" href="#learn" style={{ textDecoration: "none" }}>
              Learn More
            </a>
          </div>
        </div>
      </section>

      {/* Highlights */}
      <section id="learn" className="container" style={{ padding: "32px 0 48px" }}>
        <div className="grid-3">
          {FEATURES.map((f) => (
            <div key={f.t} className="card" style={{
              background: "var(--card)",
              border: "1px solid var(--border)",
              borderRadius: "calc(var(--radius))",
              boxShadow: "var(--shadow)"
            }}>
              <div className="badge" style={{
                marginBottom: 8,
                background: "rgba(0,0,0,0.04)",
                border: "1px solid var(--border)"
              }}>{f.t}</div>
              <div style={{ color: "var(--ink)" }}>{f.d}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Simple FAQ */}
      <section className="container" style={{ paddingBottom: 56 }}>
        <h3 style={{ marginTop: 0, color: "var(--ink)" }}>FAQs</h3>
        <div className="card" style={{
          display: "grid", gap: 10,
          background: "var(--card)",
          border: "1px solid var(--border)",
          borderRadius: "calc(var(--radius))",
          boxShadow: "var(--shadow)"
        }}>
          {FAQS.map((qa) => (
            <div key={qa.q}>
              <div className="sub" style={{ fontWeight: 600 }}>{qa.q}</div>
              <div>{qa.a}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer / legal */}
      <footer style={{ borderTop: "1px solid var(--border)", background: "var(--surface)" }}>
        <div className="container" style={{ padding: "12px 0", fontSize: 12, color: "var(--muted)" }}>
          © {new Date().getFullYear()} {legal}
        </div>
      </footer>

      {/* Scope CSS variables at the root of this page */}
      <style>{`:root{}`}</style>
      <div style={cssVars} />
    </div>
  );
}

function Brand({ name, logoUrl }) {
  if (!logoUrl) {
    return (
      <div className="brand" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{
          width: 28, height: 28,
          borderRadius: 8,
          background: `linear-gradient(135deg, ${lighten(getVar("--primary"), 30)} 0%, var(--primary) 70%)`
        }} />
        <strong style={{ color: "var(--ink)" }}>{name}</strong>
      </div>
    );
  }
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 10
    }}>
      <div style={{
        height: 36, width: 160,
        display: "flex", alignItems: "center", justifyContent: "flex-start",
        borderRadius: "calc(var(--radius) - 4px)",
        background: "var(--card)",
        border: "1px solid var(--border)",
        padding: "6px 8px",
        boxShadow: "var(--shadow)"
      }}>
        <img
          src={logoUrl}
          alt={`${name} logo`}
          style={{ maxHeight: 24, maxWidth: 140, objectFit: "contain", display: "block" }}
        />
      </div>
      <strong style={{ color: "var(--ink)" }}>{name}</strong>
    </div>
  );
}

/* -------------------- Helpers -------------------- */

const FEATURES = [
  { t: "Clear Playbook", d: "Day-1 steps, checklists, and scripts so you always know what’s next." },
  { t: "Fast Ramp", d: "Short trainings and live help so you can start producing quickly." },
  { t: "Team Support", d: "We win together — mentorship, feedback, and accountability." },
  { t: "Tools that Work", d: "Dialers, messaging, and a simple CRM that keeps you focused." },
  { t: "Track Progress", d: "See your milestones and time-to-first-deal improve week over week." },
  { t: "Grow Your Book", d: "Systems that scale with you as you become a top producer." },
];

const FAQS = [
  { q: "What happens after I book?", a: "You'll meet with our team, review expectations, and get your first-week checklist." },
  { q: "Do I need experience?", a: "Nope. If you’re coachable and motivated, we’ll get you up to speed." },
  { q: "Is there training?", a: "Yes — short video modules plus live support during your first weeks." },
];

// Build hero background from theme tokens
function getHeroStyle(t) {
  const base = {
    background: "var(--surface)",
    borderBottom: "1px solid var(--border)",
  };
  const tint = clamp01(t.heroTint ?? 0.2);
  const overlay = `linear-gradient(rgba(0,0,0,${tint * 0.04}), rgba(0,0,0,${tint * 0.06}))`;

  if (t.heroPattern === "grid") {
    const grid = `linear-gradient(rgba(0,0,0,${tint * 0.03}) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,${tint * 0.03}) 1px, transparent 1px)`;
    return { ...base, backgroundImage: `${overlay}, ${grid}`, backgroundSize: "20px 20px, 20px 20px" };
  }
  if (t.heroPattern === "dots") {
    const dots = `radial-gradient(circle at 1px 1px, rgba(0,0,0,${tint * 0.05}) 1px, transparent 1px)`;
    return { ...base, backgroundImage: `${overlay}, ${dots}`, backgroundSize: "18px 18px" };
  }
  if (t.heroPattern === "gradient") {
    const g = `linear-gradient(135deg, ${lighten(t.primary || "#1E63F0", 40)} 0%, ${t.primary || "#1E63F0"} 70%)`;
    return { ...base, backgroundImage: `${g}, ${overlay}`, backgroundBlendMode: "multiply" };
  }
  // none
  return base;
}

function clamp01(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return 0;
  return Math.max(0, Math.min(1, x));
}

function lighten(hex, amount = 30) {
  const h = (hex || "#000000").replace("#", "");
  const valid = /^[0-9a-fA-F]{6}$/.test(h) ? h : "000000";
  const num = parseInt(valid, 16);
  let r = (num >> 16) + amount, g = ((num >> 8) & 0xff) + amount, b = (num & 0xff) + amount;
  r = Math.min(255, Math.max(0, r)); g = Math.min(255, Math.max(0, g)); b = Math.min(255, Math.max(0, b));
  return `#${(r << 16 | g << 8 | b).toString(16).padStart(6, "0")}`;
}

// Resolve a CSS var in JS if available (fallback to primary)
function getVar(name, fallback = "#1E63F0") {
  if (typeof window === "undefined") return fallback;
  const v = getComputedStyle(document.documentElement).getPropertyValue(name);
  return (v || fallback).trim();
}

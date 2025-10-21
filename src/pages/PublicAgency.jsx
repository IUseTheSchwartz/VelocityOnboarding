// src/pages/PublicAgency.jsx
import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

/**
 * Public recruiting page for a published agency.
 * Reads by /a/:slug where :slug = agencies.public_slug
 * Renders logo, name, CTA (Calendly if provided), and legal footer.
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

  return (
    <div>
      {/* Simple header */}
      <header style={{ borderBottom: "1px solid var(--border)", background: "#fff" }}>
        <div className="container" style={{ padding: 16, display: "flex", alignItems: "center", gap: 12 }}>
          {agency.logo_url ? (
            <img src={agency.logo_url} alt={`${agency.name} logo`} style={{ height: 28 }} />
          ) : (
            <div className="brand" style={{ textDecoration: "none" }}>
              <div className="brand-mark" />
              <div>{agency.name}</div>
            </div>
          )}
          <div style={{ marginLeft: "auto" }}>
            <Link to="/" className="btn btn-ghost" style={{ textDecoration: "none" }}>
              VelocityOnboard
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="container" style={{ padding: "56px 0 28px" }}>
        <div className="badge">Join {agency.name}</div>
        <h1 style={{ margin: "10px 0 8px", color: ink }}>
          Book a call and get onboarded fast.
        </h1>
        <p className="sub" style={{ maxWidth: 720 }}>
          We help new agents ramp quickly with a clear playbook, hands-on support, and a trackable path to first commissions.
        </p>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 16 }}>
          {agency.calendly_url ? (
            <a
              className="btn btn-primary"
              href={agency.calendly_url}
              target="_blank"
              rel="noreferrer"
              style={{ background: primary, textDecoration: "none" }}
            >
              Book a Call
            </a>
          ) : (
            <button className="btn btn-primary" style={{ background: primary }}>
              Book a Call
            </button>
          )}
          <a className="btn btn-ghost" href="#learn" style={{ textDecoration: "none" }}>
            Learn More
          </a>
        </div>
      </section>

      {/* Highlights */}
      <section id="learn" className="container" style={{ paddingBottom: 48 }}>
        <div className="grid-3">
          {[
            { t: "Clear Playbook", d: "Day-1 steps, checklists, and scripts so you always know what’s next." },
            { t: "Fast Ramp", d: "Short trainings and live help so you can start producing quickly." },
            { t: "Team Support", d: "We win together — mentorship, feedback, and accountability." },
            { t: "Tools that Work", d: "Dialers, messaging, and a simple CRM that keeps you focused." },
            { t: "Track Progress", d: "See your milestones and time-to-first-deal improve week over week." },
            { t: "Grow Your Book", d: "Systems that scale with you as you become a top producer." },
          ].map((f) => (
            <div key={f.t} className="card">
              <div className="badge" style={{ marginBottom: 8 }}>{f.t}</div>
              <div style={{ color: "var(--ink)" }}>{f.d}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Simple FAQ */}
      <section className="container" style={{ paddingBottom: 56 }}>
        <h3 style={{ marginTop: 0, color: ink }}>FAQs</h3>
        <div className="card" style={{ display: "grid", gap: 10 }}>
          <div>
            <div className="sub" style={{ fontWeight: 600 }}>What happens after I book?</div>
            <div>You'll meet with our team, review expectations, and get your first-week checklist.</div>
          </div>
          <div>
            <div className="sub" style={{ fontWeight: 600 }}>Do I need experience?</div>
            <div>Nope. If you’re coachable and motivated, we’ll get you up to speed.</div>
          </div>
          <div>
            <div className="sub" style={{ fontWeight: 600 }}>Is there training?</div>
            <div>Yes — short video modules plus live support during your first weeks.</div>
          </div>
        </div>
      </section>

      {/* Footer / legal */}
      <footer style={{ borderTop: "1px solid var(--border)" }}>
        <div className="container" style={{ padding: "12px 0", fontSize: 12, color: "var(--muted)" }}>
          © {new Date().getFullYear()} {legal}
        </div>
      </footer>
    </div>
  );
}

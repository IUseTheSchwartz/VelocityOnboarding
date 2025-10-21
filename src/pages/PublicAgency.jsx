// src/pages/PublicAgency.jsx
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

export default function PublicAgency() {
  const { slug } = useParams();
  const [a, setA] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("agencies")
        .select("name, logo_url, theme, legal_name, calendly_url, is_public")
        .eq("public_slug", slug)
        .eq("is_public", true)
        .maybeSingle();
      if (!error) setA(data);
      setLoading(false);
    })();
  }, [slug]);

  if (loading) return <div className="container" style={{ padding: 32 }}>Loading…</div>;
  if (!a) return <div className="container" style={{ padding: 32 }}>This page is unavailable.</div>;

  const legal = (a.legal_name || "PRIETO INSURANCE SOLUTIONS LLC").trim();
  const primary = a.theme?.primary || "#1e63f0";

  return (
    <div>
      <header style={{ borderBottom: "1px solid var(--border)", background: "#fff" }}>
        <div className="container" style={{ padding: 16, display: "flex", gap: 12, alignItems: "center" }}>
          {a.logo_url ? <img src={a.logo_url} alt="logo" style={{ height: 28 }} /> : <strong>{a.name}</strong>}
        </div>
      </header>

      <main className="container" style={{ padding: "48px 0" }}>
        <h1 style={{ margin: 0 }}>Join {a.name}</h1>
        <p className="sub" style={{ marginTop: 8 }}>Book a call and get onboarded fast.</p>
        <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
          {a.calendly_url ? (
            <a className="btn btn-primary" href={a.calendly_url} target="_blank" rel="noreferrer">Book a Call</a>
          ) : (
            <button className="btn btn-primary" style={{ background: primary }}>Book a Call</button>
          )}
          <a className="btn btn-ghost" href="#learn">Learn More</a>
        </div>
      </main>

      <footer style={{ borderTop: "1px solid var(--border)" }}>
        <div className="container" style={{ padding: "12px 0", fontSize: 12, color: "var(--muted)" }}>
          © {new Date().getFullYear()} {legal}
        </div>
      </footer>
    </div>
  );
}

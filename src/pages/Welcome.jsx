import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useNavigate } from "react-router-dom";

export default function Welcome() {
  const navigate = useNavigate();
  const [sessionChecked, setSessionChecked] = useState(false);
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      // Ensure we have a session from the magic link
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setErr("Your login link is invalid or expired. Please request a new one.");
      }
      setSessionChecked(true);
    })();
  }, []);

  async function handleSetPassword(e) {
    e.preventDefault();
    setErr(""); setOk("");
    if (pw.length < 8) return setErr("Password must be at least 8 characters.");
    if (pw !== pw2) return setErr("Passwords do not match.");
    setLoading(true);
    try {
      // Set password for the currently logged-in user (magic link session)
      const { error: upErr } = await supabase.auth.updateUser({ password: pw });
      if (upErr) throw upErr;

      // Claim any pending agencies for this email
      await supabase.rpc("claim_agencies_for_me").catch(() => { /* not fatal */ });

      setOk("Password set! Redirecting…");
      // Send them to the correct dashboard (owners → /agency, agents → /agent if you want to detect)
      navigate("/agency");
    } catch (e) {
      setErr(e.message || String(e));
    } finally {
      setLoading(false);
    }
  }

  if (!sessionChecked) {
    return (
      <section className="section">
        <div className="container">
          <div className="card"><div className="sub">Checking session…</div></div>
        </div>
      </section>
    );
  }

  if (err && !ok && !pw && !pw2) {
    // No session found case
    return (
      <section className="section">
        <div className="container" style={{ maxWidth: 520 }}>
          <div className="card">
            <strong>Welcome</strong>
            <div className="sep" />
            <div className="sub" style={{ color: "crimson" }}>{err}</div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="section">
      <div className="container" style={{ maxWidth: 520 }}>
        <form className="card" onSubmit={handleSetPassword}>
          <strong>Welcome — set your password</strong>
          <div className="sep" />
          <label>New password</label>
          <input
            type="password"
            value={pw}
            onChange={(e)=>setPw(e.target.value)}
            placeholder="At least 8 characters"
            style={input}
          />
          <label style={{ marginTop: 8 }}>Confirm password</label>
          <input
            type="password"
            value={pw2}
            onChange={(e)=>setPw2(e.target.value)}
            placeholder="Repeat password"
            style={input}
          />

          {err && <div className="sub" style={{ color: "crimson", marginTop: 8 }}>{err}</div>}
          {ok && <div className="sub" style={{ color: "green", marginTop: 8 }}>{ok}</div>}

          <div className="row" style={{ gap: 10, marginTop: 14 }}>
            <button className="btn btn-primary" type="submit" disabled={loading}>
              {loading ? "Saving…" : "Save password"}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}

const input = { width:"100%", border:"1px solid var(--border)", borderRadius:10, padding:"10px 12px", outline:"none", fontSize:14 };

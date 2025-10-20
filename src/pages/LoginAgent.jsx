import React, { useEffect, useState } from "react";
import { LogIn } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

export default function LoginAgent() {
  const [mode, setMode] = useState("login"); // "login" | "signup"
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [code, setCode] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [params] = useSearchParams();

  useEffect(() => {
    const initial = params.get("code");
    if (initial) setCode(initial);
  }, [params]);

  async function handleSubmit(e) {
    e.preventDefault();
    setErr("");
    setLoading(true);
    const em = (email || "").trim().toLowerCase();

    try {
      if (mode === "signup") {
        if (!code.trim()) throw new Error("Invite code is required.");

        // Validate code against Supabase (public policy allows this read)
        const { data: invite, error: invErr } = await supabase
          .from("invite_codes")
          .select("id, agency_id, role, status, expires_at")
          .eq("code", code.trim())
          .eq("status", "active")
          .maybeSingle();

        if (invErr) throw invErr;
        if (!invite) throw new Error("Invalid or expired invite code.");

        // Create account (email confirmation may be ON in your project)
        const { error: signErr } = await supabase.auth.signUp({ email: em, password: pass });
        if (signErr) throw signErr;

        // Ensure we have a session (if confirm-email is ON, user must verify first)
        const { data: sess } = await supabase.auth.getSession();
        if (!sess?.session) {
          // No session yet – tell them to verify, then login.
          // After their first login, they can join the agency (policy allows self-insert).
          throw new Error("Check your email to confirm your account, then log in to continue.");
        }

        // Insert membership (policy agency_users_agent_self_insert allows this)
        const uid = sess.session.user.id;
        const { error: joinErr } = await supabase.from("agency_users").insert({
          agency_id: invite.agency_id,
          user_id: uid,
          user_email: em,
          role: "agent",
          progress: 0
        });
        if (joinErr) throw joinErr;

        navigate("/agent");
      } else {
        // LOGIN
        const { error } = await supabase.auth.signInWithPassword({ email: em, password: pass });
        if (error) throw error;
        navigate("/agent");
      }
    } catch (e) {
      setErr(e.message || String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="section">
      <div className="container" style={{ maxWidth: 520 }}>
        <form className="card" onSubmit={handleSubmit}>
          <div className="row" style={{ gap: 8 }}>
            <LogIn size={18} />
            <strong>{mode === "login" ? "Agent Login" : "Create Agent Account (invite-only)"}</strong>
          </div>
          <div className="sep" />

          <label>Email</label>
          <input value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="agent@youragency.com" style={input} />

          <label style={{ marginTop: 10 }}>Password</label>
          <input type="password" value={pass} onChange={(e)=>setPass(e.target.value)} placeholder="••••••••" style={input} />

          {mode === "signup" && (
            <>
              <label style={{ marginTop: 10 }}>Invite Code</label>
              <input value={code} onChange={(e)=>setCode(e.target.value)} placeholder="e.g. 9F7K2X" style={input} />
            </>
          )}

          {err && <div className="sub" style={{ color: "crimson", marginTop: 8 }}>{err}</div>}

          <div className="row" style={{ gap: 10, marginTop: 14 }}>
            <button className="btn btn-primary" type="submit" disabled={loading}>
              {loading ? "Please wait…" : (mode === "login" ? "Login" : "Create account")}
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => setMode(mode === "login" ? "signup" : "login")}
            >
              {mode === "login" ? "Need an invite? Sign up" : "Have an account? Log in"}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}

const input = {
  width: "100%",
  border: "1px solid var(--border)",
  borderRadius: 10,
  padding: "10px 12px",
  outline: "none",
  fontSize: 14,
};

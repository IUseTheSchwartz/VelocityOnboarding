import React, { useEffect, useState } from "react";
import { LogIn } from "lucide-react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

export default function LoginAgency() {
  const [mode, setMode] = useState("signup"); // "signup" | "login"
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [code, setCode] = useState("");
  const [err, setErr] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const [params] = useSearchParams();
  const navigate = useNavigate();

  // Pre-fill invite code from URL (?code=AB12CD) — only used for signup
  useEffect(() => {
    const pref = (params.get("code") || "").trim();
    if (pref) setCode(pref);
  }, [params]);

  function normCode(v) {
    return (v || "").trim().toUpperCase();
  }

  async function redeemOwnerCode() {
    const c = normCode(code);
    if (!c) throw new Error("Invite code is required.");
    const { data, error } = await supabase.rpc("use_invite_code", { p_code: c });
    if (error) throw error;
    if (!data?.role) throw new Error("Invalid response from invite redemption.");
    if (data.role !== "owner") {
      throw new Error("This code is not an owner invite. Please request an owner code.");
    }
    return data;
  }

  async function claimPending() {
    try {
      await supabase.rpc("claim_agencies_for_me");
    } catch {
      // swallow; not fatal for UX
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErr("");
    setInfo("");
    setLoading(true);

    const em = (email || "").trim().toLowerCase();

    try {
      if (mode === "signup") {
        if (!pass || pass.length < 6) {
          throw new Error("Password must be at least 6 characters.");
        }
        if (!normCode(code)) {
          throw new Error("Owner invite code is required to sign up.");
        }

        // Create the account (expects email/password signup to return a session)
        const { data: signData, error: sErr } = await supabase.auth.signUp({ email: em, password: pass });
        if (sErr) throw sErr;

        // If your Supabase project requires email confirmation for signups,
        // signData.session will be null. In that case, we can't redeem yet.
        // Show a friendly message:
        if (!signData?.session) {
          setInfo("Check your email to confirm your account, then log in and we’ll claim your agency.");
          return;
        }

        // Redeem owner invite (assign owner + add to agency_users)
        await redeemOwnerCode();

        // Also claim any pending agencies for this email, just in case
        await claimPending();

        setInfo("Account created and agency claimed. Redirecting…");
        navigate("/agency");
        return;
      } else {
        // LOGIN (no code required)
        const { error: lErr } = await supabase.auth.signInWithPassword({ email: em, password: pass });
        if (lErr) throw lErr;

        // Auto-claim any pending agencies (e.g., provisioned earlier with this email)
        await claimPending();

        setInfo("Logged in. Redirecting…");
        navigate("/agency");
        return;
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
          <div className="row" style={{ gap: 8, alignItems: "center", justifyContent: "space-between" }}>
            <div className="row" style={{ gap: 8, alignItems: "center" }}>
              <LogIn size={18} />
              <strong>Agency {mode === "signup" ? "Sign Up" : "Login"}</strong>
            </div>

            <div className="row" style={{ gap: 6 }}>
              <button
                type="button"
                className={`btn ${mode === "signup" ? "btn-primary" : "btn-ghost"}`}
                onClick={() => setMode("signup")}
              >
                Sign up
              </button>
              <button
                type="button"
                className={`btn ${mode === "login" ? "btn-primary" : "btn-ghost"}`}
                onClick={() => setMode("login")}
              >
                Login
              </button>
            </div>
          </div>

          <div className="sep" />

          <label>Owner Email</label>
          <input
            value={email}
            onChange={(e)=>setEmail(e.target.value)}
            placeholder="owner@agency.com"
            style={input}
          />

          <label style={{ marginTop: 10 }}>{mode === "signup" ? "Create Password" : "Password"}</label>
          <input
            type="password"
            value={pass}
            onChange={(e)=>setPass(e.target.value)}
            placeholder="••••••••"
            style={input}
          />

          {mode === "signup" && (
            <>
              <label style={{ marginTop: 10 }}>Owner Invite Code</label>
              <input
                value={code}
                onChange={(e)=>setCode(e.target.value)}
                placeholder="e.g., AB27QK"
                style={input}
              />
              <div className="sub" style={{ marginTop: 6 }}>
                Required for sign up. Ask a Super Admin to generate an <strong>owner</strong> code for your agency.
              </div>
            </>
          )}

          {err && <div className="sub" style={{ color: "crimson", marginTop: 10 }}>{err}</div>}
          {info && <div className="sub" style={{ color: "green", marginTop: 10 }}>{info}</div>}

          <div className="row" style={{ gap: 10, marginTop: 14 }}>
            <button className="btn btn-primary" type="submit" disabled={loading}>
              {loading ? "Please wait…" : (mode === "signup" ? "Create account & claim" : "Login")}
            </button>
            <Link to="/login/agent" className="btn btn-ghost" style={{ textDecoration: "none" }}>
              Agent login
            </Link>
          </div>

          {mode === "login" && (
            <div className="sub" style={{ marginTop: 10 }}>
              New owner? Switch to{" "}
              <button type="button" className="btn btn-ghost" onClick={() => setMode("signup")}>
                Sign up
              </button>{" "}
              to use your owner invite code.
            </div>
          )}
        </form>
      </div>
    </section>
  );
}

const input = { width:"100%", border:"1px solid var(--border)", borderRadius:10, padding:"10px 12px", outline:"none", fontSize:14 };

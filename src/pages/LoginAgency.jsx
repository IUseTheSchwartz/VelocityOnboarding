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

  // Pre-fill invite code from URL (?code=AB12CD)
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
        // Create account
        const { error: sErr } = await supabase.auth.signUp({ email: em, password: pass });
        if (sErr) throw sErr;

        // Redeem the owner code (assign agency + owner)
        await redeemOwnerCode();

        setInfo("Account created and agency claimed. Redirecting…");
        navigate("/agency");
        return;
      } else {
        // mode === "login"
        const { error: lErr } = await supabase.auth.signInWithPassword({ email: em, password: pass });
        if (lErr) throw lErr;

        // Redeem the owner code (required)
        await redeemOwnerCode();

        setInfo("Logged in and agency claimed. Redirecting…");
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

          <label style={{ marginTop: 10 }}>Owner Invite Code</label>
          <input
            value={code}
            onChange={(e)=>setCode(e.target.value)}
            placeholder="e.g., AB27QK"
            style={input}
          />
          <div className="sub" style={{ marginTop: 6 }}>
            The invite code is required and must be an <strong>owner</strong> code created in Super Admin.
          </div>

          {err && <div className="sub" style={{ color: "crimson", marginTop: 10 }}>{err}</div>}
          {info && <div className="sub" style={{ color: "green", marginTop: 10 }}>{info}</div>}

          <div className="row" style={{ gap: 10, marginTop: 14 }}>
            <button className="btn btn-primary" type="submit" disabled={loading}>
              {loading ? "Please wait…" : (mode === "signup" ? "Create account & claim" : "Login & claim")}
            </button>
            <Link to="/login/agent" className="btn btn-ghost" style={{ textDecoration: "none" }}>
              Agent login
            </Link>
          </div>

          <div className="sub" style={{ marginTop: 10 }}>
            Don’t have an owner invite? Ask a Super Admin to generate one for your agency.
          </div>
        </form>
      </div>
    </section>
  );
}

const input = { width:"100%", border:"1px solid var(--border)", borderRadius:10, padding:"10px 12px", outline:"none", fontSize:14 };

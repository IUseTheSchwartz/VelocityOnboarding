import React, { useState } from "react";
import { LogIn } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

export default function LoginAgency() {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [mode, setMode] = useState("login"); // "login" | "signup"
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function isAdminEmail(emLower) {
    const { data } = await supabase.from("admin_users").select("email").eq("email", emLower).maybeSingle();
    return !!data;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErr("");
    setLoading(true);
    const em = (email || "").trim().toLowerCase();

    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({ email: em, password: pass });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: em, password: pass });
        if (error) throw error;
      }

      // route based on admin table (no more hardcode)
      const admin = await isAdminEmail(em);
      navigate(admin ? "/super" : "/agency");
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
            <strong>{mode === "login" ? "Agency Login" : "Create Agency Owner Account"}</strong>
          </div>
          <div className="sep" />
          <label>Agency Email</label>
          <input value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="owner@agency.com" style={input} />
          <label style={{ marginTop: 10 }}>Password</label>
          <input type="password" value={pass} onChange={(e)=>setPass(e.target.value)} placeholder="••••••••" style={input} />

          {err && <div className="sub" style={{ color: "crimson", marginTop: 8 }}>{err}</div>}

          <div className="row" style={{ gap: 10, marginTop: 14 }}>
            <button className="btn btn-primary" type="submit" disabled={loading}>
              {loading ? "Please wait…" : mode === "login" ? "Login" : "Create account"}
            </button>
            <button type="button" className="btn btn-ghost" onClick={()=>setMode(mode === "login" ? "signup" : "login")}>
              {mode === "login" ? "Need an account? Sign up" : "Have an account? Log in"}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}

const input = { width:"100%", border:"1px solid var(--border)", borderRadius:10, padding:"10px 12px", outline:"none", fontSize:14 };

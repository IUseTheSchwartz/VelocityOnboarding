import React, { useState } from "react";
import { LogIn } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

const SUPER_ADMIN_EMAIL = (import.meta.env.VITE_SUPER_ADMIN_EMAIL || "jacobprieto@gmail.com").toLowerCase();

export default function LoginAgency() {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState("");
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setErr("");
    const em = (email || "").trim().toLowerCase();

    const { error } = await supabase.auth.signInWithPassword({ email: em, password: pass });
    if (error) return setErr(error.message);

    if (em === SUPER_ADMIN_EMAIL) {
      navigate("/super");
    } else {
      navigate("/agency");
    }
  }

  return (
    <section className="section">
      <div className="container" style={{ maxWidth: 520 }}>
        <form className="card" onSubmit={handleSubmit}>
          <div className="row" style={{ gap: 8 }}>
            <LogIn size={18} /><strong>Agency Login</strong>
          </div>
          <div className="sep" />
          <label>Agency Email</label>
          <input value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="owner@agency.com" style={input} />
          <label style={{ marginTop: 10 }}>Password</label>
          <input type="password" value={pass} onChange={(e)=>setPass(e.target.value)} placeholder="••••••••" style={input} />
          {err && <div className="sub" style={{ color: "crimson", marginTop: 8 }}>{err}</div>}
          <div className="row" style={{ gap: 10, marginTop: 14 }}>
            <button className="btn btn-primary" type="submit">Login</button>
          </div>
        </form>
      </div>
    </section>
  );
}
const input = { width: "100%", border: "1px solid var(--border)", borderRadius: 10, padding: "10px 12px", outline: "none", fontSize: 14 };

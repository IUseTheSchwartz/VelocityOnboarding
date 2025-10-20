import React, { useState } from "react";
import { LogIn, Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [mode, setMode] = useState("login"); // login | signup
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const navigate = useNavigate();

  return (
    <section className="section">
      <div className="container" style={{ maxWidth: 520 }}>
        <div className="card">
          <div className="row" style={{ gap: 8 }}>
            {mode === "login" ? <LogIn size={18} /> : <Lock size={18} />}
            <strong>{mode === "login" ? "Login" : "Create your account"}</strong>
          </div>
          <div className="sep" />
          <label>Email</label>
          <input value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="you@agency.com" style={inputStyle} />
          <label style={{ marginTop: 10 }}>Password</label>
          <input type="password" value={pass} onChange={(e)=>setPass(e.target.value)} placeholder="••••••••" style={inputStyle} />

          <div className="row" style={{ gap: 10, marginTop: 14 }}>
            <button className="btn btn-primary" onClick={()=>navigate("/agency")}>
              {mode === "login" ? "Login" : "Create account"}
            </button>
            <button className="btn btn-ghost" onClick={()=>setMode(mode==="login"?"signup":"login")}>
              {mode === "login" ? "Need an account? Sign up" : "Have an account? Log in"}
            </button>
          </div>
        </div>
        <p className="sub" style={{ marginTop: 10 }}>Preview only—no data is saved.</p>
      </div>
    </section>
  );
}

const inputStyle = {
  width: "100%", border: "1px solid var(--border)", borderRadius: 10, padding: "10px 12px", outline: "none", fontSize: 14,
};

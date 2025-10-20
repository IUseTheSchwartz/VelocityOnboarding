import React, { useState } from "react";
import { LogIn } from "lucide-react";
import { useNavigate } from "react-router-dom";

// 👇 Your “low key” super admin email — change if you want
const SUPER_ADMIN_EMAIL = "jacobprieto@gmail.com";

export default function LoginAgency() {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const navigate = useNavigate();

  function handleSubmit(e) {
    e.preventDefault();
    const em = (email || "").trim().toLowerCase();
    if (em === SUPER_ADMIN_EMAIL.toLowerCase()) {
      // stealth route to Super Admin
      navigate("/super");
    } else {
      // normal agency owner to Agency Console
      navigate("/agency");
    }
  }

  return (
    <section className="section">
      <div className="container" style={{ maxWidth: 520 }}>
        <form className="card" onSubmit={handleSubmit}>
          <div className="row" style={{ gap: 8 }}>
            <LogIn size={18} />
            <strong>Agency Login</strong>
          </div>
          <div className="sep" />
          <label>Agency Email</label>
          <input
            value={email}
            onChange={(e)=>setEmail(e.target.value)}
            placeholder="owner@agency.com"
            style={input}
          />
          <label style={{ marginTop: 10 }}>Password</label>
          <input
            type="password"
            value={pass}
            onChange={(e)=>setPass(e.target.value)}
            placeholder="••••••••"
            style={input}
          />
          <div className="row" style={{ gap: 10, marginTop: 14 }}>
            <button className="btn btn-primary" type="submit">Login</button>
          </div>
        </form>
        <p className="sub" style={{ marginTop: 10 }}>
          Preview only—no data is saved. Super Admin routes when the agency email matches your admin email.
        </p>
      </div>
    </section>
  );
}

const input = {
  width: "100%", border: "1px solid var(--border)", borderRadius: 10,
  padding: "10px 12px", outline: "none", fontSize: 14,
};

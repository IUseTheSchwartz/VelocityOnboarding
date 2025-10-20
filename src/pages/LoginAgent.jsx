import React, { useState } from "react";
import { LogIn } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function LoginAgent() {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const navigate = useNavigate();

  function handleSubmit(e) {
    e.preventDefault();
    // Preview only; route into Agent portal demo
    navigate("/agent");
  }

  return (
    <section className="section">
      <div className="container" style={{ maxWidth: 520 }}>
        <form className="card" onSubmit={handleSubmit}>
          <div className="row" style={{ gap: 8 }}>
            <LogIn size={18} />
            <strong>Agent Login</strong>
          </div>
          <div className="sep" />
          <label>Email</label>
          <input
            value={email}
            onChange={(e)=>setEmail(e.target.value)}
            placeholder="agent@youragency.com"
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
        <p className="sub" style={{ marginTop: 10 }}>Preview only—no data is saved.</p>
      </div>
    </section>
  );
}

const input = {
  width: "100%", border: "1px solid var(--border)", borderRadius: 10,
  padding: "10px 12px", outline: "none", fontSize: 14,
};

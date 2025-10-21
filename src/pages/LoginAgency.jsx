import React, { useEffect, useState } from "react";
import { LogIn } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

export default function LoginAgency() {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  function urlHasSupabaseTokens() {
    // Supabase appends tokens as query or hash params on magic link flows
    const href = window.location.href;
    return /access_token=/.test(href) || /type=magiclink|type=recovery|token_type=/.test(href);
  }

  async function isCurrentUserAdmin() {
    const { data, error } = await supabase.rpc("is_current_admin");
    return !!data && !error;
  }

  // ⛑️ If a magic-link brought us here, forward to /welcome to set password & claim agency
  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session && urlHasSupabaseTokens()) {
        navigate("/welcome", { replace: true });
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.key]);

  async function handleSubmit(e) {
    e.preventDefault();
    setErr("");
    setLoading(true);
    const em = (email || "").trim().toLowerCase();

    try {
      const { error } = await supabase.auth.signInWithPassword({ email: em, password: pass });
      if (error) throw error;

      // Safety net: claim any pending ownership on normal login too
      await supabase.rpc("claim_agencies_for_me").catch(() => {});

      const isAdmin = await isCurrentUserAdmin();
      navigate(isAdmin ? "/super" : "/agency");
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
            <strong>Agency Login</strong>
          </div>
          <div className="sep" />
          <label>Agency Email</label>
          <input value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="owner@agency.com" style={input} />
          <label style={{ marginTop: 10 }}>Password</label>
          <input type="password" value={pass} onChange={(e)=>setPass(e.target.value)} placeholder="••••••••" style={input} />

          {err && <div className="sub" style={{ color: "crimson", marginTop: 8 }}>{err}</div>}

          <div className="row" style={{ gap: 10, marginTop: 14 }}>
            <button className="btn btn-primary" type="submit" disabled={loading}>
              {loading ? "Please wait…" : "Login"}
            </button>
          </div>

          <div className="sub" style={{ marginTop: 10 }}>
            Don’t have access? Ask a Super Admin to send you an owner invitation/magic link.
          </div>
        </form>
      </div>
    </section>
  );
}

const input = { width:"100%", border:"1px solid var(--border)", borderRadius:10, padding:"10px 12px", outline:"none", fontSize:14 };

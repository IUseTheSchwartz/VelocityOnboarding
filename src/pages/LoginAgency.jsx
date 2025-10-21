import React, { useState } from "react";
import { LogIn } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

const APP_URL = import.meta.env.VITE_APP_URL || window.location.origin;

export default function LoginAgency() {
  const [mode, setMode] = useState("signup"); // "signup" | "login"

  return (
    <section className="section">
      <div className="container" style={{ maxWidth: 520 }}>
        <div className="card">
          <div className="row" style={{ gap: 8, alignItems: "center" }}>
            <LogIn size={18} />
            <strong>Agency Owner Access</strong>
            <div style={{ marginLeft: "auto" }}>
              <button
                className={`btn btn-ghost ${mode === "signup" ? "active" : ""}`}
                onClick={() => setMode("signup")}
              >
                Sign up (with code)
              </button>
              <button
                className={`btn btn-ghost ${mode === "login" ? "active" : ""}`}
                onClick={() => setMode("login")}
              >
                Login
              </button>
            </div>
          </div>
        </div>

        {mode === "signup" ? <OwnerSignupForm /> : <OwnerLoginForm />}
      </div>
    </section>
  );
}

/* -------------------- SIGN UP (REQUIRES OWNER CODE) -------------------- */

function OwnerSignupForm() {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");
  const navigate = useNavigate();

  function clearMsgs() { setErr(""); setOk(""); }

  async function handleSubmit(e) {
    e.preventDefault();
    clearMsgs();
    setLoading(true);

    const em = (email || "").trim().toLowerCase();
    const pw = (pass || "").trim();
    const invite = (code || "").trim().toUpperCase();

    try {
      if (!invite) throw new Error("Invite code is required.");
      if (!pw || pw.length < 8) throw new Error("Password must be at least 8 characters.");

      // 1) Validate invite code (must be role=owner, active, not expired, has uses left)
      const { data: inviteRow, error: invErr } = await supabase
        .from("invite_codes")
        .select("id, agency_id, role, status, max_uses, uses, expires_at")
        .eq("code", invite)
        .single();

      if (invErr || !inviteRow) throw new Error("Invalid invite code.");
      if (inviteRow.role !== "owner") throw new Error("This code is not an owner invite.");
      if (inviteRow.status !== "active") throw new Error("This invite code is not active.");
      if (inviteRow.expires_at && new Date(inviteRow.expires_at) < new Date()) {
        throw new Error("This invite code has expired.");
      }
      if (inviteRow.max_uses && inviteRow.uses >= inviteRow.max_uses) {
        throw new Error("This invite code has already been used.");
      }

      // 2) Create the user (email+password) → redirect to /welcome after email confirmation if enabled
      const { data: signUpRes, error: signUpErr } = await supabase.auth.signUp({
        email: em,
        password: pw,
        options: { emailRedirectTo: `${APP_URL}/welcome` },
      });
      if (signUpErr) {
        // If already registered, suggest using Login tab
        if (/user.*already.*registered/i.test(signUpErr.message)) {
          throw new Error("This email already has an account. Use the Login tab.");
        }
        throw signUpErr;
      }

      // 3) Ensure session (if email confirmation is disabled you’ll already have a session)
      let userId = signUpRes.user?.id || null;
      if (!userId) {
        // Try to log in immediately (if email confirmation is OFF you’ll get a session)
        const { data: loginRes, error: loginErr } = await supabase.auth.signInWithPassword({
          email: em,
          password: pw,
        });
        if (loginErr) {
          // If confirmation is required, tell them to check inbox
          setOk("Check your email to confirm your account, then return to log in.");
          return;
        }
        userId = loginRes.user?.id || null;
      }
      if (!userId) throw new Error("Could not establish a session after sign-up.");

      // 4) Attach to agency as owner (this should pass RLS: auth.uid() == user_id)
      const { error: auErr } = await supabase.from("agency_users").insert({
        agency_id: inviteRow.agency_id,
        user_id: userId,
        user_email: em,
        role: "owner",
        progress: 0,
      });
      if (auErr && !/duplicate key/i.test(auErr.message)) throw auErr;

      // 5) Best-effort: bump invite usage (optional; if RLS blocks, we just ignore)
      await supabase.from("invite_codes").update({
        uses: (inviteRow.uses || 0) + 1,
        status: (inviteRow.max_uses && inviteRow.uses + 1 >= inviteRow.max_uses) ? "used" : "active",
      }).eq("id", inviteRow.id);

      // 6) Claim ownership via RPC (works when agency.pending_owner_email matches this email)
      await supabase.rpc("claim_agencies_for_me").catch(() => {});

      setOk("Welcome! Your agency has been linked.");
      navigate("/welcome");
    } catch (e) {
      setErr(e.message || String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="card" onSubmit={handleSubmit}>
      <label>Owner Invite Code</label>
      <input
        value={code}
        onChange={(e)=>setCode(e.target.value)}
        placeholder="ABC123"
        style={input}
      />

      <label style={{ marginTop: 10 }}>Email</label>
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

      {err && <div className="sub" style={{ color: "crimson", marginTop: 8 }}>{err}</div>}
      {ok && <div className="sub" style={{ color: "green", marginTop: 8 }}>{ok}</div>}

      <div className="row" style={{ gap: 10, marginTop: 14 }}>
        <button className="btn btn-primary" type="submit" disabled={loading}>
          {loading ? "Creating your account…" : "Sign up as Owner"}
        </button>
      </div>

      <div className="sub" style={{ marginTop: 10 }}>
        Don’t have a code? Ask a Super Admin to create an <strong>owner</strong> invite for you.
      </div>
    </form>
  );
}

/* -------------------- LOGIN (EXISTING OWNERS) -------------------- */

function OwnerLoginForm() {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function isCurrentUserAdmin() {
    const { data, error } = await supabase.rpc("is_current_admin");
    return !!data && !error;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErr("");
    setLoading(true);
    const em = (email || "").trim().toLowerCase();

    try {
      const { error } = await supabase.auth.signInWithPassword({ email: em, password: pass });
      if (error) throw error;

      // After login, try to claim any pending agencies by email as a convenience.
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
    <form className="card" onSubmit={handleSubmit}>
      <label>Email</label>
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
        New owner? Use the <strong>Sign up (with code)</strong> tab.
      </div>
    </form>
  );
}

const input = { width:"100%", border:"1px solid var(--border)", borderRadius:10, padding:"10px 12px", outline:"none", fontSize:14 };

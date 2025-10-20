import React from "react";
import { Routes, Route, Link, useLocation } from "react-router-dom";
import { ThemeProvider } from "./theme";
import Agent from "./pages/Agent";
import AgencyConsole from "./pages/AgencyConsole";
import SuperAdmin from "./pages/SuperAdmin";
import Landing from "./pages/Landing";
import LoginAgent from "./pages/LoginAgent";
import LoginAgency from "./pages/LoginAgency";

export default function App() {
  return (
    <ThemeProvider>
      <SiteShell />
    </ThemeProvider>
  );
}

function SiteShell() {
  const { pathname } = useLocation();
  return (
    <div>
      <nav className="nav">
        <div className="container" style={{ display: "flex", alignItems: "center", gap: 16, padding: "12px 0" }}>
          <Link to="/" className="brand" style={{ textDecoration: "none" }}>
            <div className="brand-mark" />
            <div>VelocityOnboard</div>
          </Link>
          <div style={{ marginLeft: "auto", display: "flex", gap: 6, flexWrap: "wrap" }}>
            <NavLink to="/" active={pathname === "/"}>Landing</NavLink>
            <NavLink to="/login/agent" active={pathname === "/login/agent"}>Agent Login</NavLink>
            <NavLink to="/login/agency" active={pathname === "/login/agency"}>Agency Login</NavLink>
            <NavLink to="/agent" active={pathname === "/agent"}>Agent</NavLink>
            <NavLink to="/agency" active={pathname === "/agency"}>Agency</NavLink>
            {/* Super Admin intentionally not shown in nav */}
          </div>
        </div>
      </nav>

      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login/agent" element={<LoginAgent />} />
        <Route path="/login/agency" element={<LoginAgency />} />
        <Route path="/agent" element={<Agent />} />
        <Route path="/agency" element={<AgencyConsole />} />
        <Route path="/super" element={<SuperAdmin />} />
      </Routes>

      <footer className="section" style={{ borderTop: "1px solid var(--border)" }}>
        <div className="container" style={{ display: "flex", gap: 12, alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" }}>
          <div className="brand"><div className="brand-mark" /><div>VelocityOnboard</div></div>
          <div className="sub">© {new Date().getFullYear()} VelocityOnboard • Life-insurance onboarding</div>
        </div>
      </footer>
    </div>
  );
}

function NavLink({ to, active, children }) {
  return (
    <Link
      to={to}
      className="btn btn-ghost"
      style={{ background: active ? "var(--panel)" : "transparent", textDecoration: "none" }}
    >
      {children}
    </Link>
  );
}

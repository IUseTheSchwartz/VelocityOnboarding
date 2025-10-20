import React from "react";
import { Navigate } from "react-router-dom";
import { useSession } from "./useSession";

export default function RequireAuth({ children }) {
  const { session, loading } = useSession();
  if (loading) return <div className="section"><div className="container">Loading…</div></div>;
  if (!session) return <Navigate to="/login/agency" replace />; // default to agency login
  return children;
}

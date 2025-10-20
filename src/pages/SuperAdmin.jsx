import React from "react";
import { LayoutDashboard, Film, HelpCircle } from "lucide-react";
import { loadAgencies } from "../lib/storage";

export default function SuperAdmin() {
  const agencies = loadAgencies();

  return (
    <section className="section">
      <div className="container">
        <h2 className="h2">Super Admin (demo)</h2>

        <div className="grid grid-3" style={{ marginTop: 8 }}>
          <div className="card">
            <div className="row" style={{ gap: 8 }}><LayoutDashboard size={16}/><strong>Agencies</strong></div>
            <div className="sep" />
            <table className="table">
              <thead><tr><th>Name</th><th>Slug</th><th>Theme</th></tr></thead>
              <tbody>
                {agencies.length === 0 && <tr><td colSpan="3" className="sub">No agencies yet — create one in Agency page.</td></tr>}
                {agencies.map((a,i)=>(
                  <tr key={i}>
                    <td>{a.name}</td>
                    <td>{a.slug}</td>
                    <td><span className="badge">{a.theme?.primary}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="card">
            <div className="row" style={{ gap: 8 }}><Film size={16}/><strong>Templates</strong></div>
            <div className="sep" />
            <ul style={{ paddingLeft: 18 }}>
              <li>Pre-Exam v1.2</li>
              <li>Post-Exam v1.0</li>
              <li>Pre-Sales v1.3</li>
            </ul>
          </div>

          <div className="card">
            <div className="row" style={{ gap: 8 }}><HelpCircle size={16}/><strong>Support Queue</strong></div>
            <div className="sep" />
            <ul style={{ paddingLeft: 18 }}>
              <li>—</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

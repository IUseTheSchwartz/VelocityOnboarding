import React from "react";
import { CheckCircle2 } from "lucide-react";

export default function Agent() {
  const phases = [
    { name: "Pre-Exam", items: ["Study plan overview", "State licensing basics", "Practice quiz 1", "Exam tips video"] },
    { name: "Post-Exam", items: ["Carrier contracting", "E&O + AML", "Tools setup checklist", "Profile & compliance"] },
    { name: "Pre-Sales", items: ["Scripts & rebuttals", "Dial day expectations", "CRM quickstart", "First 10 leads plan"] },
  ];

  return (
    <section className="section">
      <div className="container">
        <h2 className="h2">Agent Portal (demo)</h2>
        <div className="grid grid-3" style={{ marginTop: 8 }}>
          {phases.map((p) => (
            <div key={p.name} className="card">
              <div className="row" style={{ justifyContent: "space-between" }}>
                <strong>{p.name}</strong>
                <span className="badge"><CheckCircle2 size={14}/> 0% complete</span>
              </div>
              <ul style={{ paddingLeft: 18, marginTop: 6 }}>
                {p.items.map((it, i) => <li key={i}>{it}</li>)}
              </ul>
              <div className="row" style={{ gap: 10, marginTop: 10 }}>
                <button className="btn btn-primary">Continue</button>
                <button className="btn btn-ghost">Ask a question</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

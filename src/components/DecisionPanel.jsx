import React from "react";

export default function DecisionPanel({ decisions = [] }) {
  return (
    <div style={{ background: "#111827", padding: "20px", borderRadius: "10px", marginTop: "20px" }}>
      <h2>🧠 AI Decision Engine</h2>

      {decisions.map((d, i) => (
        <div key={i} style={{
          background: "#1f2937",
          padding: "12px",
          borderRadius: "6px",
          marginBottom: "10px"
        }}>
          <strong>✈️ {d.flight}</strong> ({d.airline}) <br />
          Risk: {d.currentRisk} ({d.score}) <br />
          Action: 
          <span style={{
            color:
              d.priority === "CRITICAL" ? "red" :
              d.priority === "HIGH" ? "orange" : "lightgreen"
          }}>
            {" "}{d.action}
          </span>
          <br />
          <em>{d.recommendation}</em>
        </div>
      ))}
    </div>
  );
}
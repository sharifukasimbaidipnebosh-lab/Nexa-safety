import React from "react";

export default function StatsCards({ predictions }) {
  const high = predictions.filter(p => p.risk === "HIGH").length;
  const medium = predictions.filter(p => p.risk === "MEDIUM").length;
  const low = predictions.filter(p => p.risk === "LOW").length;

  return (
    <div style={{ display: "flex", gap: "10px" }}>
      <Card title="HIGH RISK" value={high} color="red" />
      <Card title="MEDIUM RISK" value={medium} color="orange" />
      <Card title="LOW RISK" value={low} color="green" />
    </div>
  );
}

function Card({ title, value, color }) {
  return (
    <div style={{
      padding: "15px",
      borderRadius: "10px",
      background: "#111",
      color: "white",
      flex: 1,
      border: `2px solid ${color}`
    }}>
      <h3>{title}</h3>
      <h1>{value}</h1>
    </div>
  );
}
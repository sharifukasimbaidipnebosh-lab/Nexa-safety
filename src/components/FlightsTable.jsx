import React from "react";

export default function FlightsTable({ predictions, forecast }) {
  return (
    <div style={{ marginTop: "20px", background: "#111", padding: "15px", borderRadius: "10px" }}>
      <h2>✈️ Flight Intelligence Table</h2>

      <table width="100%" style={{ color: "white" }}>
        <thead>
          <tr>
            <th>Flight</th>
            <th>Risk</th>
            <th>Score</th>
          </tr>
        </thead>

        <tbody>
          {predictions.map((p) => (
            <tr key={p.id}>
              <td>{p.flight}</td>
              <td>{p.risk}</td>
              <td>{p.score}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3 style={{ marginTop: "20px" }}>🔮 Forecast</h3>

      {forecast?.map((f, i) => (
        <div key={i}>
          {f.flight} → {f.predictedRisk} ({f.trend})
        </div>
      ))}
    </div>
  );
}
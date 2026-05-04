import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  ResponsiveContainer
} from "recharts";

export default function RiskChart({ predictions = [], forecast = [] }) {
  // 📈 Convert prediction data into chart format
  const riskTrendData = predictions.map((p, i) => ({
    name: p.flight,
    score: p.score
  }));

  // 📊 Risk distribution
  const distribution = [
    {
      name: "LOW",
      value: predictions.filter((p) => p.risk === "LOW").length
    },
    {
      name: "MEDIUM",
      value: predictions.filter((p) => p.risk === "MEDIUM").length
    },
    {
      name: "HIGH",
      value: predictions.filter((p) => p.risk === "HIGH").length
    }
  ];

  return (
    <div style={{ background: "#111", padding: "15px", borderRadius: "10px" }}>
      <h2>📊 Risk Intelligence Charts</h2>

      {/* 📈 LINE CHART */}
      <h3>Risk Score Trend</h3>
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={riskTrendData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" stroke="#fff" />
          <YAxis stroke="#fff" />
          <Tooltip />
          <Line type="monotone" dataKey="score" stroke="#ff4d4d" />
        </LineChart>
      </ResponsiveContainer>

      {/* 📊 BAR CHART */}
      <h3 style={{ marginTop: "20px" }}>Risk Distribution</h3>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={distribution}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" stroke="#fff" />
          <YAxis stroke="#fff" />
          <Tooltip />
          <Bar dataKey="value" fill="#ffa500" />
        </BarChart>
      </ResponsiveContainer>

      {/* 🔮 FORECAST VIEW */}
      <h3 style={{ marginTop: "20px" }}>Predictive Forecast (Layer 5)</h3>

      {forecast?.length > 0 ? (
        forecast.map((f, i) => (
          <div key={i} style={{ padding: "5px 0" }}>
            ✈️ {f.flight} → {f.predictedRisk} | Trend: {f.trend} | Escalation:{" "}
            {f.escalationProbability}%
          </div>
        ))
      ) : (
        <p>No forecast data yet...</p>
      )}
    </div>
  );
}
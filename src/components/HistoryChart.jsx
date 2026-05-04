import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from "recharts";

export default function HistoryChart({ history = [] }) {
  const data = history.map((h, i) => ({
    time: i,
    avg:
      h.predictions.reduce((sum, p) => sum + p.score, 0) /
      h.predictions.length
  }));

  return (
    <div style={{ background: "#111", padding: "15px", borderRadius: "10px" }}>
      <h2>📈 Historical Risk Trend</h2>

      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={data}>
          <XAxis dataKey="time" stroke="#fff" />
          <YAxis stroke="#fff" />
          <Tooltip />
          <Line type="monotone" dataKey="avg" stroke="#00c3ff" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
import React from "react";

export default function AlertsPanel({ alerts }) {
  return (
    <div className="bg-white p-4 rounded shadow">

      <h2 className="text-xl font-bold mb-3">🚨 Live Alerts</h2>

      {alerts.map((a, i) => (
        <div key={i} className="border-l-4 border-red-500 pl-3 mb-2">
          <p className="font-bold">{a.flight_number}</p>
          <p className="text-sm">{a.message}</p>
          <p className="text-xs text-gray-500">
            Priority: {a.priority_score}
          </p>
        </div>
      ))}

    </div>
  );
}
import React from "react";

export default function UploadPanel() {
  return (
    <div>
      <h2>📥 Data Ingestion</h2>

      <div>
        <h3>🟦 Operational Data (Nexa Safety)</h3>
        <button onClick={() => window.open("/templates/operational")}>
          Download Template
        </button>
        <input type="file" />
      </div>

      <div style={{ marginTop: "20px" }}>
        <h3>🔴 Psychological Data (Nexa Mind)</h3>
        <button onClick={() => window.open("/templates/psychological")}>
          Download Template
        </button>
        <input type="file" />
      </div>
    </div>
  );
}
import React from "react";

const FlightTable = ({ flights }) => {
  return (
    <div style={{ marginTop: 20 }}>
      <h2>✈️ Live Flights</h2>

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ background: "#111", color: "#fff" }}>
            <th>Flight</th>
            <th>Airline</th>
            <th>Status</th>
            <th>Risk</th>
            <th>Lat</th>
            <th>Lng</th>
          </tr>
        </thead>

        <tbody>
          {flights.map((f) => (
            <tr key={f.id} style={{ borderBottom: "1px solid #ddd" }}>
              <td>{f.flight}</td>
              <td>{f.airline}</td>
              <td>{f.status}</td>
              <td style={{
                color:
                  f.riskLevel === "HIGH"
                    ? "red"
                    : f.riskLevel === "MEDIUM"
                    ? "orange"
                    : "green"
              }}>
                {f.riskLevel}
              </td>
              <td>{f.lat}</td>
              <td>{f.lng}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default FlightTable;
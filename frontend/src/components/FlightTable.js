import React from "react";
import RiskBadge from "./RiskBadge";

const FlightTable = ({ flights }) => {
  return (
    <div style={{ marginTop: "20px" }}>
      <table width="100%" border="1" cellPadding="8">
        <thead>
          <tr>
            <th>Flight</th>
            <th>Airline</th>
            <th>Country</th>
            <th>Altitude</th>
            <th>Speed</th>
            <th>Risk</th>
          </tr>
        </thead>

        <tbody>
          {flights.map((f) => (
            <tr key={f.id}>
              <td>{f.flight}</td>
              <td>{f.airline}</td>
              <td>{f.country}</td>
              <td>{f.altitude}</td>
              <td>{f.velocity}</td>
              <td>
                <RiskBadge risk={f.riskLevel} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default FlightTable;
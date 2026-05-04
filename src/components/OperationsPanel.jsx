import React from "react";

export default function OperationsPanel({ airlines = {}, airports = [] }) {

  // ---------------------------
  // SORT AIRLINES BY RISK
  // ---------------------------
  const airlineList = Object.entries(airlines)
    .map(([name, data]) => ({
      name,
      ...data
    }))
    .sort((a, b) => b.avgRisk - a.avgRisk);

  const topAirline = airlineList[0];

  // ---------------------------
  // TOP AIRPORT HOTSPOTS
  // ---------------------------
  const topAirports = [...airports]
    .sort((a, b) => b.avgRisk - a.avgRisk)
    .slice(0, 5);

  return (
    <div style={{
      background: "#111827",
      padding: "20px",
      borderRadius: "10px"
    }}>
      
      <h2>✈️ Airline Operations Intelligence</h2>

      {/* =========================
          TOP AIRLINE ALERT
      ========================= */}
      {topAirline && (
        <div style={{
          background: "#7f1d1d",
          padding: "15px",
          borderRadius: "8px",
          marginBottom: "20px"
        }}>
          <h3>🚨 Highest Risk Airline</h3>
          <p><strong>{topAirline.name}</strong></p>
          <p>Flights: {topAirline.totalFlights}</p>
          <p>Avg Risk Score: {topAirline.avgRisk}</p>
        </div>
      )}

      {/* =========================
          AIRLINE TABLE
      ========================= */}
      <div style={{ marginBottom: "20px" }}>
        <h3>📊 Airline Risk Ranking</h3>

        <table style={{
          width: "100%",
          borderCollapse: "collapse"
        }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #333" }}>
              <th align="left">Airline</th>
              <th>Flights</th>
              <th>Avg Risk</th>
            </tr>
          </thead>
          <tbody>
            {airlineList.map((a, i) => (
              <tr key={i} style={{ borderBottom: "1px solid #222" }}>
                <td>{a.name}</td>
                <td align="center">{a.totalFlights}</td>
                <td align="center">
                  <span style={{
                    color:
                      a.avgRisk > 70 ? "red" :
                      a.avgRisk > 40 ? "orange" : "lightgreen"
                  }}>
                    {a.avgRisk}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* =========================
          AIRPORT HEATMAP LIST
      ========================= */}
      <div>
        <h3>🛫 Airport Risk Hotspots</h3>

        {topAirports.length === 0 && <p>No data available</p>}

        {topAirports.map((a, i) => (
          <div key={i} style={{
            background: "#1f2937",
            padding: "10px",
            borderRadius: "6px",
            marginBottom: "8px"
          }}>
            <strong>Zone:</strong> ({a.lat}, {a.lng}) <br />
            Flights: {a.count} <br />
            Avg Risk: 
            <span style={{
              marginLeft: "5px",
              color:
                a.avgRisk > 70 ? "red" :
                a.avgRisk > 40 ? "orange" : "lightgreen"
            }}>
              {a.avgRisk}
            </span>
          </div>
        ))}
      </div>

    </div>
  );
}
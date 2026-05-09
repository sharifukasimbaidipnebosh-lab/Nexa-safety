import React, { useEffect, useState } from "react";
import axios from "axios";

const Dashboard = () => {
  const [flights, setFlights] = useState([]);

  useEffect(() => {
    axios.get("http://localhost:5000/api/flights")
      .then((res) => {
        setFlights(res.data.flights || []);
      })
      .catch((err) => console.error(err));
  }, []);

  return (
    <div style={{ padding: "20px" }}>
      <h1>✈️ NEXA OS Dashboard</h1>

      <h2>Live Flights</h2>

      {flights.length === 0 ? (
        <p>No flight data available</p>
      ) : (
        flights.map((f) => (
          <div
            key={f.id}
            style={{
              padding: "10px",
              border: "1px solid #ccc",
              marginBottom: "10px",
              borderRadius: "6px",
            }}
          >
            <strong>{f.flight}</strong> — {f.airline}
            <br />
            Risk: {f.riskLevel || "N/A"}
            <br />
            Lat: {f.lat} | Lng: {f.lng}
          </div>
        ))
      )}
    </div>
  );
};

export default Dashboard;
import React, { useEffect, useState } from "react";
import { getFlights } from "../api/flightsAPI";

import FlightTable from "../components/FlightTable";
import FlightMap from "../components/FlightMap";

const Dashboard = () => {
  const [flights, setFlights] = useState([]);
  const [loading, setLoading] = useState(true);

  // ===============================
  // LOAD FLIGHTS
  // ===============================
  const loadFlights = async () => {
    try {
      const data = await getFlights();

      setFlights(data || []);
      setLoading(false);

    } catch (err) {

      console.error(
        "❌ Error loading flights:",
        err.message
      );

      setLoading(false);
    }
  };

  // ===============================
  // AUTO REFRESH
  // ===============================
  useEffect(() => {

    loadFlights();

    // 🔁 Refresh every 15 sec
    const interval = setInterval(() => {
      loadFlights();
    }, 15000);

    return () => clearInterval(interval);

  }, []);

  // ===============================
  // UI
  // ===============================
  return (
    <div
      style={{
        padding: "20px",
        fontFamily: "Arial",
        background: "#f4f6f9",
        minHeight: "100vh",
      }}
    >
      {/* HEADER */}
      <div style={{ marginBottom: "20px" }}>
        <h1
          style={{
            marginBottom: "5px",
            color: "#0b1f3a",
          }}
        >
          ✈️ NEXA OS Aviation Dashboard
        </h1>

        <p style={{ color: "gray" }}>
          Real-time aviation intelligence & risk monitoring
        </p>
      </div>

      {/* LIVE MAP */}
      <FlightMap flights={flights} />

      {/* TABLE SECTION */}
      <div
        style={{
          marginTop: "30px",
          background: "white",
          padding: "20px",
          borderRadius: "10px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        }}
      >
        <h2>📊 Live Flight Operations</h2>

        {loading ? (
          <p>Loading flight intelligence...</p>
        ) : (
          <FlightTable flights={flights} />
        )}
      </div>
    </div>
  );
};

export default Dashboard;
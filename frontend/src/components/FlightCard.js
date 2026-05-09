import React from "react";

const getColor = (risk) => {
  if (risk === "HIGH") return "red";
  if (risk === "MEDIUM") return "orange";
  return "green";
};

const FlightCard = ({ flight }) => {
  return (
    <div style={{
      border: "1px solid #ddd",
      padding: "12px",
      marginBottom: "10px",
      borderLeft: `6px solid ${getColor(flight.riskLevel)}`
    }}>
      <h3>{flight.flight}</h3>
      <p>Airline: {flight.airline}</p>
      <p>Lat: {flight.lat} | Lng: {flight.lng}</p>
      <p>Status: {flight.status || "ACTIVE"}</p>
      <p>Risk: {flight.riskLevel || "LOW"}</p>
    </div>
  );
};

export default FlightCard;
import React from "react";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";

export default function GlobalMap({ predictions }) {
  const getColor = (risk) => {
    if (risk === "HIGH") return "red";
    if (risk === "MEDIUM") return "orange";
    return "green";
  };

  return (
    <div style={{ height: "400px", marginTop: "20px" }}>
      <MapContainer center={[25.276987, 55.296249]} zoom={5} style={{ height: "100%" }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {predictions.map((p, i) => (
          <CircleMarker
            key={i}
            center={[p.lat, p.lng]}
            radius={10}
            pathOptions={{ color: getColor(p.risk) }}
          >
            <Popup>
              ✈️ {p.flight} <br />
              Airline: {p.airline} <br />
              Risk: {p.risk} ({p.score})
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}
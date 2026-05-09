import React from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";

// Fix default marker icon issue (VERY IMPORTANT)
delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  iconUrl:
    "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
});

const FlightMap = ({ flights }) => {
  return (
    <div style={{ marginTop: "20px" }}>
      <h2>🌍 Live Airspace Map</h2>

      <MapContainer
        center={[25.276987, 55.296249]} // Dubai center (your region)
        zoom={4}
        style={{ height: "500px", width: "100%" }}
      >
        {/* 🗺️ Map Tiles */}
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* ✈️ Aircraft Markers */}
        {flights.map((f) => (
          <Marker
            key={f.id}
            position={[f.lat, f.lng]}
          >
            <Popup>
              <div>
                <strong>{f.flight}</strong>
                <br />
                Airline: {f.airline}
                <br />
                Altitude: {f.altitude}
                <br />
                Speed: {f.velocity}
                <br />
                Risk: {f.riskLevel}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default FlightMap;
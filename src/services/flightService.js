const axios = require("axios");

// Fetch live flights
async function fetchLiveFlights() {
  try {
    const res = await axios.get(
      "https://opensky-network.org/api/states/all"
    );

    const states = res.data.states || [];

    // Map to Nexa format
    const flights = states.slice(0, 20).map((s, i) => ({
      id: i,
      flight: s[1]?.trim() || "UNKNOWN",
      airline: s[2] || "Unknown",
      lat: s[6],
      lng: s[5],
      velocity: s[9],
      altitude: s[13],
      status: "LIVE"
    }));

    return flights.filter(f => f.lat && f.lng);
  } catch (err) {
    console.error("Flight API Error:", err.message);
    return [];
  }
}

module.exports = { fetchLiveFlights };
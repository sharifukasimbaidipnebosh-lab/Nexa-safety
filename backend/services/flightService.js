const axios = require("axios");

// ===============================
// CACHE
// ===============================
let cachedFlights = [];
let lastFetchTime = 0;

const CACHE_DURATION = 1000 * 60 * 2; // 2 minutes

/**
 * ✈️ Fetch live flights safely
 */
const fetchLiveFlights = async () => {

  const now = Date.now();

  // ===============================
  // USE CACHE
  // ===============================
  if (
    cachedFlights.length > 0 &&
    now - lastFetchTime < CACHE_DURATION
  ) {
    console.log("🟡 Using cached flights");
    return cachedFlights;
  }

  try {

    console.log("🌍 Fetching live flights...");

    const response = await axios.get(
      "https://opensky-network.org/api/states/all",
      {
        timeout: 15000,
      }
    );

    const states = response.data.states || [];

    const flights = states
      .filter((f) => f[1] && f[5] && f[6])
      .slice(0, 100)
      .map((f, index) => {

        const callsign = f[1]?.trim() || "UNKNOWN";
        const airlineCode =
          callsign.substring(0, 3).toUpperCase();

        return {
          id: index + 1,

          flight: callsign,

          airlineCode,

          airline: extractAirline(airlineCode),

          lat: Number(f[6]) || 0,
          lng: Number(f[5]) || 0,

          altitude: Number(f[7]) || 0,
          velocity: Number(f[9]) || 0,

          verticalRate: Number(f[11]) || 0,

          country: f[2] || "Unknown",

          lastSeen: f[4] || null,

          onGround: f[8] || false,

          heading: Number(f[10]) || 0,

          squawk: f[14] || null,

          status: f[8]
            ? "ON GROUND"
            : "IN AIR",

          riskLevel: randomRisk(),

          fatigueRisk: Math.floor(
            Math.random() * 100
          ),
        };
      });

    // ===============================
    // UPDATE CACHE
    // ===============================
    cachedFlights = flights;
    lastFetchTime = now;

    console.log(
      `✈️ Live flights loaded: ${flights.length}`
    );

    return flights;

  } catch (error) {

    // ===============================
    // RATE LIMIT HANDLING
    // ===============================
    if (error.response?.status === 429) {

      console.warn(
        "⚠️ OpenSky rate limit reached — using cache"
      );

      return cachedFlights;
    }

    console.error(
      "❌ Flight API Error:",
      error.message
    );

    return cachedFlights;
  }
};

/**
 * 🧠 Airline ICAO lookup
 */
function extractAirline(code = "") {

  const airlines = {

    UAE: "Emirates",
    QTR: "Qatar Airways",
    ETD: "Etihad Airways",
    DAL: "Delta Airlines",
    AAL: "American Airlines",
    UAL: "United Airlines",
    BAW: "British Airways",
    AFR: "Air France",
    DLH: "Lufthansa",
    THY: "Turkish Airlines",
    ETH: "Ethiopian Airlines",
    KQA: "Kenya Airways",
    SIA: "Singapore Airlines",
  };

  return airlines[code] || "Unknown Airline";
}

/**
 * 🚦 Random AI risk
 */
function randomRisk() {

  const risks = ["LOW", "MEDIUM", "HIGH"];

  return risks[
    Math.floor(Math.random() * risks.length)
  ];
}

module.exports = {
  fetchLiveFlights,
};
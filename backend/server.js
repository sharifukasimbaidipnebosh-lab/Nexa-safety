require("dotenv").config();

const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

// ===============================
// GLOBAL STATE (MOVED UP — FIXED)
// ===============================
let flights = [];
let predictions = [];
let alerts = [];
let decisions = [];
let psychProfiles = [];
let unifiedRisk = [];

// ===============================
// SERVICES (SAFE LOAD)
// ===============================
let calculateRisk,
  predictFutureRisk,
  generateIntelligentAlerts,
  fetchLiveFlights,
  generateDecisions,
  analyzeRootCause,
  analyzePsychData;

try {
  ({ calculateRisk } = require("./services/riskEngine"));
  ({ predictFutureRisk } = require("./services/predictionService"));
  ({ generateIntelligentAlerts } = require("./services/alertEngine"));
  ({ fetchLiveFlights } = require("./services/flightService"));
  ({ generateDecisions } = require("./services/decisionEngine"));
  ({ analyzeRootCause } = require("./services/rootCauseEngine"));
  ({ analyzePsychData } = require("./services/mindEngine"));

  console.log("✅ All AI services loaded");

} catch (err) {
  console.warn("⚠️ Service load issue:", err.message);
}

// ===============================
// ROUTES
// ===============================
const authRoutes = require("./routes/authRoutes");
const billingRoutes = require("./routes/billingRoutes");
const copilotRoutes = require("./routes/copilotRoutes");
const uploadRoutes = require("./routes/uploadRoutes");

// ===============================
// DB
// ===============================
const pool = require("./config/db");

// ===============================
// INIT APP
// ===============================
const app = express();
const server = http.createServer(app);

// ===============================
// MIDDLEWARE
// ===============================
app.use(cors());
app.use(express.json());

// ===============================
// ROUTES
// ===============================
app.use("/api/auth", authRoutes);
app.use("/api/billing", billingRoutes);
app.use("/api/copilot", copilotRoutes);
app.use("/api/upload", uploadRoutes);

// ===============================
// HEALTH CHECK
// ===============================
app.get("/", (req, res) => {
  res.json({
    status: "OK",
    system: "NEXA OS",
    flights: flights.length,
    aiEngine: "ACTIVE"
  });
});

// ===============================
// PUBLIC APIs (SAFE)
// ===============================
app.get("/api/flights", (req, res) => {
  res.json({ flights: flights || [] });
});

app.get("/api/predictions", (req, res) => {
  res.json({ predictions: predictions || [] });
});

app.get("/api/alerts", (req, res) => {
  res.json({ alerts: alerts || [] });
});

app.get("/api/decisions", (req, res) => {
  res.json({ decisions: decisions || [] });
});

app.get("/api/psych", (req, res) => {
  res.json({ psychProfiles: psychProfiles || [] });
});

app.get("/api/unified-risk", (req, res) => {
  res.json({ unifiedRisk: unifiedRisk || [] });
});

// ===============================
// DB CHECK
// ===============================
pool.query("SELECT NOW()")
  .then(res => console.log("✅ DB Connected:", res.rows[0]))
  .catch(err => console.error("❌ DB Error:", err.message));

// ===============================
// SOCKET
// ===============================
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});

io.on("connection", (socket) => {
  console.log("⚡ Client connected:", socket.id);

  socket.emit("flights_update", flights);
  socket.emit("predictions_update", predictions);
  socket.emit("alerts_update", alerts);
  socket.emit("decisions_update", decisions);
  socket.emit("psych_update", psychProfiles);
  socket.emit("unified_risk_update", unifiedRisk);
});

// ===============================
// RATE LIMIT FIX (CRITICAL)
// ===============================
let lastFlightFetch = 0;
const FLIGHT_CACHE_MS = 60000; // 1 minute cache

async function updateFlights() {
  if (!fetchLiveFlights) return;

  const now = Date.now();

  if (now - lastFlightFetch < FLIGHT_CACHE_MS) {
    return; // prevent 429 error
  }

  try {
    const live = await fetchLiveFlights();

    if (live?.length) {
      flights = live;
      lastFlightFetch = now;
      console.log(`✈️ Flights updated: ${flights.length}`);
    }

  } catch (err) {
    console.warn("⚠️ Flight fetch error:", err.message);
  }
}

// ===============================
// MAIN LOOP
// ===============================
setInterval(async () => {
  try {

    await updateFlights();

    if (!calculateRisk) return;

    predictions = flights.map((f, i) => {
      const risk = calculateRisk({
        rest_hours_before_flight: Math.random() * 12,
        incident_type: "NONE",
        severity_level: "LOW",
        crew_feedback: "Normal"
      });

      return {
        id: i,
        flight: f.flight,
        airline: f.airline,
        lat: f.lat,
        lng: f.lng,
        score: risk?.score || 0,
        risk: risk?.level || "LOW"
      };
    });

    unifiedRisk = predictions;

    io.emit("flights_update", flights);
    io.emit("predictions_update", predictions);
    io.emit("unified_risk_update", unifiedRisk);

    console.log("🧠 NEXA OS CYCLE COMPLETE");

  } catch (err) {
    console.error("❌ Engine error:", err.message);
  }

}, 15000);

// ===============================
// START SERVER
// ===============================
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 NEXA OS RUNNING ON PORT ${PORT}`);
});
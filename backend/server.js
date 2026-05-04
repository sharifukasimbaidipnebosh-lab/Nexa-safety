require("dotenv").config();

const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

// ===============================
// 🧠 CORE + ADVANCED ENGINES
// ===============================
const { calculateRisk } = require("./services/riskEngine");
const { predictFutureRisk } = require("./services/predictionService");
const { generateIntelligentAlerts } = require("./services/alertEngine");
const { fetchLiveFlights } = require("./services/flightService");

const { generateDecisions } = require("./services/decisionEngine");
const { analyzeRootCause } = require("./services/rootCauseEngine");

// 🧠 LAYER 5 — NEXA MIND
const { analyzePsychData } = require("./services/mindEngine");

// ===============================
// 🔐 AUTH + BILLING + COPILOT
// ===============================
const authRoutes = require("./routes/authRoutes");
const billingRoutes = require("./routes/billingRoutes");
const copilotRoutes = require("./routes/copilotRoutes");

const authMiddleware = require("./middleware/authMiddleware");

// ===============================
// DB + ROUTES
// ===============================
const pool = require("./config/db");
const uploadRoutes = require("./routes/uploadRoutes");

const app = express();
const server = http.createServer(app);

// ===============================
// MIDDLEWARE
// ===============================
app.use(cors());
app.use(express.json());

// ===============================
// API ROUTES (NEW)
// ===============================
app.use("/api/auth", authRoutes);
app.use("/api/billing", billingRoutes);
app.use("/api/copilot", copilotRoutes);

// Existing
app.use("/api/upload", uploadRoutes);

// ===============================
// DB CHECK
// ===============================
pool.query("SELECT NOW()")
  .then(res => console.log("✅ DB Connected:", res.rows[0]))
  .catch(err => console.error("❌ DB Error:", err.message));

// ===============================
// SOCKET.IO
// ===============================
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// ===============================
// GLOBAL STATE
// ===============================
let flights = [];
let predictions = [];
let alerts = [];
let decisions = [];

let psychProfiles = [];
let unifiedRisk = [];

let airlineStats = {};
let airportHeatmap = [];

// ===============================
// HEALTH CHECK
// ===============================
app.get("/", (req, res) => {
  res.json({
    status: "OK",
    system: "NEXA OS",
    version: "Production SaaS",
    modules: [
      "Auth",
      "Billing",
      "Copilot",
      "Safety AI",
      "Mind AI",
      "Unified Intelligence"
    ]
  });
});

// ===============================
// 🔒 PROTECTED API EXAMPLES
// ===============================
app.get("/api/secure/flights", authMiddleware, (req, res) => {
  res.json({ flights });
});

// ===============================
// PUBLIC API
// ===============================
app.get("/api/flights", (req, res) => res.json({ flights }));
app.get("/api/predictions", (req, res) => res.json({ predictions }));
app.get("/api/alerts", (req, res) => res.json({ alerts }));
app.get("/api/decisions", (req, res) => res.json({ decisions }));

app.get("/api/psych", (req, res) => res.json({ psychProfiles }));
app.get("/api/unified-risk", (req, res) => res.json({ unifiedRisk }));

app.get("/api/predictions/future", (req, res) => {
  const forecast = predictFutureRisk(flights, predictions);
  res.json({ forecast });
});

app.get("/api/airlines", (req, res) => res.json({ airlineStats }));
app.get("/api/airports", (req, res) => res.json({ airportHeatmap }));

// ===============================
// SOCKET CONNECTION
// ===============================
io.on("connection", (socket) => {
  console.log("⚡ Client connected:", socket.id);

  socket.emit("flights_update", flights);
  socket.emit("predictions_update", predictions);
  socket.emit("alerts_update", alerts);
  socket.emit("decisions_update", decisions);

  socket.emit("psych_update", psychProfiles);
  socket.emit("unified_risk_update", unifiedRisk);

  socket.emit("airline_update", airlineStats);
  socket.emit("airport_update", airportHeatmap);
});

// ===============================
// DATA FUNCTIONS
// ===============================
async function updateFlights() {
  const live = await fetchLiveFlights();
  if (live?.length) flights = live;
}

function calculateAirlineStats(predictions) {
  const stats = {};

  predictions.forEach((p) => {
    if (!stats[p.airline]) {
      stats[p.airline] = {
        totalFlights: 0,
        totalScore: 0,
        avgRisk: 0
      };
    }

    stats[p.airline].totalFlights++;
    stats[p.airline].totalScore += p.score;
  });

  Object.keys(stats).forEach((a) => {
    stats[a].avgRisk = Math.round(
      stats[a].totalScore / stats[a].totalFlights
    );
  });

  return stats;
}

function calculateAirportHeatmap(predictions) {
  const map = {};

  predictions.forEach((p) => {
    const key = `${Math.round(p.lat)},${Math.round(p.lng)}`;

    if (!map[key]) {
      map[key] = {
        lat: Math.round(p.lat),
        lng: Math.round(p.lng),
        count: 0,
        totalRisk: 0
      };
    }

    map[key].count++;
    map[key].totalRisk += p.score;
  });

  return Object.values(map).map((m) => ({
    ...m,
    avgRisk: Math.round(m.totalRisk / m.count)
  }));
}

// ===============================
// 🚀 MAIN ENGINE LOOP
// ===============================
setInterval(async () => {

  await updateFlights();

  predictions = flights.map((f, i) => {
    const flightData = {
      rest_hours_before_flight: Math.random() * 12,
      incident_type: Math.random() > 0.85 ? "MINOR" : "NONE",
      severity_level: Math.random() > 0.9 ? "HIGH" : "LOW",
      crew_feedback: Math.random() > 0.6 ? "Fatigue observed" : "Normal"
    };

    const risk = calculateRisk(flightData);
    const causes = analyzeRootCause(flightData, risk);

    return {
      id: i,
      flight: f.flight,
      airline: f.airline || "Unknown",
      lat: f.lat,
      lng: f.lng,
      score: risk.score,
      risk: risk.level,
      causes
    };
  });

  psychProfiles = predictions.map((p) => {
    const psych = analyzePsychData({
      fatigue_level: Math.random() * 100,
      stress_level: Math.random() * 100,
      workload_index: Math.random() * 100,
      mood_score: Math.random() * 100
    });

    return {
      flight: p.flight,
      airline: p.airline,
      mentalReadiness: psych.mrs,
      psychSafety: psych.psi
    };
  });

  unifiedRisk = predictions.map((p) => {
    const psych = psychProfiles.find(x => x.flight === p.flight);

    const mentalRisk = 100 - (psych?.mentalReadiness || 50);

    return {
      flight: p.flight,
      airline: p.airline,
      operationalRisk: p.score,
      mentalRisk,
      combinedRisk: Math.round((p.score * 0.6) + (mentalRisk * 0.4))
    };
  });

  const forecast = predictFutureRisk(flights, predictions);
  alerts = generateIntelligentAlerts(predictions, forecast);
  decisions = generateDecisions(predictions, forecast);

  airlineStats = calculateAirlineStats(predictions);
  airportHeatmap = calculateAirportHeatmap(predictions);

  io.emit("flights_update", flights);
  io.emit("predictions_update", predictions);
  io.emit("alerts_update", alerts);
  io.emit("future_risk_update", forecast);
  io.emit("decisions_update", decisions);

  io.emit("psych_update", psychProfiles);
  io.emit("unified_risk_update", unifiedRisk);

  io.emit("airline_update", airlineStats);
  io.emit("airport_update", airportHeatmap);

  console.log("🧠 NEXA OS FULL INTELLIGENCE CYCLE COMPLETE");

}, 15000);

// ===============================
// START SERVER
// ===============================
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 NEXA OS RUNNING ON ${PORT}`);
});
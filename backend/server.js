require("dotenv").config();

const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

// ===============================
// GLOBAL STATE
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

  console.warn(
    "⚠️ Service load issue:",
    err.message
  );
}

// ===============================
// ROUTES
// ===============================
const authRoutes = require("./routes/authRoutes");
const billingRoutes = require("./routes/billingRoutes");
const copilotRoutes = require("./routes/copilotRoutes");
const uploadRoutes = require("./routes/uploadRoutes");

// ===============================
// DATABASE
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
// API ROUTES
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
    version: "Enterprise Aviation AI",
    flights: flights.length,
    aiEngine: "ACTIVE",
    timestamp: new Date()
  });

});

// ===============================
// PUBLIC APIs
// ===============================
app.get("/api/flights", (req, res) => {

  res.json({
    success: true,
    total: flights.length,
    flights: flights || []
  });

});

app.get("/api/predictions", (req, res) => {

  res.json({
    success: true,
    total: predictions.length,
    predictions: predictions || []
  });

});

app.get("/api/alerts", (req, res) => {

  res.json({
    success: true,
    alerts: alerts || []
  });

});

app.get("/api/decisions", (req, res) => {

  res.json({
    success: true,
    decisions: decisions || []
  });

});

app.get("/api/psych", (req, res) => {

  res.json({
    success: true,
    psychProfiles: psychProfiles || []
  });

});

app.get("/api/unified-risk", (req, res) => {

  res.json({
    success: true,
    unifiedRisk: unifiedRisk || []
  });

});

// ===============================
// DATABASE CHECK
// ===============================
pool.query("SELECT NOW()")
  .then((res) => {

    console.log(
      "✅ PostgreSQL Connected"
    );

    console.log(
      "🕒 DB Time:",
      res.rows[0].now
    );

  })
  .catch((err) => {

    console.error(
      "❌ DB Error:",
      err.message
    );

  });

// ===============================
// SOCKET.IO
// ===============================
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// ===============================
// SOCKET CONNECTION
// ===============================
io.on("connection", (socket) => {

  console.log(
    "⚡ Client connected:",
    socket.id
  );

  socket.emit("flights_update", flights);

  socket.emit(
    "predictions_update",
    predictions
  );

  socket.emit(
    "alerts_update",
    alerts
  );

  socket.emit(
    "decisions_update",
    decisions
  );

  socket.emit(
    "psych_update",
    psychProfiles
  );

  socket.emit(
    "unified_risk_update",
    unifiedRisk
  );
});

// ===============================
// FLIGHT CACHE PROTECTION
// ===============================
let lastFlightFetch = 0;

const FLIGHT_CACHE_MS = 1000 * 60 * 2;

// ===============================
// UPDATE LIVE FLIGHTS
// ===============================
async function updateFlights() {

  if (!fetchLiveFlights) return;

  const now = Date.now();

  // ===========================
  // RATE LIMIT PROTECTION
  // ===========================
  if (
    now - lastFlightFetch <
    FLIGHT_CACHE_MS
  ) {

    console.log(
      "🟡 Using cached flights"
    );

    return;
  }

  try {

    const live =
      await fetchLiveFlights();

    if (live?.length) {

      flights = live;

      lastFlightFetch = now;

      console.log(
        `✈️ Flights updated: ${flights.length}`
      );
    }

  } catch (err) {

    console.warn(
      "⚠️ Flight fetch error:",
      err.message
    );
  }
}

// ===============================
// MAIN AI ENGINE LOOP
// ===============================
setInterval(async () => {

  try {

    // ===========================
    // LIVE FLIGHTS
    // ===========================
    await updateFlights();

    if (!calculateRisk) return;

    // ===========================
    // AI RISK PREDICTIONS
    // ===========================
    predictions = flights.map(
      (f, i) => {

        const risk =
          calculateRisk({
            rest_hours_before_flight:
              Math.random() * 12,

            incident_type:
              Math.random() > 0.9
                ? "MINOR"
                : "NONE",

            severity_level:
              Math.random() > 0.95
                ? "HIGH"
                : "LOW",

            crew_feedback:
              Math.random() > 0.7
                ? "Fatigue observed"
                : "Normal"
          });

        return {

          id: i,

          flight: f.flight,

          airline:
            f.airline ||
            "Unknown Airline",

          lat: f.lat,

          lng: f.lng,

          altitude:
            f.altitude || 0,

          velocity:
            f.velocity || 0,

          score:
            risk?.score || 0,

          risk:
            risk?.level || "LOW"
        };
      }
    );

    // ===========================
    // NEXA MIND
    // ===========================
    psychProfiles =
      predictions.map((p) => {

        if (!analyzePsychData)
          return {};

        const psych =
          analyzePsychData({

            fatigue_level:
              Math.random() * 100,

            stress_level:
              Math.random() * 100,

            workload_index:
              Math.random() * 100,

            mood_score:
              Math.random() * 100
          });

        return {

          flight: p.flight,

          airline: p.airline,

          mentalReadiness:
            psych?.mrs || 50,

          psychSafety:
            psych?.psi || 50
        };
      });

    // ===========================
    // UNIFIED RISK
    // ===========================
    unifiedRisk =
      predictions.map((p) => {

        const psych =
          psychProfiles.find(
            (x) =>
              x.flight === p.flight
          );

        const mentalRisk =
          100 -
          (
            psych?.mentalReadiness ||
            50
          );

        return {

          flight: p.flight,

          airline: p.airline,

          operationalRisk:
            p.score,

          mentalRisk,

          combinedRisk:
            Math.round(
              (
                p.score * 0.6
              ) +
              (
                mentalRisk * 0.4
              )
            )
        };
      });

    // ===========================
    // FORECAST
    // ===========================
    const forecast =
      predictFutureRisk
        ? predictFutureRisk(
            flights,
            predictions
          )
        : [];

    // ===========================
    // ALERTS
    // ===========================
    alerts =
      generateIntelligentAlerts
        ? generateIntelligentAlerts(
            predictions,
            forecast
          )
        : [];

    // ===========================
    // DECISIONS
    // ===========================
    decisions =
      generateDecisions
        ? generateDecisions(
            predictions,
            forecast
          )
        : [];

    // ===========================
    // REALTIME EMITS
    // ===========================
    io.emit(
      "flights_update",
      flights
    );

    io.emit(
      "predictions_update",
      predictions
    );

    io.emit(
      "alerts_update",
      alerts
    );

    io.emit(
      "decisions_update",
      decisions
    );

    io.emit(
      "psych_update",
      psychProfiles
    );

    io.emit(
      "unified_risk_update",
      unifiedRisk
    );

    console.log(
      "🧠 NEXA OS CYCLE COMPLETE"
    );

  } catch (err) {

    console.error(
      "❌ Engine error:",
      err.message
    );
  }

}, 15000);

// ===============================
// START SERVER
// ===============================
const PORT =
  process.env.PORT || 5000;

server.listen(PORT, () => {

  console.log(
    `🚀 NEXA OS RUNNING ON PORT ${PORT}`
  );

});
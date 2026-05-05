require("dotenv").config();

const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

// ===============================
// SERVICES (CORE ENGINE)
// ===============================
const { calculateRisk } = require("./services/riskEngine");
const { predictFutureRisk } = require("./services/predictionService");
const { generateIntelligentAlerts } = require("./services/alertEngine");
const { fetchLiveFlights } = require("./services/flightService");
const { generateDecisions } = require("./services/decisionEngine");
const { analyzeRootCause } = require("./services/rootCauseEngine");
const { analyzePsychData } = require("./services/mindEngine");

// ===============================
// ROUTES
// ===============================
const authRoutes = require("./routes/authRoutes");
const billingRoutes = require("./routes/billingRoutes");
const copilotRoutes = require("./routes/copilotRoutes");
const uploadRoutes = require("./routes/uploadRoutes");

// ===============================
// MIDDLEWARE
// ===============================
const authMiddleware = require("./middleware/authMiddleware");

// ===============================
// DB
// ===============================
const pool = require("./config/db");
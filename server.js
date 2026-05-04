require("dotenv").config();

const express = require("express");
const cors = require("cors");
const multer = require("multer");
const csv = require("csv-parser");
const fs = require("fs");
const path = require("path");

const pool = require("./config/db");

// 🧠 ALL ENGINES
const { calculateRisk } = require("./services/riskEngine");
const { analyzePsychData } = require("./services/mindEngine");
const { analyzeHumanFactors } = require("./services/humanEngine");
const { evaluateCompliance } = require("./services/complyEngine");
const { generateExecutiveReport } = require("./services/directorEngine");
const { generateStudioInsights } = require("./services/studioEngine");
const { generateCopilotResponse } = require("./services/copilotService");
const { generateExecutivePDF } = require("./services/pdfReportEngine");

// 🌍 MULTI-TENANT
const tenantMiddleware = require("./middleware/tenantMiddleware");

const app = express();
app.use(cors());
app.use(express.json());
app.use(tenantMiddleware);

/* ---------------------------------------
   FILE UPLOAD CONFIG
---------------------------------------- */
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const upload = multer({ dest: uploadDir });

/* ---------------------------------------
   GLOBAL STATE (PER TENANT)
---------------------------------------- */
let state = {};

/* ---------------------------------------
   HELPER: INIT TENANT STATE
---------------------------------------- */
function initTenant(tenantId) {
  if (!state[tenantId]) {
    state[tenantId] = {
      flights: [],
      predictions: [],
      humanProfiles: [],
      psychProfiles: [],
      complianceReport: [],
      executiveReport: {},
      studioInsights: [],
    };
  }
}

/* ---------------------------------------
   HEALTH CHECK
---------------------------------------- */
app.get("/", (req, res) => {
  res.json({
    system: "NEXA OS",
    status: "ACTIVE",
    modules: ["Safety", "Human", "Mind", "Comply", "Director", "Studio", "Copilot"],
    multiTenant: true
  });
});

/* ---------------------------------------
   LAYER 1–4 UPLOAD PIPELINE
---------------------------------------- */
app.post("/api/upload", upload.single("file"), async (req, res) => {
  const tenantId = req.tenantId;
  initTenant(tenantId);

  const results = [];

  fs.createReadStream(req.file.path)
    .pipe(csv())
    .on("data", (data) => results.push(data))
    .on("end", async () => {
      try {
        for (let row of results) {
          await pool.query(
            `INSERT INTO flights (
              flight_number,
              date,
              pilot_name,
              duty_start_time,
              duty_end_time,
              rest_hours_before_flight,
              incident_type,
              severity_level,
              crew_feedback,
              tenant_id
            ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
            [
              row.Flight_Number,
              row.Date,
              row.Pilot_Name,
              row.Duty_Start_Time,
              row.Duty_End_Time,
              row.Rest_Hours_Before_Flight,
              row.Incident_Type,
              row.Severity_Level,
              row.Crew_Feedback,
              tenantId
            ]
          );
        }

        fs.unlinkSync(req.file.path);

        res.json({
          message: "Upload Complete 🚀",
          tenant: tenantId,
          rows: results.length
        });

      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    });
});

/* ---------------------------------------
   API ENDPOINTS (TENANT SAFE)
---------------------------------------- */
app.get("/api/data", (req, res) => {
  const t = state[req.tenantId] || {};
  res.json(t);
});

/* ---------------------------------------
   GPT COPILOT
---------------------------------------- */
app.post("/api/copilot", (req, res) => {
  const t = state[req.tenantId];

  const response = generateCopilotResponse({
    query: req.body.query,
    predictions: t.predictions,
    humanProfiles: t.humanProfiles,
    psychProfiles: t.psychProfiles,
    complianceReport: t.complianceReport,
    executiveReport: t.executiveReport
  });

  res.json(response);
});

/* ---------------------------------------
   PDF REPORT
---------------------------------------- */
app.get("/api/report/pdf", (req, res) => {
  const t = state[req.tenantId];

  const file = generateExecutivePDF({
    executiveReport: t.executiveReport,
    predictions: t.predictions,
    humanProfiles: t.humanProfiles,
    psychProfiles: t.psychProfiles,
    complianceReport: t.complianceReport,
    filePath: `report-${req.tenantId}.pdf`
  });

  res.download(path.resolve(file));
});

/* ---------------------------------------
   🧠 MAIN INTELLIGENCE LOOP (LAYER 3–7)
---------------------------------------- */
setInterval(async () => {

  for (let tenantId in state) {

    const tenant = state[tenantId];

    /* -------------------------
       FETCH DATA
    ------------------------- */
    const dbData = await pool.query(
      "SELECT * FROM flights WHERE tenant_id = $1",
      [tenantId]
    );

    tenant.flights = dbData.rows;

    /* -------------------------
       LAYER 4 — SAFETY
    ------------------------- */
    tenant.predictions = tenant.flights.map(f => {
      const risk = calculateRisk(f);
      return {
        flight: f.flight_number,
        score: risk.score,
        risk: risk.level
      };
    });

    /* -------------------------
       🟡 NEXA HUMAN
    ------------------------- */
    tenant.humanProfiles = tenant.flights.map(f =>
      analyzeHumanFactors(f)
    );

    /* -------------------------
       🔴 NEXA MIND
    ------------------------- */
    tenant.psychProfiles = tenant.flights.map(f =>
      analyzePsychData(f)
    );

    /* -------------------------
       🟢 COMPLIANCE
    ------------------------- */
    tenant.complianceReport = evaluateCompliance(tenant.predictions);

    /* -------------------------
       🟣 DIRECTOR
    ------------------------- */
    tenant.executiveReport = generateExecutiveReport({
      predictions: tenant.predictions,
      human: tenant.humanProfiles,
      psych: tenant.psychProfiles,
      compliance: tenant.complianceReport
    });

    /* -------------------------
       🟠 STUDIO
    ------------------------- */
    tenant.studioInsights = generateStudioInsights(tenant);

  }

  console.log("🧠 NEXA OS Multi-Tenant Intelligence Cycle Complete");

}, 15000);

/* ---------------------------------------
   START SERVER
---------------------------------------- */
app.listen(process.env.PORT || 5000, () => {
  console.log("🚀 NEXA OS RUNNING (MULTI-TENANT)");
});
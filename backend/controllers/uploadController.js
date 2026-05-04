const fs = require("fs");
const csv = require("csv-parser");
const pool = require("../config/db");

// 🧠 SAFETY ENGINES
const { standardizeFlightData } = require("../services/dataStandardizer");
const { calculateRisk } = require("../services/riskEngine");

// 🔴 NEXA MIND ENGINE
const { analyzePsychData } = require("../services/mindEngine");

/* =====================================================
   ✈️ NEXA SAFETY UPLOAD (Layer 1 → 4)
===================================================== */
const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const rows = [];

    fs.createReadStream(req.file.path)
      .pipe(csv())
      .on("data", (data) => rows.push(data))
      .on("end", async () => {
        const client = await pool.connect();

        try {
          await client.query("BEGIN");

          const inserted = [];

          for (let row of rows) {
            // 1️⃣ CLEAN DATA
            const clean = standardizeFlightData(row);

            // 2️⃣ CREW
            const crewRes = await client.query(
              `INSERT INTO crew (employee_id, name)
               VALUES ($1, $2)
               ON CONFLICT (employee_id)
               DO UPDATE SET name = EXCLUDED.name
               RETURNING id`,
              [clean.pilot_id || clean.pilot_name, clean.pilot_name]
            );

            const crewId = crewRes.rows[0].id;

            // 3️⃣ AIRLINE
            const airlineRes = await client.query(
              `INSERT INTO airlines (name)
               VALUES ($1)
               ON CONFLICT (name) DO NOTHING
               RETURNING id`,
              [clean.airline || "Unknown"]
            );

            let airlineId;

            if (airlineRes.rows.length > 0) {
              airlineId = airlineRes.rows[0].id;
            } else {
              const existing = await client.query(
                `SELECT id FROM airlines WHERE name = $1`,
                [clean.airline || "Unknown"]
              );
              airlineId = existing.rows[0].id;
            }

            // 4️⃣ FLIGHT
            const flightRes = await client.query(
              `INSERT INTO flights (flight, airline_id, crew_id)
               VALUES ($1, $2, $3)
               RETURNING id`,
              [clean.flight_number, airlineId, crewId]
            );

            const flightId = flightRes.rows[0].id;

            // 5️⃣ OPERATIONAL DATA
            await client.query(
              `INSERT INTO operational_data
               (flight_id, fatigue_score, incidents, maintenance_issues)
               VALUES ($1, $2, $3, $4)`,
              [
                flightId,
                clean.fatigue_score || 0,
                clean.incidents || 0,
                clean.maintenance_issues || 0,
              ]
            );

            // 6️⃣ RISK ENGINE
            const risk = calculateRisk(clean);

            // 7️⃣ STORE RISK
            await client.query(
              `INSERT INTO risk_scores
               (flight_id, fatigue_component, incident_component, maintenance_component, total_score, risk_level)
               VALUES ($1,$2,$3,$4,$5,$6)`,
              [
                flightId,
                risk.fatigue || 0,
                risk.incident || 0,
                risk.maintenance || 0,
                risk.score,
                risk.level,
              ]
            );

            inserted.push({
              flight: clean.flight_number,
              risk: risk.level,
              score: risk.score,
            });
          }

          await client.query("COMMIT");

          fs.unlinkSync(req.file.path);

          res.json({
            message: "✈️ NEXA SAFETY Upload Complete",
            rows: inserted.length,
            preview: inserted.slice(0, 5),
          });

        } catch (err) {
          await client.query("ROLLBACK");
          console.error(err);

          res.status(500).json({
            message: "Safety processing failed",
            error: err.message,
          });
        } finally {
          client.release();
        }
      });

  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};


/* =====================================================
   🔴 NEXA MIND UPLOAD (Layer 5)
   Psychological Data → AI → DB
===================================================== */
const uploadMindData = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const rows = [];

    fs.createReadStream(req.file.path)
      .pipe(csv())
      .on("data", (data) => rows.push(data))
      .on("end", async () => {
        const client = await pool.connect();

        try {
          await client.query("BEGIN");

          const inserted = [];

          for (let row of rows) {
            // 🔴 1. AI ANALYSIS
            const psych = analyzePsychData(row);

            // 🔴 2. ENSURE CREW EXISTS
            const crewRes = await client.query(
              `INSERT INTO crew (employee_id, name)
               VALUES ($1, $2)
               ON CONFLICT (employee_id)
               DO UPDATE SET name = EXCLUDED.name
               RETURNING id`,
              [row.employee_id, row.name || "Unknown"]
            );

            const crewId = crewRes.rows[0].id;

            // 🔴 3. STORE PSYCHOLOGICAL DATA (CONFIDENTIAL)
            await client.query(
              `INSERT INTO psychological_data
               (crew_id, fatigue_level, stress_level, workload_index, mood_score,
                psychological_safety_index, mental_readiness_score)
               VALUES ($1,$2,$3,$4,$5,$6,$7)`,
              [
                crewId,
                psych.fatigue,
                psych.stress,
                psych.workload,
                psych.mood,
                psych.psi,
                psych.mrs,
              ]
            );

            inserted.push({
              employee_id: row.employee_id,
              psi: psych.psi,
              mrs: psych.mrs,
            });
          }

          await client.query("COMMIT");

          fs.unlinkSync(req.file.path);

          res.json({
            message: "🧠 NEXA MIND Upload Complete",
            rows: inserted.length,
            preview: inserted.slice(0, 5),
          });

        } catch (err) {
          await client.query("ROLLBACK");
          console.error(err);

          res.status(500).json({
            message: "Mind processing failed",
            error: err.message,
          });
        } finally {
          client.release();
        }
      });

  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};


module.exports = {
  uploadFile,
  uploadMindData, // 🔴 NEW EXPORT
};
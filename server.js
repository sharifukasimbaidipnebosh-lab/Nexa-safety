const express = require("express");
const { Pool } = require("pg");
const cors = require("cors");
const path = require("path");
const crypto = require("crypto");

const app = express();

/* =========================
   MIDDLEWARE
========================= */
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "frontend")));

/* =========================
   DATABASE
========================= */
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

pool.connect()
    .then(client => {
        console.log("✅ DATABASE CONNECTED");
        client.release();
        initDB();
    })
    .catch(err => {
        console.error("❌ DB ERROR:", err.message);
    });

/* =========================
   INIT TABLES
========================= */
async function initDB() {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            email TEXT UNIQUE,
            password TEXT,
            "tenantId" TEXT
        )
    `);

    await pool.query(`
        CREATE TABLE IF NOT EXISTS sessions (
            token TEXT PRIMARY KEY,
            "tenantId" TEXT,
            email TEXT
        )
    `);

    await pool.query(`
        CREATE TABLE IF NOT EXISTS incidents (
            id SERIAL PRIMARY KEY,
            "tenantId" TEXT,
            severity TEXT,
            location TEXT
        )
    `);

    console.log("✅ TABLES READY");
}

/* =========================
   AUTH
========================= */
async function auth(req, res, next) {
    const token = req.headers["authorization"];

    if (!token) return res.status(401).json({ error: "No token" });

    const result = await pool.query(
        "SELECT * FROM sessions WHERE token = $1",
        [token]
    );

    if (!result.rows[0]) {
        return res.status(401).json({ error: "Invalid session" });
    }

    req.user = result.rows[0];
    next();
}

/* =========================
   AUTH ROUTES
========================= */

// REGISTER
app.post("/register", async (req, res) => {
    const { email, password, tenantId } = req.body;

    if (!email || !password || !tenantId) {
        return res.status(400).json({ error: "Missing fields" });
    }

    try {
        await pool.query(
            `INSERT INTO users (email, password, "tenantId")
             VALUES ($1, $2, $3)`,
            [email, password, tenantId]
        );

        res.json({ message: "User created" });
    } catch {
        res.status(400).json({ error: "User exists" });
    }
});

// LOGIN
app.post("/login", async (req, res) => {
    const { email, password } = req.body;

    const result = await pool.query(
        "SELECT * FROM users WHERE email = $1 AND password = $2",
        [email, password]
    );

    const user = result.rows[0];

    if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = crypto.randomBytes(32).toString("hex");

    await pool.query(
        `INSERT INTO sessions (token, "tenantId", email)
         VALUES ($1, $2, $3)`,
        [token, user.tenantId, user.email]
    );

    res.json({
        token,
        tenantId: user.tenantId
    });
});

/* =========================
   INCIDENT ROUTES
========================= */

// CREATE INCIDENT
app.post("/incident", auth, async (req, res) => {
    const { severity, location } = req.body;

    await pool.query(
        `INSERT INTO incidents ("tenantId", severity, location)
         VALUES ($1, $2, $3)`,
        [req.user.tenantId, severity, location]
    );

    res.json({ message: "Incident recorded" });
});

/* =========================
   DASHBOARD
========================= */
app.get("/dashboard", auth, async (req, res) => {
    const result = await pool.query(
        `SELECT * FROM incidents WHERE "tenantId" = $1`,
        [req.user.tenantId]
    );

    const data = result.rows;

    res.json({
        total: data.length,
        high: data.filter(r => r.severity === "High").length,
        medium: data.filter(r => r.severity === "Medium").length,
        low: data.filter(r => r.severity === "Low").length
    });
});

/* =========================
   RISK ANALYSIS
========================= */
app.get("/risk-analysis", auth, async (req, res) => {

    const result = await pool.query(
        `SELECT * FROM incidents WHERE "tenantId" = $1`,
        [req.user.tenantId]
    );

    const data = result.rows.map(r => {

        const severityScore =
            r.severity === "High" ? 5 :
            r.severity === "Medium" ? 3 : 1;

        const locationScore =
            r.location?.includes("Runway") ? 5 :
            r.location?.includes("Ramp") ? 4 : 2;

        const riskIndex = (severityScore * locationScore * 3) / 4;

        return {
            location: r.location,
            severity: r.severity,
            riskIndex: riskIndex.toFixed(2),
            predictedRisk: (riskIndex + 2).toFixed(2),
            level:
                riskIndex > 20 ? "INTOLERABLE" :
                riskIndex > 12 ? "HIGH" :
                riskIndex > 6 ? "MEDIUM" : "LOW"
        };
    });

    res.json(data);
});

/* =========================
   ROOT + HEALTH
========================= */
app.get("/", (req, res) => {
    res.send("✈️ NEXA SAFETY API RUNNING");
});

app.get("/health", (req, res) => {
    res.json({ status: "OK" });
});

/* =========================
   START SERVER
========================= */
const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Server running on ${PORT}`);
});
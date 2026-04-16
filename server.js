const express = require("express");
const { Pool } = require("pg");
const cors = require("cors");
const path = require("path");
const crypto = require("crypto");

const app = express();

/* =========================
   GLOBAL SAFETY NET
========================= */
process.on("uncaughtException", (err) => {
    console.error("UNCAUGHT EXCEPTION:", err);
});

process.on("unhandledRejection", (err) => {
    console.error("UNHANDLED REJECTION:", err);
});

/* =========================
   MIDDLEWARE
========================= */
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "frontend")));

/* =========================
   DATABASE (POSTGRES RAILWAY)
========================= */
let pool = null;

if (process.env.DATABASE_URL) {
    pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
        max: 10
    });

    pool.on("error", (err) => {
        console.error("DB POOL ERROR:", err.message);
    });
} else {
    console.warn("⚠️ DATABASE_URL not set - running without DB");
}

/* =========================
   INIT DATABASE TABLES
========================= */
async function initDB() {
    if (!pool) return;

    try {
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
                email TEXT,
                "tenantId" TEXT
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

        console.log("✅ DATABASE TABLES READY");
    } catch (err) {
        console.error("DB INIT ERROR:", err.message);
    }
}

/* =========================
   HELPERS
========================= */
function isValidSeverity(severity) {
    return ["Low", "Medium", "High"].includes(severity);
}

function safeString(v, fallback = "Unknown") {
    return v ? v.toString() : fallback;
}

/* =========================
   AUTH MIDDLEWARE
========================= */
async function auth(req, res, next) {
    if (!pool) return res.status(500).json({ error: "DB not ready" });

    const token = req.headers["authorization"];
    if (!token) return res.status(401).json({ error: "No token" });

    try {
        const result = await pool.query(
            "SELECT * FROM sessions WHERE token = $1",
            [token]
        );

        if (!result.rows[0]) {
            return res.status(401).json({ error: "Invalid session" });
        }

        req.user = result.rows[0];
        next();

    } catch (err) {
        return res.status(500).json({ error: "Auth error" });
    }
}

/* =========================
   REGISTER
========================= */
app.post("/register", async (req, res) => {
    if (!pool) return res.status(500).json({ error: "DB not ready" });

    const { email, password, tenantId } = req.body;

    try {
        await pool.query(
            `INSERT INTO users (email, password, "tenantId") VALUES ($1, $2, $3)`,
            [email, password, tenantId]
        );

        res.json({ message: "User created" });

    } catch {
        res.status(400).json({ error: "User exists" });
    }
});

/* =========================
   LOGIN
========================= */
app.post("/login", async (req, res) => {
    if (!pool) return res.status(500).json({ error: "DB not ready" });

    const { email, password } = req.body;

    try {
        const result = await pool.query(
            "SELECT * FROM users WHERE email=$1 AND password=$2",
            [email, password]
        );

        const user = result.rows[0];

        if (!user) return res.status(401).json({ error: "Invalid login" });

        const token = crypto.randomBytes(32).toString("hex");

        await pool.query(
            `INSERT INTO sessions (token, email, "tenantId") VALUES ($1, $2, $3)`,
            [token, user.email, user.tenantId]
        );

        res.json({ token, tenantId: user.tenantId });

    } catch (err) {
        res.status(500).json({ error: "Login failed" });
    }
});

/* =========================
   DASHBOARD
========================= */
app.get("/dashboard", auth, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT * FROM incidents WHERE "tenantId"=$1`,
            [req.user.tenantId]
        );

        const clean = result.rows.filter(r => isValidSeverity(r.severity));

        res.json({
            total: clean.length,
            high: clean.filter(r => r.severity === "High").length,
            medium: clean.filter(r => r.severity === "Medium").length,
            low: clean.filter(r => r.severity === "Low").length
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/* =========================
   RISK ANALYSIS
========================= */
app.get("/risk-analysis", auth, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT * FROM incidents WHERE "tenantId"=$1`,
            [req.user.tenantId]
        );

        const output = result.rows.map(r => {

            let severityScore =
                r.severity === "High" ? 5 :
                r.severity === "Medium" ? 3 : 1;

            let locationScore = 2;
            if (r.location?.includes("Runway")) locationScore = 5;
            if (r.location?.includes("Ramp")) locationScore = 4;

            let riskIndex = (severityScore * locationScore * 3) / 4;

            let predicted = riskIndex +
                (r.severity === "High" ? 1 : 0) +
                (r.location?.includes("Runway") ? 2 : 0);

            let level = "LOW";
            if (predicted > 20) level = "INTOLERABLE";
            else if (predicted > 12) level = "HIGH";
            else if (predicted > 6) level = "MEDIUM";

            return {
                location: safeString(r.location),
                severity: r.severity,
                riskIndex: riskIndex.toFixed(2),
                predictedRisk: predicted.toFixed(2),
                level
            };
        });

        res.json(output);

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/* =========================
   ROOT
========================= */
app.get("/", (req, res) => {
    res.send("✈️ NEXA SAFETY SYSTEM LIVE");
});

/* =========================
   HEALTH CHECK (RAILWAY)
========================= */
app.get("/health", (req, res) => {
    res.json({
        status: "OK",
        uptime: process.uptime()
    });
});

/* =========================
   START SERVER (CRITICAL FIX)
========================= */
const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", async () => {
    console.log(`🚀 Server running on ${PORT}`);

    if (pool) {
        try {
            const client = await pool.connect();
            console.log("✅ DATABASE CONNECTED");
            client.release();
            await initDB();
        } catch (err) {
            console.error("DB CONNECTION FAILED:", err.message);
        }
    }
});
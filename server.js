const express = require("express");
const { Pool } = require("pg");
const cors = require("cors");
const path = require("path");
const crypto = require("crypto");

const app = express();

/* =========================
   GLOBAL ERROR SAFETY
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
   DATABASE (RAILWAY POSTGRES)
========================= */

// Validate DATABASE_URL is present before attempting any connection
if (!process.env.DATABASE_URL) {
    console.error("WARNING: DATABASE_URL is not set. Database features will be unavailable until it is provided.");
} else {
    // Log a masked version of the URL to aid connection debugging
    const maskedUrl = process.env.DATABASE_URL.replace(/:\/\/([^:]+):([^@]+)@/, "://<user>:<password>@");
    console.log("DATABASE_URL resolved:", maskedUrl);
}

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL && process.env.DATABASE_URL.includes("railway")
        ? { rejectUnauthorized: false }
        : false,
    // Prevent the pool from crashing the process on idle client errors
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000
});

// Catch errors emitted on idle pool clients so they never reach the
// uncaughtException handler and crash the process.
pool.on("error", (err) => {
    console.error("DB POOL ERROR (non-fatal):", err.message);
});

// Attempt an initial connection in the background — startup is not blocked
// and a failure here will not prevent the HTTP server from coming up.
function attemptDBConnection(retries = 5, delayMs = 3000) {
    if (!process.env.DATABASE_URL) {
        console.warn("Skipping DB connection attempt: DATABASE_URL not set.");
        return;
    }

    pool.connect((err, client, release) => {
        if (err) {
            console.error(`DB CONNECTION ERROR (${retries} retries left): ${err.message}`);
            if (retries > 0) {
                console.log(`Retrying DB connection in ${delayMs / 1000}s...`);
                setTimeout(() => attemptDBConnection(retries - 1, delayMs), delayMs);
            } else {
                console.error("DB connection failed after all retries. App will continue without a live DB connection.");
            }
        } else {
            console.log("DATABASE CONNECTED");
            release();
            // Run table initialisation only after a successful connection
            initDB();
        }
    });
}

/* =========================
   AUTO TABLE CREATION
========================= */
async function initDB() {
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

        console.log("TABLES READY");
    } catch (err) {
        console.error("TABLE INIT ERROR:", err.message);
    }
}

/* =========================
   VALIDATION
========================= */
function isValidSeverity(severity) {
    return ["Low", "Medium", "High"].includes(severity);
}

function safeString(value, fallback = "Unknown") {
    return value ? value.toString().trim() : fallback;
}

/* =========================
   AUTH MIDDLEWARE
========================= */
async function auth(req, res, next) {

    const token = req.headers["authorization"];

    if (!token) {
        return res.status(401).json({ error: "No token provided" });
    }

    try {
        const result = await pool.query(
            "SELECT * FROM sessions WHERE token = $1",
            [token]
        );

        const session = result.rows[0];

        if (!session) {
            return res.status(401).json({ error: "Invalid session" });
        }

        req.user = session;
        next();
    } catch (err) {
        return res.status(401).json({ error: "Invalid session" });
    }
}

/* =========================
   REGISTER
========================= */
app.post("/register", async (req, res) => {

    const { email, password, tenantId } = req.body;

    if (!email || !password || !tenantId) {
        return res.status(400).json({ error: "Missing fields" });
    }

    try {
        await pool.query(
            "INSERT INTO users (email, password, \"tenantId\") VALUES ($1, $2, $3)",
            [email, password, tenantId]
        );

        res.json({ message: "User created successfully" });
    } catch (err) {
        res.status(400).json({ error: "User already exists" });
    }
});

/* =========================
   LOGIN
========================= */
app.post("/login", async (req, res) => {

    const { email, password } = req.body;

    try {
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
            "INSERT INTO sessions (token, \"tenantId\", email) VALUES ($1, $2, $3)",
            [token, user.tenantId, user.email]
        );

        res.json({
            message: "Login successful",
            token,
            tenantId: user.tenantId
        });
    } catch (err) {
        res.status(500).json({ error: "Login failed" });
    }
});

/* =========================
   DASHBOARD (PROTECTED)
========================= */
app.get("/dashboard", auth, async (req, res) => {

    const tenant = req.user.tenantId;

    try {
        const result = await pool.query(
            "SELECT * FROM incidents WHERE \"tenantId\" = $1",
            [tenant]
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
   RISK ANALYSIS (SAFE ENGINE)
========================= */
app.get("/risk-analysis", auth, async (req, res) => {

    const tenant = req.user.tenantId;

    try {
        const result = await pool.query(
            "SELECT * FROM incidents WHERE \"tenantId\" = $1",
            [tenant]
        );

        const results = result.rows
            .filter(r => isValidSeverity(r.severity))
            .map(r => {

                let severityScore =
                    r.severity === "High" ? 5 :
                    r.severity === "Medium" ? 3 : 1;

                let locationScore = 2;
                if (r.location?.includes("Runway")) locationScore = 5;
                if (r.location?.includes("Ramp")) locationScore = 4;

                let departmentScore = 3;

                let riskIndex =
                    (severityScore * locationScore * departmentScore) / 4;

                let aiBoost = 0;
                if (r.severity === "High") aiBoost += 1;
                if (r.location?.includes("Runway")) aiBoost += 2;

                let predictedRisk = riskIndex + aiBoost;

                let level = "LOW";
                if (predictedRisk > 20) level = "INTOLERABLE";
                else if (predictedRisk > 12) level = "HIGH";
                else if (predictedRisk > 6) level = "MEDIUM";

                return {
                    location: safeString(r.location),
                    severity: r.severity,
                    riskIndex: riskIndex.toFixed(2),
                    predictedRisk: predictedRisk.toFixed(2),
                    level
                };
            });

        res.json(results);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/* =========================
   ROOT
========================= */
app.get("/", (req, res) => {
    res.send("✈️ NEXA SAFETY LOGIN SYSTEM RUNNING");
});

/* =========================
   HEALTH CHECK (RAILWAY SAFE)
========================= */
app.get("/health", (req, res) => {
    res.json({ status: "OK", system: "NEXA SAFETY" });
});

/* =========================
   SERVER START (RAILWAY FIXED)
========================= */
const PORT = process.env.PORT || 3000;

// Start the HTTP server first so Railway health checks pass immediately,
// then attempt the DB connection in the background with automatic retries.
app.listen(PORT, () => {
    console.log("🚀 NEXA SAFETY SaaS running on port", PORT);
    attemptDBConnection();
});

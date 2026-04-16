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
   DATABASE (POSTGRES)
========================= */
let pool = null;

if (!process.env.DATABASE_URL) {
    console.warn("⚠️ DATABASE_URL not set. Running WITHOUT DB.");
} else {
    const maskedUrl = process.env.DATABASE_URL.replace(/:\/\/([^:]+):([^@]+)@/, "://<user>:<password>@");
    console.log("DATABASE_URL:", maskedUrl);

    pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000
    });

    pool.on("error", (err) => {
        console.error("DB POOL ERROR:", err.message);
    });
}

/* =========================
   INIT DB
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
   AUTH
========================= */
async function auth(req, res, next) {

    if (!pool) return res.status(500).json({ error: "Database unavailable" });

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
        res.status(500).json({ error: "Auth failed" });
    }
}

/* =========================
   REGISTER
========================= */
app.post("/register", async (req, res) => {

    if (!pool) return res.status(500).json({ error: "Database unavailable" });

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

    if (!pool) return res.status(500).json({ error: "Database unavailable" });

    const { email, password } = req.body;

    try {
        const result = await pool.query(
            "SELECT * FROM users WHERE email = $1 AND password = $2",
            [email, password]
        );

        const user = result.rows[0];

        if (!user) return res.status(401).json({ error: "Invalid credentials" });

        const token = crypto.randomBytes(32).toString("hex");

        await pool.query(
            `INSERT INTO sessions (token, "tenantId", email) VALUES ($1, $2, $3)`,
            [token, user.tenantId, user.email]
        );

        res.json({ token, tenantId: user.tenantId });

    } catch {
        res.status(500).json({ error: "Login failed" });
    }
});

/* =========================
   DASHBOARD
========================= */
app.get("/dashboard", auth, async (req, res) => {

    try {
        const result = await pool.query(
            `SELECT * FROM incidents WHERE "tenantId" = $1`,
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
   ROOT + HEALTH
========================= */
app.get("/", (req, res) => {
    res.send("✈️ NEXA SAFETY LIVE");
});

app.get("/health", (req, res) => {
    res.json({ status: "OK", uptime: process.uptime() });
});

/* =========================
   START SERVER
========================= */
const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", async () => {
    console.log(`🚀 Running on port ${PORT}`);

    if (pool) {
        try {
            await pool.connect();
            console.log("✅ DATABASE CONNECTED");
            await initDB();
        } catch (err) {
            console.error("DB INIT FAILED:", err.message);
        }
    }
});
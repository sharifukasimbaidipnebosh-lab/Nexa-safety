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
   DATABASE (SAFE MODE)
========================= */
let pool = null;

if (process.env.DATABASE_URL) {
    try {
        pool = new Pool({
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
                console.error("❌ DB CONNECTION FAILED:", err.message);
            });

    } catch (err) {
        console.error("❌ DB INIT ERROR:", err.message);
    }
} else {
    console.warn("⚠️ DATABASE_URL not set — running without DB");
}

/* =========================
   INIT TABLES
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

        console.log("✅ TABLES READY");
    } catch (err) {
        console.error("❌ TABLE ERROR:", err.message);
    }
}

/* =========================
   AUTH
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
    } catch {
        res.status(401).json({ error: "Auth failed" });
    }
}

/* =========================
   ROUTES
========================= */
app.get("/", (req, res) => {
    res.send("✈️ NEXA SAFETY LIVE");
});

app.get("/health", (req, res) => {
    res.json({
        status: "OK",
        db: pool ? "connected" : "not configured",
        uptime: process.uptime()
    });
});

/* =========================
   START SERVER (CRITICAL FIX)
========================= */
const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Server running on ${PORT}`);
});
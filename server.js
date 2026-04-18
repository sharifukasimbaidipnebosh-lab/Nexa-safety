const express = require("express");
const { Pool } = require("pg");
const cors = require("cors");
const path = require("path");
const crypto = require("crypto");

const app = express();

/* =========================
   GLOBAL ERROR SAFETY
========================= */
process.on("uncaughtException", err => {
    console.error("UNCAUGHT EXCEPTION:", err);
});

process.on("unhandledRejection", err => {
    console.error("UNHANDLED REJECTION:", err);
});

/* =========================
   MIDDLEWARE
========================= */
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "frontend")));

/* =========================
   DATABASE (RAILWAY SAFE)
========================= */
let pool = null;

if (process.env.DATABASE_URL) {
    pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000
    });

    pool.on("error", err => {
        console.error("DB POOL ERROR:", err.message);
    });

    connectDB();
} else {
    console.warn("⚠️ DATABASE_URL not set — DB disabled");
}

function connectDB(retries = 5) {
    pool.connect((err, client, release) => {
        if (err) {
            console.error(`❌ DB CONNECTION FAILED (${retries} left):`, err.message);
            if (retries > 0) {
                setTimeout(() => connectDB(retries - 1), 3000);
            }
        } else {
            console.log("✅ DATABASE CONNECTED");
            release();
            initDB();
        }
    });
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
        console.error("❌ TABLE INIT ERROR:", err.message);
    }
}

/* =========================
   AUTH
========================= */
async function auth(req, res, next) {
    if (!pool) return res.status(500).json({ error: "DB not ready" });

    const token = req.headers["authorization"];

    if (!token) {
        return res.status(401).json({ error: "No token" });
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
        res.status(401).json({ error: "Auth failed" });
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
            'INSERT INTO users (email, password, "tenantId") VALUES ($1,$2,$3)',
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

    const { email, password } = req.body;

    if (!pool) {
        return res.status(500).json({ error: "DB not ready" });
    }

    try {
        const result = await pool.query(
            "SELECT * FROM users WHERE email=$1 AND password=$2",
            [email, password]
        );

        const user = result.rows[0];

        if (!user) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        const token = crypto.randomBytes(32).toString("hex");

        await pool.query(
            'INSERT INTO sessions (token,"tenantId",email) VALUES ($1,$2,$3)',
            [token, user.tenantId, user.email]
        );

        res.json({
            token,
            tenantId: user.tenantId
        });

    } catch (err) {
        res.status(500).json({ error: "Login failed" });
    }
});

/* =========================
   ADD INCIDENT (CRITICAL)
========================= */
app.post("/add-incident", auth, async (req, res) => {

    const { severity, location } = req.body;

    if (!severity || !location) {
        return res.status(400).json({ error: "Missing fields" });
    }

    try {
        await pool.query(
            'INSERT INTO incidents ("tenantId", severity, location) VALUES ($1,$2,$3)',
            [req.user.tenantId, severity, location]
        );

        res.json({ message: "Incident added" });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/* =========================
   DASHBOARD
========================= */
app.get("/dashboard", auth, async (req, res) => {

    try {
        const result = await pool.query(
            'SELECT * FROM incidents WHERE "tenantId"=$1',
            [req.user.tenantId]
        );

        const data = result.rows;

        res.json({
            total: data.length,
            high: data.filter(i => i.severity === "High").length,
            medium: data.filter(i => i.severity === "Medium").length,
            low: data.filter(i => i.severity === "Low").length
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
            'SELECT * FROM incidents WHERE "tenantId"=$1',
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
            let predictedRisk = riskIndex + (r.severity === "High" ? 2 : 0);

            let level = "LOW";
            if (predictedRisk > 20) level = "INTOLERABLE";
            else if (predictedRisk > 12) level = "HIGH";
            else if (predictedRisk > 6) level = "MEDIUM";

            return {
                location: r.location,
                severity: r.severity,
                riskIndex: riskIndex.toFixed(2),
                predictedRisk: predictedRisk.toFixed(2),
                level
            };
        });

        res.json(output);

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/* =========================
   HEALTH
========================= */
app.get("/health", (req, res) => {
    res.json({
        status: "OK",
        db: pool ? "connected" : "not connected",
        uptime: process.uptime()
    });
});

/* =========================
   ROOT
========================= */
app.get("/", (req, res) => {
    res.send("✈️ NEXA SAFETY LIVE");
});

/* =========================
   GLOBAL ERROR HANDLER
========================= */
app.use((err, req, res, next) => {
    console.error("EXPRESS ERROR:", err);
    res.status(500).json({ error: "Internal server error" });
});

/* =========================
   START SERVER (RAILWAY)
========================= */
const PORT = process.env.PORT || 3000;

console.log("PORT:", PORT);

app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Server running on ${PORT}`);
});
require("dotenv").config();
const express = require("express");
const { Pool } = require("pg");
const cors = require("cors");
const path = require("path");
const crypto = require("crypto");

const app = express();

/* =========================
   GLOBAL ERROR SAFETY
========================= */
process.on("uncaughtException", err => console.error("UNCAUGHT:", err));
process.on("unhandledRejection", err => console.error("REJECTION:", err));

/* =========================
   MIDDLEWARE
========================= */
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "frontend")));

/* =========================
   DATABASE (FIXED)
========================= */
let pool;

if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL missing");
    process.exit(1);
}

const isLocal =
    process.env.DATABASE_URL.includes("localhost") ||
    process.env.DATABASE_URL.includes("127.0.0.1");

pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: isLocal ? false : { rejectUnauthorized: false }
});

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
                location TEXT,
                "createdAt" TIMESTAMP DEFAULT NOW()
            )
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS actions (
                id SERIAL PRIMARY KEY,
                "tenantId" TEXT,
                incident_id INT,
                action TEXT,
                priority TEXT,
                status TEXT DEFAULT 'OPEN',
                created_at TIMESTAMP DEFAULT NOW()
            )
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS recommendations (
                id SERIAL PRIMARY KEY,
                "tenantId" TEXT,
                incident_id INT,
                risk_level TEXT,
                recommendation TEXT,
                root_cause TEXT,
                created_at TIMESTAMP DEFAULT NOW()
            )
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS flight_data (
                id SERIAL PRIMARY KEY,
                flight_number TEXT NOT NULL,
                flight_date DATE NOT NULL,
                pilot_name TEXT NOT NULL,
                duty_hours NUMERIC(5,2) NOT NULL,
                fatigue_flag BOOLEAN DEFAULT FALSE,
                severity_score NUMERIC(4,2),
                risk_score NUMERIC(4,2),
                risk_level TEXT,
                created_at TIMESTAMP DEFAULT NOW()
            )
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS flights (
                id SERIAL PRIMARY KEY,
                flight_number TEXT NOT NULL,
                date DATE NOT NULL,
                pilot_name TEXT NOT NULL,
                duty_hours NUMERIC(5,2) NOT NULL,
                rest_hours NUMERIC(5,2) NOT NULL,
                risk_level TEXT NOT NULL,
                risk_score NUMERIC(4,2) NOT NULL,
                prediction JSONB,
                created_at TIMESTAMP DEFAULT NOW()
            )
        `);

        console.log("✅ DATABASE READY");
    } catch (err) {
        console.error("DB INIT ERROR:", err);
    }
}

initDB();

/* =========================
   AUTH
========================= */
async function auth(req, res, next) {
    const token = req.headers["authorization"];
    if (!token) return res.status(401).json({ error: "No token" });

    const result = await pool.query(
        "SELECT * FROM sessions WHERE token=$1",
        [token]
    );

    if (!result.rows[0]) {
        return res.status(401).json({ error: "Invalid session" });
    }

    req.user = result.rows[0];
    next();
}

/* =========================
   AI ENGINES
========================= */
function generateAction(severity, location) {
    if (severity === "High")
        return { action: `Immediate investigation at ${location}`, priority: "CRITICAL" };

    if (severity === "Medium")
        return { action: `Safety inspection at ${location}`, priority: "HIGH" };

    return { action: `Monitor ${location}`, priority: "LOW" };
}

function generateRecommendation(severity, location) {
    if (severity === "High") {
        return {
            recommendation: "Stop operation immediately and investigate",
            rootCause: "Critical unsafe condition",
            priority: "HIGH"
        };
    }

    if (severity === "Medium") {
        return {
            recommendation: "Inspect and retrain staff",
            rootCause: "Human factors / procedural gap",
            priority: "MEDIUM"
        };
    }

    return {
        recommendation: "Monitor trend",
        rootCause: "Minor issue",
        priority: "LOW"
    };
}

function predictRiskTrend(data) {
    let map = {};

    data.forEach(i => {
        if (!map[i.location]) map[i.location] = { total: 0, score: 0 };

        let score =
            i.severity === "High" ? 5 :
            i.severity === "Medium" ? 3 : 1;

        map[i.location].total++;
        map[i.location].score += score;
    });

    return Object.keys(map).map(loc => {
        let avg = map[loc].score / map[loc].total;

        return {
            location: loc,
            riskScore: avg.toFixed(2),
            trend:
                avg > 4 ? "CRITICAL" :
                avg > 3 ? "HIGH" :
                avg > 2 ? "MEDIUM" : "LOW",
            probability: Math.min(95, Math.round(avg * 20)) + "%"
        };
    });
}

/* =========================
   AUTH ROUTES
========================= */
app.post("/register", async (req, res) => {
    const { email, password, tenantId } = req.body;

    try {
        await pool.query(
            'INSERT INTO users (email,password,"tenantId") VALUES ($1,$2,$3)',
            [email, password, tenantId]
        );
        res.json({ message: "User created" });
    } catch {
        res.status(400).json({ error: "User exists" });
    }
});

app.post("/login", async (req, res) => {
    const { email, password } = req.body;

    const result = await pool.query(
        "SELECT * FROM users WHERE email=$1 AND password=$2",
        [email, password]
    );

    const user = result.rows[0];
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    const token = crypto.randomBytes(32).toString("hex");

    await pool.query(
        'INSERT INTO sessions (token,"tenantId",email) VALUES ($1,$2,$3)',
        [token, user.tenantId, user.email]
    );

    res.json({ token, tenantId: user.tenantId });
});

/* =========================
   INCIDENT + ACTION + AI
========================= */
app.post("/incidents", auth, async (req, res) => {
    const { location, severity } = req.body;

    if (!location || !severity) {
        return res.status(400).json({ error: "Missing fields" });
    }

    try {
        const result = await pool.query(
            `INSERT INTO incidents ("tenantId", severity, location)
             VALUES ($1,$2,$3) RETURNING id`,
            [req.user.tenantId, severity, location]
        );

        const incidentId = result.rows[0].id;

        const action = generateAction(severity, location);
        const rec = generateRecommendation(severity, location);

        await pool.query(
            `INSERT INTO actions ("tenantId",incident_id,action,priority)
             VALUES ($1,$2,$3,$4)`,
            [req.user.tenantId, incidentId, action.action, action.priority]
        );

        await pool.query(
            `INSERT INTO recommendations
             ("tenantId",incident_id,risk_level,recommendation,root_cause)
             VALUES ($1,$2,$3,$4,$5)`,
            [req.user.tenantId, incidentId, rec.priority, rec.recommendation, rec.rootCause]
        );

        res.json({
            message: "Incident + AI generated",
            action,
            recommendation: rec
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/* =========================
   INCIDENT CRUD
========================= */
app.get("/incidents", auth, async (req, res) => {
    const result = await pool.query(
        'SELECT * FROM incidents WHERE "tenantId"=$1 ORDER BY id DESC',
        [req.user.tenantId]
    );
    res.json(result.rows);
});

app.put("/incidents/:id", auth, async (req, res) => {
    const { location, severity } = req.body;

    await pool.query(
        `UPDATE incidents SET location=$1,severity=$2 
         WHERE id=$3 AND "tenantId"=$4`,
        [location, severity, req.params.id, req.user.tenantId]
    );

    res.json({ message: "Updated" });
});

app.delete("/incidents/:id", auth, async (req, res) => {
    await pool.query(
        'DELETE FROM incidents WHERE id=$1 AND "tenantId"=$2',
        [req.params.id, req.user.tenantId]
    );

    res.json({ message: "Deleted" });
});

/* =========================
   ACTIONS
========================= */
app.get("/actions", auth, async (req, res) => {
    const result = await pool.query(
        'SELECT * FROM actions WHERE "tenantId"=$1 ORDER BY created_at DESC',
        [req.user.tenantId]
    );
    res.json(result.rows);
});

app.put("/actions/:id", auth, async (req, res) => {
    const { status } = req.body;

    await pool.query(
        'UPDATE actions SET status=$1 WHERE id=$2 AND "tenantId"=$3',
        [status, req.params.id, req.user.tenantId]
    );

    res.json({ message: "Action updated" });
});

/* =========================
   RECOMMENDATIONS
========================= */
app.get("/recommendations", auth, async (req, res) => {
    const result = await pool.query(
        'SELECT * FROM recommendations WHERE "tenantId"=$1 ORDER BY created_at DESC',
        [req.user.tenantId]
    );
    res.json(result.rows);
});

/* =========================
   DASHBOARD + AI
========================= */
app.get("/dashboard", auth, async (req, res) => {
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
});

app.get("/predict-risk", auth, async (req, res) => {
    const result = await pool.query(
        'SELECT * FROM incidents WHERE "tenantId"=$1',
        [req.user.tenantId]
    );

    res.json(predictRiskTrend(result.rows));
});

/* =========================
   HEALTH
========================= */
app.get("/health", (req, res) => {
    res.json({ status: "OK", uptime: process.uptime() });
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
   START SERVER
========================= */
const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Server running on ${PORT}`);
});
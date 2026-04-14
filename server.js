const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const cors = require("cors");
const path = require("path");
const crypto = require("crypto");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "frontend")));

// =========================
// DATABASE
// =========================
const db = new sqlite3.Database("./nexa.db");

// =========================
// CREATE TABLES (AUTO SETUP)
// =========================
db.serialize(() => {

    db.run(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE,
            password TEXT,
            tenantId TEXT
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS sessions (
            token TEXT PRIMARY KEY,
            tenantId TEXT,
            email TEXT
        )
    `);
});

// =========================
// VALIDATION LAYER
// =========================
function isValidSeverity(severity) {
    return ["Low", "Medium", "High"].includes(severity);
}

function safeString(value, fallback = "Unknown") {
    return value ? value.toString().trim() : fallback;
}

// =========================
// AUTH MIDDLEWARE
// =========================
function auth(req, res, next) {

    const token = req.headers["authorization"];

    if (!token) {
        return res.status(401).json({ error: "No token provided" });
    }

    db.get(
        "SELECT * FROM sessions WHERE token = ?",
        [token],
        (err, session) => {

            if (err || !session) {
                return res.status(401).json({ error: "Invalid session" });
            }

            req.user = session;
            next();
        }
    );
}

// =========================
// REGISTER USER (SaaS USER CREATION)
// =========================
app.post("/register", (req, res) => {

    const { email, password, tenantId } = req.body;

    db.run(
        "INSERT INTO users (email, password, tenantId) VALUES (?, ?, ?)",
        [email, password, tenantId],
        function (err) {

            if (err) {
                return res.json({ error: "User already exists" });
            }

            res.json({ message: "User created successfully" });
        }
    );
});

// =========================
// LOGIN SYSTEM
// =========================
app.post("/login", (req, res) => {

    const { email, password } = req.body;

    db.get(
        "SELECT * FROM users WHERE email = ? AND password = ?",
        [email, password],
        (err, user) => {

            if (err || !user) {
                return res.status(401).json({ error: "Invalid credentials" });
            }

            const token = crypto.randomBytes(32).toString("hex");

            db.run(
                "INSERT INTO sessions (token, tenantId, email) VALUES (?, ?, ?)",
                [token, user.tenantId, user.email]
            );

            res.json({
                message: "Login successful",
                token,
                tenantId: user.tenantId
            });
        }
    );
});

// =========================
// DASHBOARD (PROTECTED)
// =========================
app.get("/dashboard", auth, (req, res) => {

    const tenant = req.user.tenantId;

    db.all(
        "SELECT * FROM incidents WHERE tenantId = ?",
        [tenant],
        (err, rows) => {

            if (err) return res.json(err);

            const clean = rows.filter(r => isValidSeverity(r.severity));

            res.json({
                total: clean.length,
                high: clean.filter(r => r.severity === "High").length,
                medium: clean.filter(r => r.severity === "Medium").length,
                low: clean.filter(r => r.severity === "Low").length
            });
        }
    );
});

// =========================
// RISK ANALYSIS (PROTECTED)
// =========================
app.get("/risk-analysis", auth, (req, res) => {

    const tenant = req.user.tenantId;

    db.all(
        "SELECT * FROM incidents WHERE tenantId = ?",
        [tenant],
        (err, rows) => {

            if (err) return res.json(err);

            const results = rows
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
        }
    );
});

// =========================
// ROOT
// =========================
app.get("/", (req, res) => {
    res.send("✈️ NEXA SAFETY LOGIN SYSTEM RUNNING");
});

// =========================
// SERVER START
// =========================
app.listen(3000, () => {
    console.log("🚀 NEXA SAFETY SaaS running on http://localhost:3000");
});
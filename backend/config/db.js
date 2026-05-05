const { Pool } = require("pg");
require("dotenv").config();

// Detect environment
const isProduction = process.env.NODE_ENV === "production";

// ===============================
// DATABASE POOL CONFIG
// ===============================
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,

  // 🔐 Secure SSL handling for cloud DB (Render / Railway / Supabase)
  ssl: isProduction
    ? { rejectUnauthorized: false }
    : false,

  // 🧠 Better production stability
  max: 20,              // max connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

// ===============================
// CONNECTION TEST (SAFE)
// ===============================
const testConnection = async () => {
  try {
    const client = await pool.connect();
    const res = await client.query("SELECT NOW()");
    console.log("✅ PostgreSQL Connected");
    console.log("🕒 DB Time:", res.rows[0].now);
    client.release();
  } catch (err) {
    console.error("❌ DB Connection Error:", err.message);
  }
};

testConnection();

module.exports = pool;
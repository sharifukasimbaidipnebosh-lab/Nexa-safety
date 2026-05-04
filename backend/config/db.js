const { Pool } = require("pg");
require("dotenv").config();

// Detect environment
const isProduction = process.env.NODE_ENV === "production";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,

  // ✅ Only enable SSL in production (e.g., Railway, Supabase, Render)
  ssl: isProduction
    ? { rejectUnauthorized: false }
    : false,
});

// ✅ Test connection on startup (VERY IMPORTANT)
pool
  .connect()
  .then((client) => {
    console.log("✅ PostgreSQL Connected");

    // quick test query
    return client
      .query("SELECT NOW()")
      .then((res) => {
        console.log("🕒 DB Time:", res.rows[0].now);
        client.release();
      })
      .catch((err) => {
        client.release();
        console.error("❌ Query Error:", err.message);
      });
  })
  .catch((err) => {
    console.error("❌ DB Connection Error:", err.message);
  });

module.exports = pool;
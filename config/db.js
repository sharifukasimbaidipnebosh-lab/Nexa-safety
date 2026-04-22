const { Pool } = require("pg");

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "nexa_safety",
  password: "YOUR_PASSWORD",
  port: 5432,
});

module.exports = pool;
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const pool = require("../config/db");

const SECRET = process.env.JWT_SECRET || "nexa-secret";

async function registerUser({ tenantName, email, password }) {
  // 1. Create tenant if not exists
  let tenant = await pool.query(
    "SELECT * FROM tenants WHERE name = $1",
    [tenantName]
  );

  if (tenant.rows.length === 0) {
    tenant = await pool.query(
      "INSERT INTO tenants (name) VALUES ($1) RETURNING *",
      [tenantName]
    );
  }

  const tenantId = tenant.rows[0].id;

  // 2. Hash password
  const hash = await bcrypt.hash(password, 10);

  // 3. Create user
  const user = await pool.query(
    `INSERT INTO users (tenant_id, email, password_hash)
     VALUES ($1,$2,$3) RETURNING *`,
    [tenantId, email, hash]
  );

  return user.rows[0];
}

async function loginUser({ email, password }) {
  const userRes = await pool.query(
    "SELECT * FROM users WHERE email = $1",
    [email]
  );

  if (userRes.rows.length === 0) {
    throw new Error("User not found");
  }

  const user = userRes.rows[0];

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) throw new Error("Invalid password");

  const token = jwt.sign(
    {
      userId: user.id,
      tenantId: user.tenant_id,
      role: user.role
    },
    SECRET,
    { expiresIn: "1d" }
  );

  return { token };
}

module.exports = {
  registerUser,
  loginUser
};
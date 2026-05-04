const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const pool = require("../config/db");

// ===============================
// 🔐 LOGIN
// ===============================
const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ message: "User not found" });
    }

    const user = result.rows[0];

    const valid = await bcrypt.compare(password, user.password);

    if (!valid) {
      return res.status(401).json({ message: "Invalid password" });
    }

    const token = jwt.sign(
      {
        userId: user.id,
        tenantId: user.tenant_id,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      token,
      user: {
        email: user.email,
        role: user.role,
        tenantId: user.tenant_id
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Login error" });
  }
};

// ===============================
// 🆕 REGISTER (SIGNUP)
// ===============================
const register = async (req, res) => {
  const { email, password, tenantName } = req.body;

  try {
    // 1️⃣ Check if user exists
    const existing = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({ message: "User already exists" });
    }

    // 2️⃣ Create tenant (airline)
    const tenantRes = await pool.query(
      "INSERT INTO tenants (name) VALUES ($1) RETURNING id",
      [tenantName]
    );

    const tenantId = tenantRes.rows[0].id;

    // 3️⃣ Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4️⃣ Create user (admin)
    const userRes = await pool.query(
      `INSERT INTO users (email, password, role, tenant_id)
       VALUES ($1, $2, $3, $4)
       RETURNING id, email, role, tenant_id`,
      [email, hashedPassword, "admin", tenantId]
    );

    const user = userRes.rows[0];

    // 5️⃣ Generate JWT
    const token = jwt.sign(
      {
        userId: user.id,
        tenantId: user.tenant_id,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.status(201).json({
      message: "Account created successfully 🚀",
      token,
      user
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Registration error" });
  }
};

module.exports = { login, register };
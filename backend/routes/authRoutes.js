const express = require("express");
const router = express.Router();

// Controllers
const { login, register } = require("../controllers/authController");

// ===============================
// AUTH ROUTES
// ===============================

// REGISTER USER
router.post("/register", async (req, res, next) => {
  try {
    await register(req, res);
  } catch (err) {
    console.error("Register Error:", err.message);
    res.status(500).json({ message: "Registration failed" });
  }
});

// LOGIN USER
router.post("/login", async (req, res, next) => {
  try {
    await login(req, res);
  } catch (err) {
    console.error("Login Error:", err.message);
    res.status(500).json({ message: "Login failed" });
  }
});

module.exports = router;
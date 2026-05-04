const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const { subscribe } = require("../controllers/billingController");

router.post("/subscribe", auth, subscribe);

module.exports = router;
const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const { chat } = require("../controllers/copilotController");

router.post("/chat", auth, chat);

module.exports = router;
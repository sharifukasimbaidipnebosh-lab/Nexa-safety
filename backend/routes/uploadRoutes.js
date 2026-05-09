const express = require("express");
const multer = require("multer");
const path = require("path");

const router = express.Router();

// Controllers
const {
  uploadOperational,
  uploadPsychological,
  downloadTemplate
} = require("../controllers/uploadController");

// PDF Service
const { generateExecutivePDF } = require("../services/pdfService");

// ===============================
// 📂 FILE UPLOAD CONFIG
// ===============================
const upload = multer({
  dest: path.join(__dirname, "../uploads")
});

// ===============================
// 📄 PDF REPORT DOWNLOAD
// ===============================
router.get("/report/pdf", (req, res) => {
  try {
    const file = generateExecutivePDF({
      executiveReport: {},
      predictions: [],
      humanProfiles: [],
      psychProfiles: [],
      complianceReport: {}
    });

    res.download(path.resolve(file));
  } catch (err) {
    console.error("❌ PDF Error:", err.message);
    res.status(500).json({ error: "Failed to generate PDF" });
  }
});

// ===============================
// 🟦 NEXA SAFETY — OPERATIONAL DATA
// ===============================
router.post("/operational", upload.single("file"), uploadOperational);

// ===============================
// 🔴 NEXA MIND — PSYCHOLOGICAL DATA
// ===============================
router.post("/psychological", upload.single("file"), uploadPsychological);

// ===============================
// 📥 DOWNLOAD CSV TEMPLATES
// ===============================
router.get("/templates/:type", downloadTemplate);

module.exports = router;
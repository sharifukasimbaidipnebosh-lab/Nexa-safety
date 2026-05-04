const express = require("express");
const multer = require("multer");
const router = express.Router();

// Controllers
const {
  uploadOperational,
  uploadPsychological,
  downloadTemplate
} = require("../controllers/uploadController");

// File upload config
const upload = multer({ dest: "uploads/" });

app.get("/api/report/pdf", (req, res) => {
  const file = generateExecutivePDF({
    executiveReport,
    predictions,
    humanProfiles,
    psychProfiles,
    complianceReport
  });

  res.download(path.resolve(file));
});

/* ---------------------------------------
   🟦 NEXA SAFETY — OPERATIONAL DATA
---------------------------------------- */
router.post("/operational", upload.single("file"), uploadOperational);

/* ---------------------------------------
   🔴 NEXA MIND — PSYCHOLOGICAL DATA
---------------------------------------- */
router.post("/psychological", upload.single("file"), uploadPsychological);

/* ---------------------------------------
   📥 DOWNLOAD CSV TEMPLATES
---------------------------------------- */
router.get("/templates/:type", downloadTemplate);

module.exports = router;
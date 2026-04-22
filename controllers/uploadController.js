const multer = require("multer");
const { parseFile } = require("../services/parsingService");
const { cleanData } = require("../services/cleaningService");
const { calculateRisk } = require("../services/riskEngine");
const { validateRow } = require("../services/validationService");
const { insertFlightData } = require("../models/flightDataModel");
const { generateTemplate } = require("../utils/excelTemplate");

const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});

const upload = multer({ storage }).single("file");

exports.uploadFile = (req, res) => {
  upload(req, res, async (err) => {
    if (err) return res.status(500).json({ error: err.message });

    const parsed = await parseFile(req.file.path);

    const valid = [];
    const errors = [];

    parsed.forEach((row, i) => {
      const errMsg = validateRow(row);
      if (errMsg) errors.push({ row: i + 1, error: errMsg });
      else valid.push(row);
    });

    const cleaned = cleanData(valid);
    const risked = calculateRisk(cleaned);

    await insertFlightData(risked);

    res.json({ inserted: risked.length, errors });
  });
};

exports.downloadTemplate = (req, res) => {
  const filePath = "uploads/template.xlsx";
  generateTemplate(filePath);
  res.download(filePath);
};
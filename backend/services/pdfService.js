// backend/services/pdfService.js

const generateExecutivePDF = (data) => {
  const filePath = "backend/uploads/report.pdf";

  // simple placeholder (real PDF later)
  const fs = require("fs");

  fs.writeFileSync(
    filePath,
    JSON.stringify(data, null, 2)
  );

  return filePath;
};

module.exports = { generateExecutivePDF };
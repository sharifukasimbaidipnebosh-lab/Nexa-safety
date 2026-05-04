// backend/services/pdfReportEngine.js

const PDFDocument = require("pdfkit");
const fs = require("fs");

/**
 * 🧾 NEXA EXECUTIVE PDF REPORT ENGINE
 */

function generateExecutivePDF({
  executiveReport,
  predictions,
  humanProfiles,
  psychProfiles,
  complianceReport,
  filePath = "nexa-executive-report.pdf"
}) {
  const doc = new PDFDocument({ margin: 50 });

  doc.pipe(fs.createWriteStream(filePath));

  // =========================
  // HEADER
  // =========================
  doc.fontSize(20).text("NEXA OS — EXECUTIVE SAFETY REPORT", {
    align: "center"
  });

  doc.moveDown();
  doc.fontSize(12).text(`Generated: ${new Date().toISOString()}`);
  doc.moveDown();

  // =========================
  // EXECUTIVE SUMMARY
  // =========================
  doc.fontSize(16).text("1. Executive Summary");
  doc.fontSize(12).text(executiveReport.message || "System analysis complete.");
  doc.moveDown();

  doc.text(`Global Risk Score: ${executiveReport.summary?.globalRiskScore || 0}`);
  doc.text(`Risk Level: ${executiveReport.summary?.riskLevel || "UNKNOWN"}`);
  doc.moveDown();

  // =========================
  // OPERATIONAL RISK
  // =========================
  doc.fontSize(16).text("2. Operational Risk (Safety Engine)");

  predictions.slice(0, 5).forEach((p) => {
    doc.fontSize(12).text(
      `Flight: ${p.flight} | Risk: ${p.risk} | Score: ${p.score}`
    );
  });

  doc.moveDown();

  // =========================
  // HUMAN FATIGUE RISK
  // =========================
  doc.fontSize(16).text("3. Human Performance Risk");

  humanProfiles.slice(0, 5).forEach((h) => {
    doc.fontSize(12).text(
      `Flight: ${h.flight} | Fatigue Risk: ${h.errorProbability || 0}%`
    );
  });

  doc.moveDown();

  // =========================
  // PSYCHOLOGICAL RISK
  // =========================
  doc.fontSize(16).text("4. Psychological Safety (NEXA MIND)");

  psychProfiles.slice(0, 5).forEach((m) => {
    doc.fontSize(12).text(
      `Flight: ${m.flight} | Mental Readiness: ${m.mentalReadiness} | PSI: ${m.psychSafety}`
    );
  });

  doc.moveDown();

  // =========================
  // COMPLIANCE
  // =========================
  doc.fontSize(16).text("5. Compliance Status (ICAO / ISO 45003)");

  const violations = complianceReport.filter(
    (c) => c.status !== "COMPLIANT"
  );

  doc.text(`Total Violations: ${violations.length}`);

  violations.slice(0, 5).forEach((v) => {
    doc.text(
      `Flight: ${v.flight} | Status: ${v.status}`
    );
  });

  doc.moveDown();

  // =========================
  // RECOMMENDATIONS
  // =========================
  doc.fontSize(16).text("6. Executive Recommendations");

  (executiveReport.recommendations || []).forEach((r) => {
    doc.fontSize(12).text(`• ${r}`);
  });

  doc.moveDown();

  // =========================
  // FOOTER
  // =========================
  doc.fontSize(10).text(
    "NEXA OS — Confidential Executive Intelligence Report",
    { align: "center" }
  );

  doc.end();

  return filePath;
}

module.exports = {
  generateExecutivePDF
};
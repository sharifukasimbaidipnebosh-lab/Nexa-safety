// backend/services/directorEngine.js

/**
 * 🟣 NEXA DIRECTOR ENGINE
 * Executive intelligence & decision synthesis layer
 */

function generateExecutiveReport({
  predictions,
  humanProfiles,
  psychProfiles,
  complianceReport
}) {
  // =========================
  // 1. SYSTEM AGGREGATION
  // =========================
  const totalFlights = predictions.length;

  const avgOperationalRisk = Math.round(
    predictions.reduce((sum, p) => sum + p.score, 0) / totalFlights || 0
  );

  const avgHumanRisk = Math.round(
    humanProfiles.reduce((sum, h) => sum + h.errorProbability, 0) /
      totalFlights || 0
  );

  const avgPsychRisk = Math.round(
    psychProfiles.reduce((sum, m) => sum + (100 - m.mrs), 0) /
      totalFlights || 0
  );

  const nonCompliantFlights = complianceReport.filter(
    (c) => c.status !== "COMPLIANT"
  ).length;

  // =========================
  // 2. GLOBAL RISK SCORE
  // =========================
  const globalRiskScore = Math.round(
    avgOperationalRisk * 0.4 +
    avgHumanRisk * 0.3 +
    avgPsychRisk * 0.2 +
    (nonCompliantFlights / totalFlights) * 100 * 0.1
  );

  // =========================
  // 3. RISK CLASSIFICATION
  // =========================
  let riskLevel = "LOW";

  if (globalRiskScore > 75) riskLevel = "CRITICAL";
  else if (globalRiskScore > 55) riskLevel = "HIGH";
  else if (globalRiskScore > 35) riskLevel = "MEDIUM";

  // =========================
  // 4. EXECUTIVE ACTIONS
  // =========================
  const actions = [];

  if (riskLevel === "CRITICAL") {
    actions.push("GROUND_HIGH_RISK_FLIGHTS");
    actions.push("IMMEDIATE_CREW_REVIEW");
  }

  if (avgHumanRisk > 60) {
    actions.push("REDUCE_CREW_DUTY_HOURS");
  }

  if (avgPsychRisk > 50) {
    actions.push("LAUNCH_PSYCHOLOGICAL_INTERVENTION");
  }

  if (nonCompliantFlights > 0) {
    actions.push("COMPLIANCE_AUDIT_REQUIRED");
  }

  // =========================
  // 5. FINAL EXECUTIVE REPORT
  // =========================
  return {
    timestamp: new Date().toISOString(),

    summary: {
      totalFlights,
      globalRiskScore,
      riskLevel,
      nonCompliantFlights
    },

    insights: {
      avgOperationalRisk,
      avgHumanRisk,
      avgPsychRisk
    },

    recommendations: actions,

    message:
      riskLevel === "CRITICAL"
        ? "Immediate operational intervention required"
        : riskLevel === "HIGH"
        ? "Elevated system risk detected"
        : "System operating within acceptable parameters"
  };
}

module.exports = {
  generateExecutiveReport
};
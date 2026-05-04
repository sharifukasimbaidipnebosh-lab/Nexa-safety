// backend/services/complyEngine.js

/**
 * 🟢 NEXA COMPLY ENGINE
 * Converts AI risk outputs into regulatory compliance signals
 */

function evaluateCompliance({ safety, human, mind }) {
  // =========================
  // 1. ICAO SAFETY RULES
  // =========================
  const safetyViolation =
    safety.score > 70 ? "ICAO_RISK_EXCEEDED" : "COMPLIANT";

  // =========================
  // 2. HUMAN FATIGUE RULES
  // (Flight duty limitations logic simulation)
  // =========================
  const humanViolation =
    human.errorProbability > 60
      ? "CREW_FATIGUE_LIMIT_BREACH"
      : "COMPLIANT";

  // =========================
  // 3. PSYCHOLOGICAL SAFETY (ISO 45003)
  // =========================
  const mindViolation =
    mind.psi < 40
      ? "PSYCHOLOGICAL_SAFETY_RISK"
      : "COMPLIANT";

  // =========================
  // 4. OVERALL COMPLIANCE SCORE
  // =========================
  let score = 100;

  if (safetyViolation !== "COMPLIANT") score -= 35;
  if (humanViolation !== "COMPLIANT") score -= 35;
  if (mindViolation !== "COMPLIANT") score -= 30;

  // =========================
  // 5. FINAL STATUS
  // =========================
  let status = "COMPLIANT";

  if (score < 50) status = "CRITICAL_NON_COMPLIANT";
  else if (score < 75) status = "AT_RISK";

  return {
    score,
    status,
    violations: {
      safetyViolation,
      humanViolation,
      mindViolation
    }
  };
}

module.exports = {
  evaluateCompliance
};
// backend/services/copilotService.js

/**
 * 🤖 NEXA GPT COPILOT LAYER
 * Explains system intelligence in natural language
 */

function generateCopilotResponse({
  query,
  predictions,
  humanProfiles,
  psychProfiles,
  complianceReport,
  executiveReport
}) {
  const q = query.toLowerCase();

  // =========================
  // 1. HIGH RISK QUERY
  // =========================
  if (q.includes("why") && q.includes("risk")) {
    const highRiskFlights = predictions.filter(p => p.score > 70);

    return {
      type: "risk_explanation",
      answer: `There are ${highRiskFlights.length} high-risk flights due to elevated operational scores combined with crew fatigue signals and procedural deviation patterns.`,
      breakdown: highRiskFlights.slice(0, 3)
    };
  }

  // =========================
  // 2. HUMAN PERFORMANCE QUERY
  // =========================
  if (q.includes("crew") || q.includes("fatigue")) {
    const tiredCrew = humanProfiles.filter(h => h.errorProbability > 60);

    return {
      type: "human_analysis",
      answer: `${tiredCrew.length} crew members show elevated fatigue and performance degradation risk.`,
      breakdown: tiredCrew.slice(0, 3)
    };
  }

  // =========================
  // 3. PSYCHOLOGICAL RISK QUERY
  // =========================
  if (q.includes("mind") || q.includes("stress")) {
    const atRisk = psychProfiles.filter(p => p.psychSafety < 40);

    return {
      type: "psych_analysis",
      answer: `${atRisk.length} individuals show psychological safety risk indicators.`,
      breakdown: atRisk.slice(0, 3)
    };
  }

  // =========================
  // 4. COMPLIANCE QUERY
  // =========================
  if (q.includes("compliance")) {
    const violations = complianceReport.filter(c => c.status !== "COMPLIANT");

    return {
      type: "compliance_analysis",
      answer: `There are ${violations.length} compliance violations detected across ICAO and ISO 45003 frameworks.`,
      breakdown: violations
    };
  }

  // =========================
  // 5. EXECUTIVE QUERY
  // =========================
  if (q.includes("summary") || q.includes("report")) {
    return {
      type: "executive_summary",
      answer: executiveReport.message,
      breakdown: executiveReport.summary,
      actions: executiveReport.recommendations
    };
  }

  // =========================
  // DEFAULT RESPONSE
  // =========================
  return {
    type: "general",
    answer:
      "NEXA Copilot is active. Ask about risk, crew fatigue, compliance, or executive insights.",
  };
}

module.exports = {
  generateCopilotResponse
};
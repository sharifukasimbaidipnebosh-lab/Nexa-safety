function analyzeRootCause(flightData, risk) {
  const causes = [];

  // Fatigue-related
  if (flightData.rest_hours_before_flight < 6) {
    causes.push("Low rest hours (fatigue risk)");
  }

  // Incident history
  if (flightData.incident_type !== "NONE") {
    causes.push("Recent operational incident detected");
  }

  // Severity
  if (flightData.severity_level === "HIGH") {
    causes.push("High severity operational conditions");
  }

  // Crew feedback
  if (flightData.crew_feedback?.includes("Fatigue")) {
    causes.push("Crew-reported fatigue indicators");
  }

  // Default fallback
  if (causes.length === 0) {
    causes.push("No significant risk contributors identified");
  }

  return {
    riskScore: risk.score,
    riskLevel: risk.level,
    causes
  };
}

module.exports = { analyzeRootCause };
// NEXA SAFETY - Layer 6 Alert Intelligence Engine

function generateIntelligentAlerts(predictions, forecast) {
  const alerts = [];

  predictions.forEach((p) => {
    const future = forecast.find((f) => f.flight === p.flight);

    let severityScore = p.score;

    // 🔥 combine current + future risk
    if (future) {
      severityScore = (p.score + future.predictedScore) / 2;
    }

    // 🚨 classification
    let level = "LOW";

    if (severityScore >= 80) level = "CRITICAL";
    else if (severityScore >= 60) level = "HIGH";
    else if (severityScore >= 40) level = "MEDIUM";

    // ❌ filter noise
    if (level === "LOW") return;

    // 🧠 recommendation engine
    let recommendation = "Monitor situation";

    if (level === "CRITICAL") {
      recommendation =
        "Immediate intervention required: assign backup pilot + enforce rest period";
    } else if (level === "HIGH") {
      recommendation =
        "Schedule review: reduce duty hours and monitor fatigue levels";
    } else if (level === "MEDIUM") {
      recommendation =
        "Observe closely: check crew workload and rest compliance";
    }

    alerts.push({
      flight: p.flight,
      riskLevel: level,
      currentScore: p.score,
      predictedScore: future ? future.predictedScore : p.score,
      recommendation,
      timestamp: new Date().toISOString()
    });
  });

  return alerts;
}

module.exports = { generateIntelligentAlerts };
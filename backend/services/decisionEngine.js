function generateDecisions(predictions, forecast) {
  const decisions = [];

  predictions.forEach((p) => {
    let action = "MONITOR";
    let priority = "LOW";
    let recommendation = "No immediate action required";

    // 🔴 HIGH RISK
    if (p.risk === "HIGH") {
      action = "INTERVENE";
      priority = "CRITICAL";
      recommendation =
        "Reduce duty hours, assign backup crew, increase monitoring";
    }

    // 🟡 MEDIUM RISK
    else if (p.risk === "MEDIUM") {
      action = "MITIGATE";
      priority = "MEDIUM";
      recommendation =
        "Review crew fatigue, adjust schedule, monitor closely";
    }

    // 🔮 FUTURE RISK CHECK
    const future = forecast.find((f) => f.flight === p.flight);

    if (future && future.futureRisk === "HIGH") {
      action = "PREVENT";
      priority = "HIGH";
      recommendation =
        "High future risk predicted — take preventive action now";
    }

    decisions.push({
      flight: p.flight,
      airline: p.airline,
      currentRisk: p.risk,
      score: p.score,
      action,
      priority,
      recommendation,
      timestamp: new Date().toISOString()
    });
  });

  return decisions;
}

module.exports = { generateDecisions };
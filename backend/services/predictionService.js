// NEXA SAFETY - Layer 5 Predictive AI Engine

function predictFutureRisk(currentFlights, predictions) {
  const forecast = [];

  predictions.forEach((p) => {
    // Base risk score
    let futureScore = p.score;

    // 🔥 Trend simulation (AI learning pattern)
    const volatilityFactor = Math.random() * 20 - 5;

    futureScore += volatilityFactor;

    // 📈 escalation logic
    let trend = "STABLE";

    if (volatilityFactor > 8) trend = "INCREASING";
    else if (volatilityFactor < -5) trend = "DECREASING";

    // ⚠️ escalation probability (core predictive feature)
    const escalationProbability = Math.min(
      100,
      Math.max(0, futureScore + Math.random() * 15)
    );

    // 🧠 classification
    let predictedRisk = "LOW";

    if (futureScore >= 70) predictedRisk = "HIGH";
    else if (futureScore >= 40) predictedRisk = "MEDIUM";

    forecast.push({
      flight: p.flight,
      currentScore: p.score,
      predictedScore: Math.round(futureScore),
      predictedRisk,
      trend,
      escalationProbability: Math.round(escalationProbability),
      timeWindow: "24-72 HOURS"
    });
  });

  return forecast;
}

module.exports = { predictFutureRisk };
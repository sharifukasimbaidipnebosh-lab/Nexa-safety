// backend/services/predictionService.js

const predictFutureRisk = (flights = [], predictions = []) => {
  const avgRisk =
    predictions.length > 0
      ? predictions.reduce((a, b) => a + b.score, 0) / predictions.length
      : 30;

  return {
    forecastRisk: Math.round(avgRisk + Math.random() * 10),
    trend: avgRisk > 50 ? "INCREASING" : "STABLE",
    confidence: 0.82,
  };
};

module.exports = { predictFutureRisk };
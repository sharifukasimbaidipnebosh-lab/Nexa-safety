// backend/services/alertEngine.js

const generateIntelligentAlerts = (predictions = [], forecast = {}) => {
  const alerts = [];

  predictions.forEach((p) => {
    if (p.score > 70) {
      alerts.push({
        type: "HIGH_RISK",
        flight: p.flight,
        message: "Immediate attention required",
      });
    }
  });

  if (forecast.forecastRisk > 60) {
    alerts.push({
      type: "SYSTEM_WARNING",
      message: "Overall risk trend increasing",
    });
  }

  return alerts;
};

module.exports = { generateIntelligentAlerts };
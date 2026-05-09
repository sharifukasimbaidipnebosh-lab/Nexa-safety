// backend/services/decisionEngine.js

const generateDecisions = (predictions = [], forecast = {}) => {
  return predictions.map((p) => {
    return {
      flight: p.flight,
      action:
        p.score > 70
          ? "GROUND_FLIGHT"
          : p.score > 40
          ? "MONITOR"
          : "CLEAR",
    };
  });
};

module.exports = { generateDecisions };
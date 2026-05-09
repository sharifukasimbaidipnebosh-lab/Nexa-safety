// backend/services/riskEngine.js

const calculateRisk = (data) => {
  const fatigue = Number(data.fatigue_score || 0);
  const incidents = Number(data.incidents || 0);
  const maintenance = Number(data.maintenance_issues || 0);

  const score = fatigue * 0.4 + incidents * 0.4 + maintenance * 0.2;

  let level = "LOW";
  if (score > 70) level = "HIGH";
  else if (score > 40) level = "MEDIUM";

  return {
    fatigue,
    incident: incidents,
    maintenance,
    score: Math.round(score),
    level,
  };
};

module.exports = { calculateRisk };
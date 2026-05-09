// backend/services/rootCauseEngine.js

const analyzeRootCause = (data, risk) => {
  const causes = [];

  if (data.fatigue_score > 50) causes.push("Fatigue");
  if (data.incidents > 0) causes.push("Operational Incident");
  if (data.maintenance_issues > 0) causes.push("Maintenance Issue");

  return {
    riskLevel: risk.level,
    causes: causes.length ? causes : ["Normal Operations"],
  };
};

module.exports = { analyzeRootCause };
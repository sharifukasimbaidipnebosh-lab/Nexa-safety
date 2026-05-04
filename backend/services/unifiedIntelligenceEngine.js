function calculateUnifiedRisk({
  operationalScore = 0,
  psychologicalScore = 0
}) {
  // Weighting model (can be tuned later with ML)
  const operationalWeight = 0.65;
  const psychologicalWeight = 0.35;

  const missionRisk =
    (operationalScore * operationalWeight) +
    (psychologicalScore * psychologicalWeight);

  let level = "LOW";

  if (missionRisk > 75) level = "CRITICAL";
  else if (missionRisk > 55) level = "HIGH";
  else if (missionRisk > 35) level = "MEDIUM";

  return {
    missionRisk: Math.round(missionRisk),
    level,
    breakdown: {
      operationalScore,
      psychologicalScore,
      operationalWeight,
      psychologicalWeight
    }
  };
}

module.exports = { calculateUnifiedRisk };
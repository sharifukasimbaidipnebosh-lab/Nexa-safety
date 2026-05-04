function combineRisk(safety, mind) {
  const combinedScore = Math.round(
    (safety.score * 0.6) + (mind.score * 0.4)
  );

  const level =
    combinedScore > 70 ? "CRITICAL" :
    combinedScore > 40 ? "ELEVATED" :
    "STABLE";

  return {
    combinedScore,
    level
  };
}

module.exports = { combineRisk };
function calculateOperationalRisk(data) {
  let score = 0;

  score += data.fatigue * 3;
  score += data.incidents * 5;
  score += data.maintenance * 4;

  let level =
    score > 70 ? "HIGH" :
    score > 40 ? "MEDIUM" :
    "LOW";

  return { score, level };
}

module.exports = { calculateOperationalRisk };
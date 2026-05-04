// backend/services/humanEngine.js

/**
 * 🟡 NEXA HUMAN ENGINE
 * Purpose: Predict human performance degradation & error risk
 */

function calculateHumanRisk(data) {
  const fatigue = Number(data.fatigue_level || 0);
  const dutyHours = Number(data.duty_hours || 8);
  const restHours = Number(data.rest_hours || 0);
  const workload = Number(data.workload_index || 0);
  const stress = Number(data.stress_level || 0);

  // ==============================
  // 1. Fatigue Pressure Model
  // ==============================
  const fatiguePressure =
    (dutyHours * 8 + workload * 0.6 + stress * 0.4) - restHours * 5;

  // ==============================
  // 2. Cognitive Load Index
  // ==============================
  const cognitiveLoad = (stress + workload + fatigue) / 3;

  // ==============================
  // 3. Reaction Time Degradation
  // ==============================
  const reactionPenalty = Math.min(40, fatigue * 0.4 + stress * 0.3);

  // ==============================
  // 4. Error Probability Model
  // ==============================
  let errorProbability =
    (fatiguePressure * 0.3) +
    (cognitiveLoad * 0.4) +
    (reactionPenalty * 0.3);

  errorProbability = Math.max(0, Math.min(100, errorProbability));

  // ==============================
  // 5. Human Performance Index
  // ==============================
  const performanceIndex = Math.max(
    0,
    100 - errorProbability
  );

  // ==============================
  // 6. Risk Classification
  // ==============================
  let level = "LOW";

  if (errorProbability > 70) level = "CRITICAL";
  else if (errorProbability > 50) level = "HIGH";
  else if (errorProbability > 30) level = "MEDIUM";

  return {
    fatigue,
    stress,
    workload,
    dutyHours,
    restHours,

    fatiguePressure: Math.round(fatiguePressure),
    cognitiveLoad: Math.round(cognitiveLoad),
    reactionPenalty: Math.round(reactionPenalty),

    errorProbability: Math.round(errorProbability),
    performanceIndex: Math.round(performanceIndex),

    level
  };
}

module.exports = {
  calculateHumanRisk
};
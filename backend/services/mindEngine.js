/**
 * 🔴 NEXA MIND — AI ENGINE (Layer 5)
 * Advanced Psychological Scoring
 * Based on ISO 45003 concepts
 */

function analyzePsychData(data) {
  // =========================
  // 1. NORMALIZE INPUTS
  // =========================
  const fatigue = Number(data.fatigue_level || 0);
  const stress = Number(data.stress_level || 0);
  const workload = Number(data.workload_index || 0);
  const mood = Number(data.mood_score || 0);
  const safety = Number(data.psychological_safety_index || 0);

  // =========================
  // 2. DERIVED METRICS
  // =========================

  // 🔴 Psychological Safety Index (inverse risk)
  const psiRaw = 100 - ((stress * 0.6) + (workload * 0.4));
  const psi = Math.max(0, Math.min(100, Math.round(psiRaw)));

  // 🧠 Mental Readiness Score
  const mrsRaw =
    (100 - fatigue * 1.5) * 0.3 +
    (100 - stress * 1.2) * 0.25 +
    (100 - workload) * 0.2 +
    (mood * 10) * 0.15 +
    (safety * 10) * 0.1;

  const mrs = Math.max(0, Math.min(100, Math.round(mrsRaw)));

  // =========================
  // 3. RISK CLASSIFICATION
  // =========================
  let riskLevel = "LOW";

  if (mrs < 40) riskLevel = "HIGH";
  else if (mrs < 70) riskLevel = "MEDIUM";

  // =========================
  // 4. FLAGS (VERY USEFUL FOR UI)
  // =========================
  const flags = [];

  if (fatigue > 7) flags.push("HIGH FATIGUE");
  if (stress > 7) flags.push("HIGH STRESS");
  if (workload > 7) flags.push("OVERLOAD");
  if (mood < 4) flags.push("LOW MORALE");
  if (psi < 50) flags.push("LOW PSYCHOLOGICAL SAFETY");

  // =========================
  // 5. FINAL OUTPUT
  // =========================
  return {
    fatigue,
    stress,
    workload,
    mood,

    psychological_safety_index: psi,
    mental_readiness_score: mrs,
    psychological_risk_level: riskLevel,

    flags, // 🔥 for dashboard + alerts
  };
}

module.exports = { analyzePsychData };
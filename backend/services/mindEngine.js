// backend/services/mindEngine.js

const analyzePsychData = (data) => {
  const fatigue = Number(data.fatigue_level || 50);
  const stress = Number(data.stress_level || 50);
  const workload = Number(data.workload_index || 50);
  const mood = Number(data.mood_score || 50);

  const psi = Math.round(100 - (stress + fatigue) / 2);
  const mrs = Math.round((mood + (100 - workload)) / 2);

  return {
    fatigue,
    stress,
    workload,
    mood,
    psi,
    mrs,
  };
};

module.exports = { analyzePsychData };
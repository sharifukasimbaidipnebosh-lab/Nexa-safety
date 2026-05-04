function normalizeOperational(data) {
  return {
    fatigue: Number(data.fatigue_score),
    incidents: Number(data.incidents),
    maintenance: Number(data.maintenance_issues)
  };
}

function normalizePsychological(data) {
  return {
    stress: Number(data.stress_level),
    burnout: Number(data.burnout_score),
    safety: Number(data.psychological_safety)
  };
}

module.exports = {
  normalizeOperational,
  normalizePsychological
};
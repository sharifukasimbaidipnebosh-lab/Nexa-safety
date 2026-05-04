const psychologicalData = [];

function savePsychologicalData(entry) {
  psychologicalData.push({
    id: psychologicalData.length + 1,
    crew_id: entry.crew_id,
    stress_level: entry.stress_level,
    burnout_score: entry.burnout_score,
    psychological_safety: entry.psychological_safety,
    timestamp: new Date().toISOString()
  });
}

function getAllPsychologicalData() {
  return psychologicalData;
}

module.exports = {
  savePsychologicalData,
  getAllPsychologicalData
};
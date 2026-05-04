// NEXA SAFETY - Layer 4 Risk Engine
// Real Aviation Risk Scoring Logic

function calculateRisk(flight) {
  let score = 0;

  /* ----------------------------------
     1. FATIGUE FACTOR
  ---------------------------------- */
  if (flight.rest_hours_before_flight < 8) score += 35;
  else if (flight.rest_hours_before_flight < 12) score += 20;
  else score += 5;

  /* ----------------------------------
     2. DUTY TIME FACTOR
  ---------------------------------- */
  const dutyHours =
    (flight.duty_end_time - flight.duty_start_time) || 0;

  if (dutyHours > 12) score += 30;
  else if (dutyHours > 10) score += 20;
  else score += 10;

  /* ----------------------------------
     3. INCIDENT HISTORY
  ---------------------------------- */
  if (flight.incident_type && flight.incident_type !== "NONE") {
    score += flight.severity_level === "HIGH" ? 30 : 15;
  }

  /* ----------------------------------
     4. CREW FEEDBACK SENTIMENT (simple AI logic)
  ---------------------------------- */
  const feedback = (flight.crew_feedback || "").toLowerCase();

  if (feedback.includes("tired") || feedback.includes("fatigue")) {
    score += 20;
  }

  if (feedback.includes("stress") || feedback.includes("overworked")) {
    score += 15;
  }

  /* ----------------------------------
     FINAL SCORE NORMALIZATION
  ---------------------------------- */
  if (score > 100) score = 100;
  if (score < 0) score = 0;

  /* ----------------------------------
     RISK LEVEL CLASSIFICATION
  ---------------------------------- */
  let level = "GREEN";

  if (score >= 75) level = "RED";
  else if (score >= 40) level = "YELLOW";

  return {
    score,
    level
  };
}

module.exports = { calculateRisk };
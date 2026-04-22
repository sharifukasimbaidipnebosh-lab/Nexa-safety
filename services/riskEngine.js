exports.calculateRisk = (rows) => {
  return rows.map((r) => {
    const fatigue = r.fatigue_flag ? 3 : 1;
    const duty = r.duty_hours > 12 ? 3 : r.duty_hours > 10 ? 2 : 1;
    const severity = r.severity_score;

    const score =
      (fatigue / 3) * 40 +
      (duty / 3) * 30 +
      (severity / 3) * 30;

    let level = "Green";
    if (score >= 70) level = "Red";
    else if (score >= 40) level = "Yellow";

    return { ...r, risk_score: Math.round(score), risk_level: level };
  });
};
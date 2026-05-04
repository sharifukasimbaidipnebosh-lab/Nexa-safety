function analyzeTrends(history) {
  if (history.length < 2) return [];

  const trends = [];

  const latest = history[history.length - 1].predictions;
  const previous = history[history.length - 2].predictions;

  latest.forEach((current) => {
    const prev = previous.find(p => p.flight === current.flight);

    if (!prev) return;

    let trend = "STABLE";

    if (current.score > prev.score + 5) trend = "INCREASING";
    else if (current.score < prev.score - 5) trend = "DECREASING";

    trends.push({
      flight: current.flight,
      currentScore: current.score,
      previousScore: prev.score,
      trend
    });
  });

  return trends;
}

function getSystemTrend(history) {
  if (history.length < 2) return "STABLE";

  const latestAvg = average(history[history.length - 1].predictions);
  const prevAvg = average(history[history.length - 2].predictions);

  if (latestAvg > prevAvg + 5) return "RISK INCREASING";
  if (latestAvg < prevAvg - 5) return "RISK DECREASING";

  return "STABLE";
}

function average(predictions) {
  return (
    predictions.reduce((sum, p) => sum + p.score, 0) /
    predictions.length
  );
}

module.exports = { analyzeTrends, getSystemTrend };
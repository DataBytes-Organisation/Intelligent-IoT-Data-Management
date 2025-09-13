// Simple linear regression to get trendline points

export function getTrendline(data) {
  const n = data.length;
  if (n === 0) return 0;
  const sumX = data.reduce((acc, d) => acc + d.x, 0);
  const sumY = data.reduce((acc, d) => acc + d.y, 0);
  const sumXY = data.reduce((acc, d) => acc + d.x * d.y, 0);
  const sumX2 = data.reduce((acc, d) => acc + d.x * d.x, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  // Generate two points for the line
  const xMin = Math.min(...data.map(d => d.x));
  const xMax = Math.max(...data.map(d => d.x));
  return [
    { x: xMin, y: slope * xMin + intercept },
    { x: xMax, y: slope * xMax + intercept }
  ];
};

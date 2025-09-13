// utils/correlationUtils.js
export const calculateCorrelation = (x, y) => {
  const n = x.length;
  const avgX = x.reduce((a, b) => a + b, 0) / n;
  const avgY = y.reduce((a, b) => a + b, 0) / n;

  const numerator = x.reduce((sum, xi, i) => sum + (xi - avgX) * (y[i] - avgY), 0);
  const denominator = Math.sqrt(
    x.reduce((sum, xi) => sum + (xi - avgX) ** 2, 0) *
    y.reduce((sum, yi) => sum + (yi - avgY) ** 2, 0)
  );

  return numerator / denominator;
};

export const findMostCorrelatedPair = (data, streams) => {
  let maxCorr = -Infinity;
  let bestPair = [];

  for (let i = 0; i < streams.length; i++) {
    for (let j = i + 1; j < streams.length; j++) {
      const x = data.map(d => parseFloat(d[streams[i]]));
      const y = data.map(d => parseFloat(d[streams[j]]));
      const corr = calculateCorrelation(x, y);
      if (corr > maxCorr) {
        maxCorr = corr;
        bestPair = [streams[i], streams[j]];
      }
    }
  }

  return { pair: bestPair, correlation: maxCorr};
};

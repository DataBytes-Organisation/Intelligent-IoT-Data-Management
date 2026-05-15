//handles the logic for processing mock data, using the repository for data access

const MockRepository = require('../repositories/mockRepository');
const mockRepository = new MockRepository();

//get all entries from the .json file
const readProcessedData = () => {
  return mockRepository.getMockData();
};

const getAvailableStreamNames = () => {
  const entries = mockRepository.getMockData();
  if (!entries || entries.length === 0) return [];

  const excludedKeys = ["created_at", "entry_id", "was_interpolated"];
  return Object.keys(entries[0]).filter(key => !excludedKeys.includes(key));
};

const filterEntriesByStreamNames = (streamNames) => {
  const entries = mockRepository.getMockData();

  return entries.map(entry => {
    const filteredEntry = {
      created_at: entry.created_at,
      entry_id: entry.entry_id
    };

    streamNames.forEach(name => {
      if (entry[name] !== undefined) {
        filteredEntry[name] = entry[name];
      }
    });

    return filteredEntry;
  });
};

const toNumber = (value) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
};

const getDataProfile = () => {
  const entries = mockRepository.getMockData();
  const streams = getAvailableStreamNames();

  if (!entries || entries.length === 0) {
    return {
      rowCount: 0,
      streamCount: 0,
      streams: [],
      timeRange: { start: null, end: null }
    };
  }

  const profileStreams = streams.map((stream) => {
    const rawValues = entries.map((entry) => entry[stream]);
    const numericValues = rawValues.map(toNumber).filter((v) => v !== null);
    const missingCount = rawValues.length - numericValues.length;

    const min = numericValues.length ? Math.min(...numericValues) : null;
    const max = numericValues.length ? Math.max(...numericValues) : null;
    const mean = numericValues.length
      ? numericValues.reduce((sum, value) => sum + value, 0) / numericValues.length
      : null;

    return {
      name: stream,
      nonNullCount: numericValues.length,
      missingCount,
      missingPercent: Number(((missingCount / rawValues.length) * 100).toFixed(2)),
      min,
      max,
      mean: mean === null ? null : Number(mean.toFixed(4))
    };
  });

  return {
    rowCount: entries.length,
    streamCount: streams.length,
    streams: profileStreams,
    timeRange: {
      start: entries[0].created_at || null,
      end: entries[entries.length - 1].created_at || null
    }
  };
};

const calculatePearsonCorrelation = (xValues, yValues) => {
  const pairs = [];

  for (let i = 0; i < xValues.length; i += 1) {
    const x = toNumber(xValues[i]);
    const y = toNumber(yValues[i]);
    if (x !== null && y !== null) {
      pairs.push([x, y]);
    }
  }

  if (pairs.length < 2) {
    return { correlation: null, sampleSize: pairs.length };
  }

  const xs = pairs.map(([x]) => x);
  const ys = pairs.map(([, y]) => y);
  const n = pairs.length;

  const meanX = xs.reduce((sum, value) => sum + value, 0) / n;
  const meanY = ys.reduce((sum, value) => sum + value, 0) / n;

  let numerator = 0;
  let sumSqX = 0;
  let sumSqY = 0;

  for (let i = 0; i < n; i += 1) {
    const dx = xs[i] - meanX;
    const dy = ys[i] - meanY;
    numerator += dx * dy;
    sumSqX += dx * dx;
    sumSqY += dy * dy;
  }

  const denominator = Math.sqrt(sumSqX * sumSqY);
  if (denominator === 0) {
    return { correlation: null, sampleSize: n };
  }

  return { correlation: numerator / denominator, sampleSize: n };
};

const getStrengthLabel = (correlation) => {
  if (correlation === null) return 'insufficient-data';
  const strength = Math.abs(correlation);
  if (strength >= 0.8) return 'strong';
  if (strength >= 0.5) return 'moderate';
  return 'weak';
};

const getTopCorrelatedPair = (streamNames) => {
  const entries = mockRepository.getMockData();
  const validStreams = getAvailableStreamNames();
  const selected = streamNames.filter((name) => validStreams.includes(name));

  if (selected.length < 2) {
    throw new Error('At least two valid stream names are required');
  }

  let best = {
    pair: [],
    correlation: null,
    sampleSize: 0
  };

  for (let i = 0; i < selected.length; i += 1) {
    for (let j = i + 1; j < selected.length; j += 1) {
      const xName = selected[i];
      const yName = selected[j];
      const xValues = entries.map((entry) => entry[xName]);
      const yValues = entries.map((entry) => entry[yName]);
      const { correlation, sampleSize } = calculatePearsonCorrelation(xValues, yValues);

      if (correlation === null) {
        continue;
      }

      if (
        best.correlation === null ||
        Math.abs(correlation) > Math.abs(best.correlation)
      ) {
        best = {
          pair: [xName, yName],
          correlation,
          sampleSize
        };
      }
    }
  }

  return {
    pair: best.pair,
    correlation: best.correlation === null ? null : Number(best.correlation.toFixed(4)),
    sampleSize: best.sampleSize,
    label: getStrengthLabel(best.correlation)
  };
};

module.exports = {
  readProcessedData,
  getAvailableStreamNames,
  filterEntriesByStreamNames,
  getDataProfile,
  getTopCorrelatedPair
};

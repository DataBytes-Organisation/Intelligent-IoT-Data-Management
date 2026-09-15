const THINGSPEAK_FIELD_MAP = {
  field1: 'eco2',
  field2: 'etvoc',
  field3: 'temperature',
  field4: 'air_pressure',
  field5: 'humidity',
  field6: 'temperature_secondary',
  field7: 'controller_temperature',
  field8: 'conductance',
};

const getCanonicalMetric = (datasetId, stream) => {
  if (datasetId === 'thingspeak-live') {
    const canonicalMetric = THINGSPEAK_FIELD_MAP[stream];

    if (!canonicalMetric) {
      throw new Error(`No canonical metric mapping found for ${stream}.`);
    }

    return canonicalMetric;
  }

  return stream;
};

export const runAnalysis = async ({
  datasetId,
  selectedStreams,
}) => {
  if (!datasetId) {
    throw new Error('A dataset must be selected before running analysis.');
  }

  if (!Array.isArray(selectedStreams) || selectedStreams.length < 2) {
    throw new Error('Select at least two streams before running analysis.');
  }

  const canonicalStreams = selectedStreams.map((stream) =>
    getCanonicalMetric(datasetId, stream)
  );

  const payload = {
    dataset: datasetId,
    model: {
      metric: canonicalStreams[0],
      detector: 'isolationforest',
      parameters: {},
    },
    correlation: {
      streams: canonicalStreams.slice(0, 2),
      window_size: 20,
      step_size: 10,
      method: 'pearson',
    },
  };

  const response = await fetch('/api/analyse', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  let result;

  try {
    result = await response.json();
  } catch {
    throw new Error(
      `Analysis request failed with HTTP ${response.status}.`
    );
  }

  if (!response.ok) {
    throw new Error(
      result?.error ||
      result?.message ||
      `Analysis request failed with HTTP ${response.status}.`
    );
  }

  return result;
};
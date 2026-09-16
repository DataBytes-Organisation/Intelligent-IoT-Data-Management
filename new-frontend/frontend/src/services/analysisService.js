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

  const payload = {
    dataset: datasetId,
    model: {
      metric: selectedStreams[0],
      detector: 'isolationforest',
      parameters: {},
    },
    correlation: {
      streams: selectedStreams,
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
import { buildApiUrl } from './apiClient.js';

const assertSuccess = async (response) => {
  if (response.ok) {
    return response;
  }

  const fallbackText = `Request failed with status ${response.status}`;

  try {
    const errorText = await response.text();
    throw new Error(errorText || fallbackText);
  } catch {
    throw new Error(fallbackText);
  }
};

export const fetchStreams = async ({ signal } = {}) => {
  const response = await fetch(buildApiUrl('/api/streams'), { signal });
  const safeResponse = await assertSuccess(response);
  return safeResponse.json();
};

export const fetchStreamNames = async ({ signal } = {}) => {
  const response = await fetch(buildApiUrl('/api/stream-names'), { signal });
  const safeResponse = await assertSuccess(response);
  return safeResponse.json();
};

export const fetchFilteredStreams = async (payload, { signal } = {}) => {
  const response = await fetch(buildApiUrl('/api/filter-streams'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
    signal,
  });

  const safeResponse = await assertSuccess(response);
  return safeResponse.json();
};
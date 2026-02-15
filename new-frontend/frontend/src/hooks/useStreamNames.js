
import { useMemo, useState, useEffect } from 'react';
import apiService from '../services/api';

export const useStreamNames = (data, useApi = false) => {
  const [apiStreamNames, setApiStreamNames] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!useApi) return;

    const fetchStreamNames = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await apiService.getStreamNames();
        setApiStreamNames(response.map(name => ({ id: name, name })));
        setLoading(false);
      } catch (err) {
        console.error('Error fetching stream names:', err);
        setError(err.message || 'Failed to fetch stream names');
        setLoading(false);
      }
    };

    fetchStreamNames();
  }, [useApi]);

  const localStreamNames = useMemo(() => {
    if (!data || data.length === 0) return [];

    const keys = Object.keys(data[0]);
    const streamKeys = keys.filter(k => k !== 'entry_id' && k !== 'created_at');

    return streamKeys.map(key => ({ id: key, name: key }));
  }, [data]);

  if (useApi) {
    return { streamNames: apiStreamNames, loading, error };
  }

  return localStreamNames;
};

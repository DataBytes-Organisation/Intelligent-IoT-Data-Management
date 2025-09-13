import { useMemo, useState, useEffect } from 'react';
import apiService from '../services/api';

export const useFilteredData = (data, { startTime, endTime, minEntryId, maxEntryId, selectedStreams, selectedinterval }, useApi = false) => {
  const [apiFilteredData, setApiFilteredData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!useApi || !selectedStreams || selectedStreams.length === 0) return;

    const fetchFilteredData = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await apiService.filterStreams(selectedStreams);
        setApiFilteredData(response);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching filtered data:', err);
        setError(err.message || 'Failed to fetch filtered data');
        setLoading(false);
      }
    };

    fetchFilteredData();
  }, [useApi, selectedStreams]);

  const localFilteredData = useMemo(() => {
    if (!data || data.length === 0) return [];

    return data.filter(entry => {
      const entryTime = new Date(entry.created_at).getTime();
      const entryId = entry.entry_id;

      const timeMatch =
        (!startTime || entryTime >= new Date(startTime).getTime()) &&
        (!endTime || entryTime <= new Date(endTime).getTime());

      const idMatch =
        (!minEntryId || entryId >= minEntryId) &&
        (!maxEntryId || entryId <= maxEntryId);

      return timeMatch && idMatch;
    }).map(entry => {
      const filteredEntry = {
        entry_id: entry.entry_id,
        created_at: entry.created_at,
      };

      selectedStreams.forEach(stream => {
        if (entry.hasOwnProperty(stream)) {
          filteredEntry[stream] = parseFloat(entry[stream]);
        }
      });

      return filteredEntry;
    });
  }, [data, startTime, endTime, 
    minEntryId, maxEntryId, selectedStreams, selectedinterval]);

  if (useApi) {
    return { filteredData: apiFilteredData, loading, error };
  }

  return localFilteredData;
};

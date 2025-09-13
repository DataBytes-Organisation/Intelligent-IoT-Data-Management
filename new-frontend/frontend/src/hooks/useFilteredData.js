import { useMemo } from 'react';

export const useFilteredData = (data, { startTime, endTime, minEntryId, maxEntryId, selectedStreams, selectedinterval }) => {
  return useMemo(() => {
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
};

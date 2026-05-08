import { useMemo } from 'react';

export const useFilteredData = (data, { startTime, endTime, minEntryId, maxEntryId, selectedStreams, interval }) => {
  return useMemo(() => {
    if (!data || data.length === 0) return [];

    const intervalToMs = {
      '5min': 5 * 60 * 1000,
      '15min': 15 * 60 * 1000,
      '1h': 60 * 60 * 1000,
      '6h': 6 * 60 * 60 * 1000,
    };

    const selectedIntervalMs = intervalToMs[interval] ?? null;

    const filteredRows = data.filter((entry) => {
      const entryTime = new Date(entry.created_at).getTime();
      const entryId = entry.entry_id;

      const timeMatch =
        (!startTime || entryTime >= new Date(startTime).getTime()) &&
        (!endTime || entryTime <= new Date(endTime).getTime());

      const idMatch =
        (!minEntryId || entryId >= minEntryId) &&
        (!maxEntryId || entryId <= maxEntryId);

      return timeMatch && idMatch;
    });

    const sampledRows = (() => {
      if (!selectedIntervalMs || filteredRows.length === 0) {
        return filteredRows;
      }

      const rows = [];
      let lastKeptTimestamp = new Date(filteredRows[0].created_at).getTime();

      filteredRows.forEach((entry, index) => {
        const currentTimestamp = new Date(entry.created_at).getTime();

        if (index === 0 || currentTimestamp - lastKeptTimestamp >= selectedIntervalMs) {
          rows.push(entry);
          lastKeptTimestamp = currentTimestamp;
        }
      });

      return rows;
    })();

    return sampledRows.map((entry) => {
      const filteredEntry = {
        entry_id: entry.entry_id,
        created_at: entry.created_at,
      };

      selectedStreams.forEach((stream) => {
        if (entry.hasOwnProperty(stream)) {
          filteredEntry[stream] = parseFloat(entry[stream]);
        }
      });

      return filteredEntry;
    });
  }, [data, startTime, endTime, 
    minEntryId, maxEntryId, selectedStreams, interval]);
};

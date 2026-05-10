import { useMemo } from 'react';

export const useFilteredData = (data, { startTime, endTime, minEntryId, maxEntryId, selectedStreams, interval }) => {
  return useMemo(() => {
    if (!data || data.length === 0) return [];

    const safeSelectedStreams = Array.isArray(selectedStreams) ? selectedStreams : [];

    const intervalToMs = {
      '5min': 5 * 60 * 1000,
      '15min': 15 * 60 * 1000,
      '1h': 60 * 60 * 1000,
      '6h': 6 * 60 * 60 * 1000,
    };

    const selectedIntervalMs = intervalToMs[interval] ?? null;
    const parsedStartTime = startTime ? new Date(startTime).getTime() : null;
    const parsedEndTime = endTime ? new Date(endTime).getTime() : null;

    // If the user selected an invalid range, return no rows.
    if (
      Number.isFinite(parsedStartTime) &&
      Number.isFinite(parsedEndTime) &&
      parsedStartTime > parsedEndTime
    ) {
      return [];
    }

    const filteredRows = data.filter((entry) => {
      const entryTime = new Date(entry.created_at).getTime();
      const entryId = entry.entry_id;

      // Ignore rows with invalid timestamps to avoid unstable filtering.
      if (!Number.isFinite(entryTime)) {
        return false;
      }

      const timeMatch =
        (!Number.isFinite(parsedStartTime) || entryTime >= parsedStartTime) &&
        (!Number.isFinite(parsedEndTime) || entryTime <= parsedEndTime);

      const idMatch =
        (!minEntryId || entryId >= minEntryId) &&
        (!maxEntryId || entryId <= maxEntryId);

      return timeMatch && idMatch;
    });

    // Ensure deterministic interval sampling even if backend rows are unordered.
    const orderedRows = [...filteredRows].sort((a, b) => {
      const aTime = new Date(a.created_at).getTime();
      const bTime = new Date(b.created_at).getTime();
      return aTime - bTime;
    });

    const sampledRows = (() => {
      if (!selectedIntervalMs || orderedRows.length === 0) {
        return orderedRows;
      }

      const rows = [];
      let lastKeptTimestamp = new Date(orderedRows[0].created_at).getTime();

      orderedRows.forEach((entry, index) => {
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

      safeSelectedStreams.forEach((stream) => {
        if (entry.hasOwnProperty(stream)) {
          filteredEntry[stream] = parseFloat(entry[stream]);
        }
      });

      return filteredEntry;
    });
  }, [data, startTime, endTime, 
    minEntryId, maxEntryId, selectedStreams, interval]);
};

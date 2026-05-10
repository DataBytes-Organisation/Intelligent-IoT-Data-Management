//import { useMemo } from 'react';
// to extract time range

// export const useTimeRange = (data) => {
//   return useMemo(() => {
//     if (!data.length) return [null, null];
//     const timestamps = data.map((d) => new Date(d.timestamp));
//     const min = new Date(Math.min(...timestamps));
//     const max = new Date(Math.max(...timestamps));
//     return [min, max];
//   }, [data]);
// };

import { useMemo } from 'react';

export const useTimeRange = (data) => {
  return useMemo(() => {
    if (!data || data.length === 0) {
      return {
        timeOptions: [],
        minTime: null,
        maxTime: null,
      };
    }

    const timeOptions = Array.from(
      new Set(data.map((entry) => entry.created_at).filter(Boolean))
    ).sort();

    return {
      timeOptions,
      minTime: timeOptions[0] ?? null,
      maxTime: timeOptions[timeOptions.length - 1] ?? null,
    };
  }, [data]);
};

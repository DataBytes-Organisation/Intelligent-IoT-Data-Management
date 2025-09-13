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

// hooks/useTimeRange.js
import { useMemo } from 'react';

export const useTimeRange = (data) => {
  return useMemo(() => {
    if (!data || data.length === 0) return [];
    return data.map(entry => entry.created_at); // or format as needed
  }, [data]);
};

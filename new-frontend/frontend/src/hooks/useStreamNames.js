

import { useMemo } from 'react';

export const useStreamNames = (data) => {
  return useMemo(() => {
    if (!data || data.length === 0) return [];

    const keys = Object.keys(data[0]);
    const streamKeys = keys.filter(k => k !== 'entry_id' && k !== 'created_at');

    return streamKeys.map(key => ({ id: key, name: key }));
  }, [data]);
};

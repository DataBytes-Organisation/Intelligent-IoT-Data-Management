//handles the logic for processing mock data, using the repository for data access

const MockRepository = require('../repositories/mockRepository');
const mockRepository = new MockRepository();

/*
  NOTE FROM UPSTREAM:
  - Upstream implemented a polling + caching system for JSON-based mock data.
  - This was intended for future automatic ThingSpeak ingestion.
  - Since this backend now uses PostgreSQL and async DB queries,
    the polling/caching logic is not used here.
  - The concept may be revisited later for real-time DB updates.
*/

// return all data (DB-backed)
const readProcessedData = async () => {
  return await mockRepository.getMockData();
};

// return available stream/field names
const getAvailableStreamNames = async () => {
  const entries = await mockRepository.getMockData();
  if (!entries || entries.length === 0) return [];

  const excludedKeys = ['created_at', 'entry_id', 'was_interpolated'];
  return Object.keys(entries[0]).filter(key => !excludedKeys.includes(key));
};

// filter entries by selected stream names
const filterEntriesByStreamNames = async (streamNames) => {
  const entries = await mockRepository.getMockData();

  return entries.map(entry => {
    const filteredEntry = {
      created_at: entry.created_at,
      entry_id: entry.entry_id
    };

    streamNames.forEach(name => {
      if (entry[name] !== undefined) {
        filteredEntry[name] = entry[name];
      }
    });

    return filteredEntry;
  });
};

module.exports = {
  readProcessedData,
  getAvailableStreamNames,
  filterEntriesByStreamNames
};
//handles the logic for processing mock data, using the repository for data access

const MockRepository = require('../repositories/mockRepository');
const mockRepository = new MockRepository();

//get all entries from the .json file
const readProcessedData = () => {
  return mockRepository.getMockData();
};

const getAvailableStreamNames = () => {
  const entries = mockRepository.getMockData();
  if (!entries || entries.length === 0) return [];

  const excludedKeys = ["created_at", "entry_id", "was_interpolated"];
  return Object.keys(entries[0]).filter(key => !excludedKeys.includes(key));
};

const filterEntriesByStreamNames = (streamNames) => {
  const entries = mockRepository.getMockData();

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
// handles the logic for processing mock data, using the repository for data access

const MockRepository = require("../repositories/mockRepository");
const mockRepository = new MockRepository();

let cachedData = [];

// Polling for 5 sec intervals -> TO BE USED IN FUTURE IMPLEMENTATIONS TO MAKE THINGSPEAK DATA RETRIEVAL AUTOMATIC INTO DB
const POLL_INTERVAL_MS = 5000;

const pollData = () => {
  cachedData = mockRepository.getMockData();
  console.log("Loaded entries:", cachedData.length);
};

pollData();
setInterval(pollData, POLL_INTERVAL_MS);

// return all data
const readProcessedData = () => {
  return cachedData;
};

// return available stream/field names
const getAvailableStreamNames = () => {
  if (!cachedData || cachedData.length === 0) return [];

  const excludedKeys = ["created_at", "entry_id", "was_interpolated"];
  return Object.keys(cachedData[0]).filter(
    (key) => !excludedKeys.includes(key)
  );
};

// filter entries by selected stream names
const filterEntriesByStreamNames = (streamNames) => {
  return cachedData.map((entry) => {
    const filteredEntry = {
      created_at: entry.created_at,
      entry_id: entry.entry_id,
    };

    streamNames.forEach((name) => {
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
  filterEntriesByStreamNames,
};

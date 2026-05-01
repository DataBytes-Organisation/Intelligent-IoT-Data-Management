//handles the logic for processing mock data, using the repository for data access
const { stream } = require('undici-types');
const MockRepository = require('../repositories/mockRepository');
const mockRepository = new MockRepository();

let cachedData = [];

// Polling for 5 sec intervals 
const POLL_INTERVAL_MS = 5000;

const pollData = () =>  {
  cachedData = mockRepository.getMockData();
  console.log("Loaded entries:", cachedData.length);
};

pollData();
setInterval(pollData, POLL_INTERVAL_MS);

//return data 
const readProcessedData = () => {
  return cachedData;
};

//return with stream/field names 
const getAvailableStreamNames = () => {
  if (!cachedData || cachedData.length === 0) return [];

  const excludedKeys = ["created_at", "entry_id", "was_interpolated"];
  return Object.keys(entries[0]).filter(key => !excludedKeys.includes(key));
};

//ThingSpeak reponse formatting
const formatResponse = (entries, streamNames) => {
  return {
    channel: {
      id: 123456,
      channel_name: "mock",
      field_names: streamNames
    },

    feeds: entries.map(entry => {
      const feed = {
        created_at: entry.created_at,
        entry_id: entry.entry_id,
      };

      streamNames.forEach((streamName, index) => {
        if (entry[streamName] !== undefined) {
          feed['field${index + 1}'] = entry[streamName];
        }
      });
      return feed;
    })
  }
}

//filter entries 
const filterEntriesByStreamNames = (streamNames) => {
  const filtered = cachedData.map(entry => {
    const filteredEntry = {
      created_at: entry.created_at,
      entry_id: entry.entry_id
    };

    streamNames.forEach(streamName => {
      if (entry[streamName] !== undefined) {
        filteredEntry[streamName] = entry[streamName]
      }
    });
    return filteredEntry;
  });

  return formatResponse(filtered, streamNames);
};

module.exports = {
  readProcessedData,
  getAvailableStreamNames,
  filterEntriesByStreamNames
};

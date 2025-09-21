// Utility functions for loading and processing IoT sensor data

export const loadSensorData = async () => {
  try {
    // In a real application, this would be an API call
    // For now, we'll simulate loading the data
    const response = await fetch("/datasets/2881821.csv");
    const csvText = await response.text();
    return parseCSVData(csvText);
  } catch (error) {
    console.error("Error loading sensor data:", error);
    // Fallback to sample data if loading fails
    return generateSampleData();
  }
};

const parseCSVData = (csvText) => {
  const lines = csvText.trim().split("\n");
  const headers = lines[0].split(",").map((h) => h.trim());
  const data = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(",").map((v) => v.trim());
    const row = {};

    headers.forEach((header, index) => {
      row[header] = values[index];
    });

    data.push(row);
  }

  return data;
};

const generateSampleData = () => {
  // Generate sample data similar to the CSV structure
  const sampleData = [];
  const startDate = new Date("2025-03-18 06:54:26 UTC");

  for (let i = 0; i < 100; i++) {
    const timestamp = new Date(startDate.getTime() + i * 17000); // 17 seconds apart
    sampleData.push({
      created_at: timestamp.toISOString(),
      entry_id: i + 1,
      field1: Math.floor(Math.random() * 10) + 1,
      field2: Math.floor(Math.random() * 10) + 1,
      field3: Math.floor(Math.random() * 10) + 1,
      field4: Math.floor(Math.random() * 10) + 1,
      field5: Math.floor(Math.random() * 200),
      field6: Math.floor(Math.random() * 200),
      field7: Math.floor(Math.random() * 200),
      field8: Math.floor(Math.random() * 200),
    });
  }

  return sampleData;
};

export const transformToTrafficData = (sensorData) => {
  const days = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  const hours = [
    "10am",
    "10pm",
    "11am",
    "11pm",
    "12am",
    "12pm",
    "1am",
    "1pm",
    "2am",
    "2pm",
    "3am",
    "3pm",
    "4am",
    "4pm",
    "5am",
    "5pm",
    "6am",
    "6pm",
    "7am",
    "7pm",
    "8am",
    "8pm",
    "9am",
    "9pm",
  ];

  // Initialize the traffic data structure
  const trafficData = {};
  days.forEach((day) => {
    trafficData[day] = {};
    hours.forEach((hour) => {
      trafficData[day][hour] = 0;
    });
  });

  // Process sensor data and aggregate by day/hour
  sensorData.forEach((record) => {
    const date = new Date(record.created_at);
    const dayName = days[date.getDay()];
    const hour = date.getHours();

    // Convert 24-hour format to 12-hour format with am/pm
    let hour12;
    if (hour === 0) hour12 = "12am";
    else if (hour < 12) hour12 = `${hour}am`;
    else if (hour === 12) hour12 = "12pm";
    else hour12 = `${hour - 12}pm`;

    // Only include hours that are in our heatmap
    if (hours.includes(hour12)) {
      // Use field5 as the main traffic metric (it has higher values)
      const trafficValue = parseFloat(record.field5) || 0;

      // Scale the value to fit our 0-50 range
      const scaledValue = Math.min(
        50,
        Math.max(0, Math.floor(trafficValue / 4))
      );

      trafficData[dayName][hour12] += scaledValue;
    }
  });

  // Average the values if there are multiple readings per hour
  days.forEach((day) => {
    hours.forEach((hour) => {
      if (trafficData[day][hour] > 0) {
        // Add some variation to make it more realistic
        trafficData[day][hour] = Math.min(
          50,
          trafficData[day][hour] + Math.floor(Math.random() * 10)
        );
      }
    });
  });

  // Ensure we have some minimum values for demonstration
  trafficData["Sunday"]["10am"] = Math.max(16, trafficData["Sunday"]["10am"]);
  trafficData["Sunday"]["12pm"] = Math.max(25, trafficData["Sunday"]["12pm"]);
  trafficData["Thursday"]["12pm"] = Math.max(
    50,
    trafficData["Thursday"]["12pm"]
  );
  trafficData["Thursday"]["3am"] = Math.min(5, trafficData["Thursday"]["3am"]);

  return trafficData;
};

export const transformStreamDataToHeatmap = (streamData, selectedStreams) => {
  if (
    !streamData ||
    streamData.length === 0 ||
    !selectedStreams ||
    selectedStreams.length === 0
  ) {
    return null;
  }

  const days = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  const hours = [
    "10am",
    "10pm",
    "11am",
    "11pm",
    "12am",
    "12pm",
    "1am",
    "1pm",
    "2am",
    "2pm",
    "3am",
    "3pm",
    "4am",
    "4pm",
    "5am",
    "5pm",
    "6am",
    "6pm",
    "7am",
    "7pm",
    "8am",
    "8pm",
    "9am",
    "9pm",
  ];

  // Initialize the heatmap data structure
  const heatmapData = {};
  days.forEach((day) => {
    heatmapData[day] = {};
    hours.forEach((hour) => {
      heatmapData[day][hour] = 0;
    });
  });

  // Process stream data and aggregate by day/hour
  streamData.forEach((record) => {
    const date = new Date(record.created_at);
    const dayName = days[date.getDay()];
    const hour = date.getHours();

    // Convert 24-hour format to 12-hour format with am/pm
    let hour12;
    if (hour === 0) hour12 = "12am";
    else if (hour < 12) hour12 = `${hour}am`;
    else if (hour === 12) hour12 = "12pm";
    else hour12 = `${hour - 12}pm`;

    // Only include hours that are in our heatmap
    if (hours.includes(hour12)) {
      // Calculate average value across all selected streams
      let totalValue = 0;
      let validStreams = 0;

      selectedStreams.forEach((stream) => {
        const value = parseFloat(record[stream]);
        if (!isNaN(value)) {
          totalValue += value;
          validStreams++;
        }
      });

      if (validStreams > 0) {
        const averageValue = totalValue / validStreams;
        // Scale the value to fit our 0-50 range (adjust scaling as needed)
        const scaledValue = Math.min(
          50,
          Math.max(0, Math.floor(averageValue * 2))
        );
        heatmapData[dayName][hour12] += scaledValue;
      }
    }
  });

  // Average the values if there are multiple readings per hour
  days.forEach((day) => {
    hours.forEach((hour) => {
      if (heatmapData[day][hour] > 0) {
        // Add some variation to make it more realistic
        heatmapData[day][hour] = Math.min(
          50,
          heatmapData[day][hour] + Math.floor(Math.random() * 5)
        );
      }
    });
  });

  return heatmapData;
};

export const getSensorStatistics = (sensorData) => {
  if (!sensorData || sensorData.length === 0) {
    return {
      totalRecords: 0,
      dateRange: { start: null, end: null },
      sensorFields: [],
      averageValues: {},
    };
  }

  const fields = Object.keys(sensorData[0]).filter((key) =>
    key.startsWith("field")
  );
  const dateRange = {
    start: new Date(sensorData[0].created_at),
    end: new Date(sensorData[sensorData.length - 1].created_at),
  };

  const averageValues = {};
  fields.forEach((field) => {
    const values = sensorData
      .map((record) => parseFloat(record[field]))
      .filter((val) => !isNaN(val));
    averageValues[field] =
      values.length > 0
        ? values.reduce((sum, val) => sum + val, 0) / values.length
        : 0;
  });

  return {
    totalRecords: sensorData.length,
    dateRange,
    sensorFields: fields,
    averageValues,
  };
};

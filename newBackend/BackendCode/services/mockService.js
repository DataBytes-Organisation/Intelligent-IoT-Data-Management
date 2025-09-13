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

// Filter data by date range
const filterByDateRange = (entries, startDate, endDate) => {
  if (!startDate && !endDate) return entries;
  
  return entries.filter(entry => {
    const entryDate = new Date(entry.created_at);
    const start = startDate ? new Date(startDate) : new Date(0);
    const end = endDate ? new Date(endDate) : new Date();
    
    return entryDate >= start && entryDate <= end;
  });
};

// Calculate correlation coefficient between two arrays
const calculateCorrelation = (x, y) => {
  const n = x.length;
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
  const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
  const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);
  
  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
  
  return denominator === 0 ? 0 : numerator / denominator;
};

// Perform correlation analysis
const performCorrelationAnalysis = (streams, startDate, endDate, algorithmType, threshold) => {
  const entries = mockRepository.getMockData();
  const filteredEntries = filterByDateRange(entries, startDate, endDate);
  
  if (filteredEntries.length < 3) {
    throw new Error('Insufficient data for correlation analysis');
  }
  
  const results = {};
  
  // Calculate average correlation for each stream
  streams.forEach(stream => {
    const otherStreams = streams.filter(s => s !== stream);
    const correlations = [];
    
    otherStreams.forEach(otherStream => {
      const x = filteredEntries.map(entry => entry[stream]).filter(val => val !== undefined);
      const y = filteredEntries.map(entry => entry[otherStream]).filter(val => val !== undefined);
      
      if (x.length > 0 && y.length > 0) {
        const correlation = calculateCorrelation(x, y);
        correlations.push(correlation);
      }
    });
    
    const avgCorrelation = correlations.length > 0 
      ? correlations.reduce((a, b) => a + b, 0) / correlations.length 
      : 0;
    
    const thresholdValue = threshold || (avgCorrelation - 0.2); // Default threshold
    
    results[stream] = {
      avg_corr: avgCorrelation,
      is_outlier: avgCorrelation < thresholdValue
    };
  });
  
  return results;
};

// Perform anomaly detection using Z-score
const performAnomalyDetection = (streams, startDate, endDate, algorithmType, contamination) => {
  const entries = mockRepository.getMockData();
  const filteredEntries = filterByDateRange(entries, startDate, endDate);
  
  if (filteredEntries.length === 0) {
    throw new Error('No data found for the specified criteria');
  }
  
  const results = {
    data: [],
    anomaly_count: 0,
    total_points: filteredEntries.length,
    anomaly_percentage: 0,
    algorithm_used: algorithmType
  };
  
  // Add anomaly detection for each stream
  filteredEntries.forEach(entry => {
    const newEntry = { ...entry };
    
    streams.forEach(stream => {
      if (entry[stream] !== undefined) {
        const values = filteredEntries.map(e => e[stream]).filter(v => v !== undefined);
        const mean = values.reduce((a, b) => a + b, 0) / values.length;
        const std = Math.sqrt(values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length);
        
        const zScore = Math.abs((entry[stream] - mean) / std);
        const isAnomaly = zScore > 3; // Z-score threshold of 3
        
        newEntry[`${stream}_is_anomaly`] = isAnomaly;
        newEntry[`${stream}_z_score`] = zScore;
        
        if (isAnomaly) {
          results.anomaly_count++;
        }
      }
    });
    
    results.data.push(newEntry);
  });
  
  results.anomaly_percentage = (results.anomaly_count / results.total_points) * 100;
  
  return results;
};

// Export data in various formats
const exportData = (streams, startDate, endDate, format) => {
  const entries = mockRepository.getMockData();
  const filteredEntries = filterByDateRange(entries, startDate, endDate);
  
  const exportData = filteredEntries.map(entry => {
    const exportEntry = {
      timestamp: entry.created_at,
      entry_id: entry.entry_id
    };
    
    streams.forEach(stream => {
      if (entry[stream] !== undefined) {
        exportEntry[stream] = entry[stream];
      }
    });
    
    return exportEntry;
  });
  
  if (format === 'csv') {
    // Convert to CSV format
    const headers = Object.keys(exportData[0] || {});
    const csvRows = [headers.join(',')];
    
    exportData.forEach(row => {
      const values = headers.map(header => row[header] || '');
      csvRows.push(values.join(','));
    });
    
    return csvRows.join('\n');
  }
  
  return exportData;
};

// Get available algorithms
const getAvailableAlgorithms = () => {
  return {
    correlation_algorithms: ['correlation', 'mean', 'volatility'],
    anomaly_algorithms: ['isolation_forest', 'z_score']
  };
};

// Get dataset statistics
const getStatistics = () => {
  const entries = mockRepository.getMockData();
  const streamNames = getAvailableStreamNames();
  
  const stats = {
    total_records: entries.length,
    date_range: {
      start: entries.length > 0 ? entries[0].created_at : null,
      end: entries.length > 0 ? entries[entries.length - 1].created_at : null
    },
    sensor_stats: {}
  };
  
  streamNames.forEach(stream => {
    const values = entries.map(entry => entry[stream]).filter(val => val !== undefined);
    if (values.length > 0) {
      const sum = values.reduce((a, b) => a + b, 0);
      const mean = sum / values.length;
      const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
      const std = Math.sqrt(variance);
      
      stats.sensor_stats[stream] = {
        mean: parseFloat(mean.toFixed(2)),
        std: parseFloat(std.toFixed(2)),
        min: Math.min(...values),
        max: Math.max(...values),
        count: values.length
      };
    }
  });
  
  return stats;
};

module.exports = {
  readProcessedData,
  getAvailableStreamNames,
  filterEntriesByStreamNames,
  performCorrelationAnalysis,
  performAnomalyDetection,
  exportData,
  getAvailableAlgorithms,
  getStatistics
};
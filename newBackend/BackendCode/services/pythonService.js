// handles the logic for processing Python endpoints, using the repository for data access

const PythonRepository = require('../repositories/pythonRepository');
const pythonRepository = new PythonRepository();

const analyze = async (params) => {
  return await pythonRepository.postToEndpoint('analyze', params);
};

const visualize = async (params) => {
  return await pythonRepository.postToEndpoint('visualize', params);
};

const analyzeCsv = async (params) => {
  return await pythonRepository.postToEndpoint('analyze-csv', params, 'arraybuffer');
};

const analyzeCorr = async (params) => {
  return await pythonRepository.postToEndpoint('analyze-corr', params);
};

module.exports = {
  analyze,
  visualize,
  analyzeCsv,
  analyzeCorr
};
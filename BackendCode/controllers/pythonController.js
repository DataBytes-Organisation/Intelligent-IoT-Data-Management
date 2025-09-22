// handles HTTP request logic for Python-backed endpoints

const {
  analyze,
  visualize,
  analyzeCsv,
  analyzeCorr
} = require('../services/pythonService');

// POST /analyze — correlation analysis
const postAnalyze = async (req, res) => {
  try {
    const result = await analyze(req.validatedBody || req.body);
    res.json(result);
  } catch (err) {
    console.error('Analyze error:', err.message);
    res.status(500).json({ error: 'Failed to perform analysis' });
  }
};

// POST /visualize — returns base64 image
const postVisualize = async (req, res) => {
  try {
    const result = await visualize(req.validatedBody || req.body);
    res.json(result);
  } catch (err) {
    console.error('Visualization error:', err.message);
    res.status(500).json({ error: 'Failed to generate visualization' });
  }
};

// POST /analyze-csv — returns cleaned CSV
const postAnalyzeCsv = async (req, res) => {
  try {
    const result = await analyzeCsv(req.validatedBody || req.body);
    res.setHeader('Content-Disposition', 'attachment; filename=report.csv');
    res.setHeader('Content-Type', 'text/csv');
    res.send(result);
  } catch (err) {
    console.error('Analyze CSV error:', err.message);
    res.status(500).json({ error: 'Failed to analyze CSV' });
  }
};

// POST /analyze-corr — returns correlation matrix
const postAnalyzeCorr = async (req, res) => {
  try {
    const result = await analyzeCorr(req.validatedBody || req.body);
    res.json(result);
  } catch (err) {
    console.error('Analyze Corr error:', err.message);
    res.status(500).json({ error: 'Failed to perform correlation analysis' });
  }
};

module.exports = {
  postAnalyze,
  postVisualize,
  postAnalyzeCsv,
  postAnalyzeCorr
};
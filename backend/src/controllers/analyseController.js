/**
 * ANALYSE CONTROLLER
 * -------------------
 * Handles requests for analysis and correlation.
 */

const analyseService = require('../services/analyseService');

/**
 * POST /api/analyse
 * Existing generic analysis route.
 */
const analyse = async (req, res) => {
  try {
    const result = await analyseService.runAnalysis(req.body);

    return res.status(200).json(result);
  } catch (err) {
    console.error('Error analysing data:', err);

    return res.status(500).json({
      error: 'Failed to analyse data',
      message: err.message
    });
  }
};

/**
 * POST /api/correlation-alert
 *
 * Reads the requested dataset from PostgreSQL,
 * prepares the confirmed Correlation payload,
 * and calls the Correlation service.
 */
const correlationAlert = async (req, res) => {
  try {
    const {
      datasetName,
      selectedStreams,
      windowSize,
      stepSize,
      method
    } = req.body;

    if (!datasetName) {
      return res.status(400).json({
        error: 'datasetName is required'
      });
    }

    if (
      !Array.isArray(selectedStreams) ||
      selectedStreams.length < 2
    ) {
      return res.status(400).json({
        error: 'At least two selectedStreams are required'
      });
    }

    const result = await analyseService.runAnalysis({
      datasetName,
      selectedStreams,
      windowSize,
      stepSize,
      method
    });

    return res.status(200).json(result);

  } catch (err) {
    console.error(
      'Error running correlation analysis:',
      err
    );

    return res.status(502).json({
      error: 'Correlation analysis failed',
      message: err.message
    });
  }
};

module.exports = {
  analyse,
  correlationAlert
};
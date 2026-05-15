/**
 * ANALYSE CONTROLLER
 * -------------------
 * Responsible for receiving analysis payloads and passing them
 * to the analyseService.
 *
 * Later, this will run real analysis logic (ML, stats, etc.).
 */

const analyseService = require('../services/analyseService');

/**
 * POST /api/analyse
 * Accepts any JSON payload and returns analysis results.
 */
const analyse = async (req, res) => {
  try {
    const result = await analyseService.runAnalysis(req.body);
    return res.status(200).json(result);
  } catch (err) {
    console.error('Error analysing data:', err);
    return res.status(500).json({ error: 'Failed to analyse data' });
  }
};

module.exports = { analyse };

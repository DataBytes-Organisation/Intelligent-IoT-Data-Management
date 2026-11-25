/**
 * ANALYSE CONTROLLER
 * -------------------
 * Receives analysis requests, runs the analysis,
 * and saves successful results to the database.
 */

const analyseService = require("../services/analyseService");
const analysisRepository = require("../repositories/analysisRepository");

/**
 * POST /api/analyse
 */
const analyse = async (req, res) => {
  try {
    const result = await analyseService.runAnalysis(req.body, req.user.sub);

    const saved = await analysisRepository.saveAnalysisRun({
      userId: req.user.sub,
      datasetId: req.body.datasetId,
      streams: req.body.correlation?.streams || [],
      settings: {
        model: req.body.model || null,
        correlation: req.body.correlation || null,
      },
      alerts: Array.isArray(result.alerts) ? result.alerts : [],
    });

    result.alerts = saved.alerts;

    return res.status(200).json(result);
  } catch (err) {
    console.error("Error analysing data:", err);

    return res.status(err.status || 500).json({
      error: err.message || "Failed to analyse data",
      code: err.code || "INTERNAL_ERROR",
      ...(err.details ? { details: err.details } : {}),
    });
  }
};

module.exports = { analyse };

/**
 * ANALYSE CONTROLLER
 */

const analyseService = require("../services/analyseService");
const analysisRepository = require("../repositories/analysisRepository");

/**
 * POST /api/analyse
 */
const analyse = async (req, res) => {
  try {
    // Run the analysis first
    const result = await analyseService.runAnalysis(req.body, req.user.sub);

    // Save only when the request is linked to a dataset
    if (req.body.datasetId) {
      const saved = await analysisRepository.saveAnalysisRun({
        userId: req.user.sub,
        datasetId: req.body.datasetId,
        streams: req.body.correlation?.streams || [],
        settings: {
          model: req.body.model || null,
          correlation: req.body.correlation || null,
        },
        alerts: result.alerts || [],
      });

      // Include generated alert IDs in the response
      result.alerts = saved.alerts;
    }

    // Include the generated alert IDs in the response
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

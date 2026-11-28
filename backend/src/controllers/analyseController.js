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

    // Only save successful Analytics responses.
    if (result.status !== "success") {
      return res.status(200).json(result);
    }

    // Preserve the original Analytics result.
    const originalResult = structuredClone(result);

    const saved = await analysisRepository.saveAnalysisRun({
      userId: req.user.sub,
      datasetId: req.body.datasetId ?? null,
      datasetName: req.body.datasetName ?? null,

      streams: req.body.correlation?.streams || [],

      settings: {
        model: req.body.model || null,
        correlation: req.body.correlation || null,
      },

      // Store the complete request and Analytics response.
      request: req.body,
      result: originalResult,

      status: result.status,
      contractVersion: result.contract_version ?? null,
      generatedAt: result.generated_at ?? null,

      alerts: Array.isArray(result.alerts) ? result.alerts : [],
    });

    // Return the saved alert IDs and the database run ID.
    return res.status(200).json({
      ...result,
      alerts: saved.alerts,
      run_id: saved.runId,
    });
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

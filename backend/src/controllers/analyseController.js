/**
 * ANALYSE CONTROLLER
 * -------------------
 * Receives analysis requests, runs the analysis,
 * and saves successful results to the database.
 */

const { randomUUID } = require("node:crypto");
const analyseService = require("../services/analyseService");
const analysisRepository = require("../repositories/analysisRepository");

/**
 * POST /api/analyse
 */
const analyse = async (req, res) => {
  try {
    const { result, datasetName, storedRequest } =
      await analyseService.runAnalysis(req.body, req.user.sub);

    // Only save successful Analytics responses.
    if (result?.status !== "success") {
      return res.status(200).json(result);
    }

    const alerts = (Array.isArray(result.alerts) ? result.alerts : []).map(
      (alert) => ({
        ...alert,
        alert_id: alert.alert_id ?? randomUUID(),
      }),
    );
    const storedResult = { ...result, alerts };

    const saved = await analysisRepository.saveAnalysisRun({
      userId: req.user.sub,
      datasetId: req.body.datasetId ?? null,
      datasetName,

      streams: storedRequest.correlation?.streams || [],

      settings: {
        model: req.body.model || null,
        correlation: req.body.correlation || null,
      },

      request: storedRequest,
      result: storedResult,

      status: result.status,
      contractVersion: "0.1",
      generatedAt: result.generated_at ?? null,

      alerts,
    });

    return res.status(200).json({
      ...storedResult,
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

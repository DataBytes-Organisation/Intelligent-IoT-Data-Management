const { z } = require('zod');

// Common schemas
const isoDateString = z.string().datetime({ offset: true }).describe('ISO datetime with timezone offset');

// GET /streams — no input
const getStreamsSchema = {};

// GET /stream-names — no input
const getStreamNamesSchema = {};

// POST /filter-streams
const filterStreamsBody = z.object({
  streamNames: z.array(z.string().min(1)).min(1, 'At least one stream name is required')
});

// POST /analyze
const analyzeBody = z.object({
  streams: z.array(z.string()).min(1),
  start_date: isoDateString,
  end_date: isoDateString,
  threshold: z.number().min(0).max(1),
  algo_type: z.enum(['correlation']).default('correlation')
});

// POST /analyze-csv
const analyzeCsvBody = z.object({
  window_size: z.number().int().positive().optional()
});

// POST /analyze-corr
const analyzeCorrBody = z.object({
  streams: z.array(z.string()).min(2),
  start_date: isoDateString,
  end_date: isoDateString,
  threshold: z.number().min(0).max(1).optional()
});

module.exports = {
  getStreamsSchema,
  getStreamNamesSchema,
  filterStreamsBody,
  analyzeBody,
  analyzeCsvBody,
  analyzeCorrBody
};



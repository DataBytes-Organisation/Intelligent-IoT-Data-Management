/**
 * analyseModule.js
 * Combines Controller, Service, and Repository for analysis into one file.
 * Optimized CSR design in a single file.
 */

/* ===============================
   Repository Layer
   =============================== */
class AnalyseRepository {
  async saveAnalysis(payload) {
    // Stub: replace with Postgres insert, Kafka queue, etc.
    console.log('💾 [Repository] Saving analysis payload:', payload);
    return true;
  }
}

/* ===============================
   Service Layer
   =============================== */
class AnalyseService {
  constructor(analyseRepository) {
    this.analyseRepository = analyseRepository;
  }

  async processAnalysis(payload) {
    if (!payload || Object.keys(payload).length === 0) {
      throw { code: 'BAD_REQUEST', message: 'Payload is empty' };
    }

    // Save to repository (future: DB, event bus, etc.)
    await this.analyseRepository.saveAnalysis(payload);

    // Echo back for now
    return { received: payload };
  }
}

/* ===============================
   Controller Layer
   =============================== */
class AnalyseController {
  constructor(analyseService) {
    this.analyseService = analyseService;
    this.analyse = this.analyse.bind(this);
  }

  async analyse(req, res) {
    try {
      console.log('📥 Analyse payload:', req.body);
      const result = await this.analyseService.processAnalysis(req.body);
      res.status(200).json({ ok: true, data: result });
    } catch (error) {
      if (error.code === 'BAD_REQUEST') {
        return res.status(400).json({
          code: 'bad_request',
          message: error.message
        });
      }
      console.error('AnalyseController error:', error);
      res.status(500).json({
        code: 'internal_error',
        message: 'Failed to process analysis'
      });
    }
  }
}

/* ===============================
   Export Factory
   =============================== */
function createAnalyseModule() {
  const repo = new AnalyseRepository();
  const service = new AnalyseService(repo);
  const controller = new AnalyseController(service);
  return controller;
}

module.exports = createAnalyseModule;

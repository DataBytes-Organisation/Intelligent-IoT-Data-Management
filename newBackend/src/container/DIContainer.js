// src/container/DIContainer.js

const SeriesController = require('../controllers/seriesController');
const DatasetController = require('../controllers/datasetController');

const SeriesService = require('../services/seriesService');
const SeriesRepository = require('../repositories/seriesRepository');

const DatasetService = require('../services/datasetService');
const DatasetRepository = require('../repositories/datasetRepository');

class DIContainer {
  constructor(pool) {
    // Repositories
    this.seriesRepository = new SeriesRepository(pool);
    this.datasetRepository = new DatasetRepository(pool);

    // Services
    this.seriesService = new SeriesService(this.seriesRepository);
    this.datasetService = new DatasetService(this.datasetRepository);

    // Controllers
    this.seriesController = new SeriesController(this.seriesService);
    this.datasetController = new DatasetController(this.datasetService);
  }

  /**
   * Resolve a dependency by name
   */
  resolve(name) {
    switch (name) {
      case 'seriesController':
        return this.seriesController;
      case 'datasetController':
        return this.datasetController;
      default:
        throw new Error(`Dependency '${name}' not found in DIContainer`);
    }
  }

  getControllers() {
    return {
      seriesController: this.seriesController,
      datasetController: this.datasetController
    };
  }
}

module.exports = DIContainer;

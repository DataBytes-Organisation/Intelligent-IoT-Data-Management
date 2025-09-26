const SeriesController = require('../controllers/SeriesController');
const DatasetController = require('../controllers/DatasetController');

const SeriesService = require('../services/SeriesService');
const SeriesRepository = require('../repositories/SeriesRepository');

const DatasetService = require('../services/DatasetService');
const DatasetRepository = require('../repositories/DatasetRepository');

const MockController = require('../controllers/MockController');
const MockService = require('../services/MockService');
const MockRepository = require('../repositories/MockRepository');

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

    // Mock stack (optional)
    this.mockRepository = new MockRepository();
    this.mockService = new MockService(this.mockRepository);
    this.mockController = new MockController(this.mockService);
  }

  resolve(name) {
    switch (name) {
      case 'seriesController':
        return this.seriesController;
      case 'datasetController':
        return this.datasetController;
      case 'mockController':
        return this.mockController;
      default:
        throw new Error(`Dependency '${name}' not found in DIContainer`);
    }
  }

  getControllers() {
    return {
      seriesController: this.seriesController,
      datasetController: this.datasetController,
      mockController: this.mockController
    };
  }
}

module.exports = DIContainer;

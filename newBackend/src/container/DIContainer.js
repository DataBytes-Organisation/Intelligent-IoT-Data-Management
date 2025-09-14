const DatasetRepository = require('../repositories/DatasetRepository');
const TimeSeriesRepository = require('../repositories/TimeSeriesRepository');
const DatasetService = require('../services/DatasetService');
const TimeSeriesService = require('../services/TimeSeriesService');
const DatasetController = require('../controllers/DatasetController');
const SeriesController = require('../controllers/SeriesController');

class DIContainer {
  constructor() {
    this.dependencies = new Map();
    this.setupDependencies();
  }

  setupDependencies() {
    // Repositories
    this.register('datasetRepository', () => new DatasetRepository());
    this.register('timeSeriesRepository', () => new TimeSeriesRepository());

    // Services
    this.register('datasetService', () => 
      new DatasetService(this.resolve('datasetRepository'))
    );

    this.register('timeSeriesService', () =>
      new TimeSeriesService(
        this.resolve('timeSeriesRepository'),
        this.resolve('datasetRepository')
      )
    );

    // Controllers
    this.register('datasetController', () =>
      new DatasetController(this.resolve('datasetService'))
    );

    this.register('seriesController', () =>
      new SeriesController(this.resolve('timeSeriesService'))
    );
  }

  register(name, factory) {
    this.dependencies.set(name, { factory, instance: null });
  }

  resolve(name) {
    const dependency = this.dependencies.get(name);
    if (!dependency) {
      throw new Error(`Dependency '${name}' not found`);
    }

    if (!dependency.instance) {
      dependency.instance = dependency.factory();
    }

    return dependency.instance;
  }
}

const container = new DIContainer();
module.exports = container;
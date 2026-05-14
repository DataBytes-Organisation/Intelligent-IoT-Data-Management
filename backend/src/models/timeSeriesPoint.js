class TimeSeriesPoint {
  constructor({
    id,
    datasetId,
    entity,
    metric,
    ts,
    value,
    qualityFlag
  }) {
    this.id = id;
    this.datasetId = datasetId;
    this.entity = entity;
    this.metric = metric;
    this.ts = ts;
    this.value = value;
    this.qualityFlag = qualityFlag;
  }
}

module.exports = TimeSeriesPoint;
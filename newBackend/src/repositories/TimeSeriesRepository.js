const BaseRepository = require('./BaseRepository');

class TimeSeriesRepository extends BaseRepository {
  constructor() {
    super('timeseries_long');
  }

  async getRawTimeSeries(datasetId, metric, from, to) {
    const query = `
      SELECT ts, value, quality_flag 
      FROM timeseries_long 
      WHERE dataset_id = $1 AND metric = $2 AND ts BETWEEN $3 AND $4 
      ORDER BY ts
    `;
    const result = await this.db.query(query, [datasetId, metric, from, to]);
    return result.rows;
  }

  async getAggregatedTimeSeries(datasetId, metric, from, to, bucketExpression) {
    const query = `
      WITH b AS (
        SELECT ${bucketExpression} AS bucket, value
        FROM timeseries_long
        WHERE dataset_id = $1 AND metric = $2 AND ts BETWEEN $3 AND $4
      )
      SELECT bucket AS ts, AVG(value) AS value
      FROM b
      GROUP BY bucket
      ORDER BY bucket
    `;
    const result = await this.db.query(query, [datasetId, metric, from, to]);
    return result.rows;
  }

  async getAvailableTimeseries(datasetId, limit) {
    const query = `
      SELECT DISTINCT metric, 
             COUNT(*) as record_count,
             MIN(ts) as earliest_ts,
             MAX(ts) as latest_ts
      FROM timeseries_long 
      WHERE dataset_id = $1 
      GROUP BY metric 
      ORDER BY metric
      LIMIT $2
    `;
    const result = await this.db.query(query, [datasetId, limit]);
    return result.rows;
  }

  getBucketExpression(interval) {
    const expressions = {
      '5min': `date_trunc('minute', ts) - make_interval(mins => EXTRACT(minute FROM ts)::int % 5)`,
      '15min': `date_trunc('minute', ts) - make_interval(mins => EXTRACT(minute FROM ts)::int % 15)`,
      '1h': `date_trunc('hour', ts)`,
      '6h': `date_trunc('hour', ts) - make_interval(hours => EXTRACT(hour FROM ts)::int % 6)`
    };
    return expressions[interval];
  }
}

module.exports = TimeSeriesRepository;
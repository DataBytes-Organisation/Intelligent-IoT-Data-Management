class TimeSeriesWide {
  constructor({
    dataset_id,
    created_at,
    entry_id,
    ...fields
  }) {
    this.dataset_id = dataset_id;
    this.created_at = created_at;
    this.entry_id = entry_id;

    Object.assign(this, fields);
  }
}

module.exports = TimeSeriesWide;
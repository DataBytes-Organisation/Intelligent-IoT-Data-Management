const {
  transformRowsForAnalytics,
  buildCorrelationPayload
} = require('../src/services/analyseService');

describe('analyseService', () => {

  test('transforms channel 12397 persisted row into canonical fields', () => {
    const rows = [
      {
        dataset_id: 1,
        created_at: '2026-08-09T08:57:28.000Z',
        entry_id: 5696876,
        field1: '113',
        field2: '3.5',
        field3: '0',
        field4: '0.1',
        field5: '0',
        field6: '29.7',
        field7: '0',
        field8: '0'
      }
    ];

    const result =
      transformRowsForAnalytics(rows, 12397);

    expect(result).toHaveLength(1);

    expect(result[0]).toEqual({
      timestamp: '2026-08-09T08:57:28.000Z',
      entry_id: 5696876,
      values: {
        wind_direction_degrees: 113,
        wind_speed_mph: 3.5,
        humidity_percent: 0,
        temperature_f: 0.1,
        rain_inches_per_minute: 0,
        pressure_hg: 29.7,
        power_level_v: 0,
        light_intensity: 0
      }
    });
  });

  test('transforms channel 1350261 persisted row into canonical fields', () => {
    const rows = [
      {
        dataset_id: 2,
        created_at: '2026-08-09T08:55:05.000Z',
        entry_id: 276956,
        field1: '625.9',
        field2: '54',
        field3: '25.62',
        field4: '983.19',
        field5: '46.58',
        field6: '24.69',
        field7: '52.96',
        field8: '1.13'
      }
    ];

    const result =
      transformRowsForAnalytics(rows, 1350261);

    expect(result).toHaveLength(1);

    expect(result[0]).toEqual({
      timestamp: '2026-08-09T08:55:05.000Z',
      entry_id: 276956,
      values: {
        eco2_ppm: 625.9,
        etvoc_ppb: 54,
        temperature_c: 25.62,
        air_pressure_hpa: 983.19,
        humidity_percent: 46.58,
        temperature_secondary_c: 24.69,
        controller_temperature_c: 52.96,
        conductance_us: 1.13
      }
    });
  });

  test('preserves null values during transformation', () => {
    const rows = [
      {
        dataset_id: 1,
        created_at: '2026-08-09T08:57:28.000Z',
        entry_id: 1,
        field1: null,
        field2: '',
        field3: undefined
      }
    ];

    const result =
      transformRowsForAnalytics(rows, 12397);

    expect(
      result[0].values.wind_direction_degrees
    ).toBeNull();

    expect(
      result[0].values.wind_speed_mph
    ).toBeNull();

    expect(
      result[0].values.humidity_percent
    ).toBeNull();
  });

  test('builds the confirmed flat Correlation payload', () => {
    const series = [
      {
        timestamp: '2026-08-28T10:00:00.000Z',
        entry_id: 1,
        values: {
          temperature_f: 24.5,
          humidity_percent: 61.2,
          wind_speed_mph: 3.1
        }
      },
      {
        timestamp: '2026-08-28T10:01:00.000Z',
        entry_id: 2,
        values: {
          temperature_f: 25.1,
          humidity_percent: 60.8,
          wind_speed_mph: 3.4
        }
      }
    ];

    const result =
      buildCorrelationPayload(
        series,
        [
          'temperature_f',
          'humidity_percent'
        ],
        {
          windowSize: 20,
          stepSize: 10,
          method: 'pearson'
        }
      );

    expect(result).toEqual({
      data: [
        {
          timestamp: '2026-08-28T10:00:00.000Z',
          temperature_f: 24.5,
          humidity_percent: 61.2
        },
        {
          timestamp: '2026-08-28T10:01:00.000Z',
          temperature_f: 25.1,
          humidity_percent: 60.8
        }
      ],
      timestamp_col: 'timestamp',
      selected_streams: [
        'temperature_f',
        'humidity_percent'
      ],
      window_size: 20,
      step_size: 10,
      method: 'pearson'
    });
  });

  test('requires at least two streams for Correlation', () => {
    const series = [
      {
        timestamp: '2026-08-28T10:00:00.000Z',
        entry_id: 1,
        values: {
          temperature_f: 24.5
        }
      }
    ];

    expect(() =>
      buildCorrelationPayload(
        series,
        ['temperature_f']
      )
    ).toThrow(
      'At least two selectedStreams are required'
    );
  });

});
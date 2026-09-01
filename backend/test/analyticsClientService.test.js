const {
  postAnalyticsRequest
} = require('../src/services/analyticsClientService');

describe('analyticsClientService', () => {

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('returns JSON data for a successful request', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        result: 'success'
      })
    });

    const result = await postAnalyticsRequest(
      'http://test-service.local',
      { dataset: 'thingspeak-live' },
      {
        timeoutMs: 1000,
        maxRetries: 0
      }
    );

    expect(result).toEqual({
      result: 'success'
    });

    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  test('throws an error for HTTP failure', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({})
    });

    await expect(
      postAnalyticsRequest(
        'http://test-service.local',
        { dataset: 'thingspeak-live' },
        {
          timeoutMs: 1000,
          maxRetries: 0
        }
      )
    ).rejects.toThrow(
      'Analytics service returned HTTP 500'
    );
  });

  test('retries when the first request fails', async () => {
    global.fetch = jest.fn()
      .mockRejectedValueOnce(
        new Error('Temporary service error')
      )
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          result: 'success after retry'
        })
      });

    const result = await postAnalyticsRequest(
      'http://test-service.local',
      { dataset: 'thingspeak-live' },
      {
        timeoutMs: 1000,
        maxRetries: 1
      }
    );

    expect(result).toEqual({
      result: 'success after retry'
    });

    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  test('throws an error when URL is missing', async () => {
    await expect(
      postAnalyticsRequest(
        '',
        { dataset: 'thingspeak-live' }
      )
    ).rejects.toThrow(
      'Analytics service URL is not configured'
    );
  });

  test('throws timeout error when analytics service takes too long', async () => {
    global.fetch = jest.fn((url, options) => {
      return new Promise((resolve, reject) => {
        options.signal.addEventListener('abort', () => {
          const error = new Error('Request aborted');
          error.name = 'AbortError';
          reject(error);
        });
      });
    });

    await expect(
      postAnalyticsRequest(
        'http://test-service.local',
        { dataset: 'thingspeak-live' },
        {
          timeoutMs: 50,
          maxRetries: 0
        }
      )
    ).rejects.toThrow(
      'Analytics service request timed out after 50ms'
    );

    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

});
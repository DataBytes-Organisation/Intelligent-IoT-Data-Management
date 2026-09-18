import { useEffect, useState } from 'react';
import { getSensorData } from '../services/sensorService';

export const useSensorData = (
  datasetId,
  useMock = false,
  baseUrl = '/api'
) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEmpty, setIsEmpty] = useState(false);
  const [isValid, setIsValid] = useState(true);

  const validateData = (response) => {
    if (!response) {
      return {
        valid: false,
        reason: 'No response received',
      };
    }

    if (response.error) {
      return {
        valid: false,
        reason: response.error,
        isError: true,
      };
    }

    if (!response.rows || !Array.isArray(response.rows)) {
      return {
        valid: false,
        reason: 'Missing rows array',
      };
    }

    if (response.rows.length === 0) {
      return {
        valid: true,
        isEmpty: true,
      };
    }

    if (
      !response.metadata ||
      !Array.isArray(response.metadata.streams)
    ) {
      return {
        valid: false,
        reason: 'Missing metadata or streams',
      };
    }

    const firstRow = response.rows[0];

    const streamIds = response.metadata.streams.map(
      (stream) => stream.id
    );

    const hasTimestamp =
      firstRow.created_at !== undefined;

    const hasStreamFields = streamIds.some(
      (id) => firstRow[id] !== undefined
    );

    if (!hasTimestamp || !hasStreamFields) {
      return {
        valid: false,
        reason:
          'Missing required fields (created_at or stream data)',
      };
    }

    return {
      valid: true,
      isEmpty: false,
    };
  };

  useEffect(() => {
    if (!datasetId) {
      setError(new Error('No dataset ID provided'));
      setLoading(false);
      setData(null);
      setIsEmpty(false);
      setIsValid(false);
      return;
    }

    let active = true;

    const loadSensorData = async () => {
      try {
        setLoading(true);
        setError(null);
        setIsEmpty(false);
        setIsValid(true);

        const response = await getSensorData(
          datasetId,
          {
            useMock,
            baseUrl,
          }
        );

        if (!active) {
          return;
        }

        const validation = validateData(response);

        if (validation.isError) {
          setError(
            new Error(
              validation.reason || 'Backend returned an error'
            )
          );

          setIsValid(false);
          setIsEmpty(false);
          setData(null);

          return;
        }

        if (!validation.valid) {
          setError(null);
          setIsValid(false);
          setIsEmpty(false);
          setData(null);

          return;
        }

        if (validation.isEmpty) {
          setData(response);
          setIsEmpty(true);
          setIsValid(true);

          return;
        }

        setData(response);
        setIsEmpty(false);
        setIsValid(true);
      } catch (err) {
        if (!active) {
          return;
        }

        setError(
          err instanceof Error
            ? err
            : new Error('Failed to load sensor data')
        );

        setData(null);
        setIsEmpty(false);
        setIsValid(false);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadSensorData();

    return () => {
      active = false;
    };
  }, [datasetId, useMock, baseUrl]);

  return {
    data,
    loading,
    error,
    isEmpty,
    isValid,
  };
};
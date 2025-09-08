import React, { useEffect, useMemo, useState } from 'react';
import { useSensorData } from '../hooks/useSensorData.js';         // fallback/mock only
import { useFilteredData } from '../hooks/useFilteredData.js';     // fallback/mock only
import { useStreamNames } from '../hooks/useStreamNames.js';       // fallback/mock only
import { useTimeRange } from '../hooks/useTimeRange.js';           // fallback/mock only
import TimeSelector from './TimeSelector.jsx';
import StreamSelector from './StreamSelector.jsx';
import IntervalSelector from './IntervalSelector.jsx';
import StreamStats from './StreamStats.jsx';
import './Dashboard.css';
import Chart from './Chart.jsx';
import MostCorrelatedPair from './MostCorrelatedPair.jsx';

// helpers
const getDatasetIdFromPath = () => {
  const segs = window.location.pathname.replace(/\/+$/, '').split('/');
  return segs[segs.length - 1] || '';
};
const toISO = (t) => (t instanceof Date ? t.toISOString() : new Date(t).toISOString());

// Merge { streamA:[{ts,value,quality_flag}], ... } -> [{ts, streamA, streamA_quality, ...}]
function mergeSeriesToWide(seriesMap) {
  if (!seriesMap) return null;
  const bucket = new Map();
  Object.entries(seriesMap).forEach(([stream, points]) => {
    points.forEach(({ ts, value, quality_flag }) => {
      const key = new Date(ts).toISOString();
      const row = bucket.get(key) || { ts: new Date(ts) };
      row[stream] = value;                            // value for this stream
      row[`${stream}_quality`] = quality_flag;        // carry boolean flag per stream
      bucket.set(key, row);
    });
  });
  return Array.from(bucket.values()).sort((a, b) => a.ts - b.ts);
}

const Dashboard = () => {
  // mock fallback (unchanged)
  const { data: mockData, loading: mockLoading, error: mockError } = useSensorData(true);
  const mockStreamNames = useStreamNames(mockData);
  const [mockStart, mockEnd] = useTimeRange(mockData);
  const mockTimeOptions = useTimeRange(mockData);

  // selections
  const [selectedTimeStart, setSelectedTimeStart] = useState('');
  const [selectedTimeEnd, setSelectedTimeEnd] = useState('');
  const [selectedStreams, setSelectedStreams] = useState([]);
  const intervals = ['raw', '5min', '15min', '1h', '6h'];
  const [selectedInterval, setSelectedInterval] = useState(intervals[0]);

  // local filtering (fallback)
  const filteredData = useFilteredData(mockData, {
    startTime: selectedTimeStart,
    endTime: selectedTimeEnd,
    selectedStreams,
    interval: selectedInterval
  });

  const datasetId = getDatasetIdFromPath();

  // meta + timestamps
  const [metaLoading, setMetaLoading] = useState(false);
  const [metaError, setMetaError] = useState(null);
  const [meta, setMeta] = useState(null);
  const [timestampOptions, setTimestampOptions] = useState([]);

  // fetched series
  const [apiLoading, setApiLoading] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [serverSeriesMap, setServerSeriesMap] = useState(null);
  const serverChartData = useMemo(() => mergeSeriesToWide(serverSeriesMap), [serverSeriesMap]);
  const displayData = serverChartData || filteredData;

  // load meta
  useEffect(() => {
    let cancelled = false;
    (async function loadMeta() {
      if (!datasetId) return;
      setMetaLoading(true); setMetaError(null); setMeta(null);
      try {
        const res = await fetch(`/api/datasets/${encodeURIComponent(datasetId)}/meta`);
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.message || `Meta request failed (${res.status})`);
        }
        const json = await res.json();
        if (cancelled) return;

        setMeta(json);
        if (!selectedTimeStart && json?.timeBounds?.start) setSelectedTimeStart(json.timeBounds.start);
        if (!selectedTimeEnd && json?.timeBounds?.end) setSelectedTimeEnd(json.timeBounds.end);
        if (selectedStreams.length === 0 && Array.isArray(json.fields) && json.fields.length > 0) {
          setSelectedStreams([json.fields[0]]);
        }
      } catch (e) {
        if (!cancelled) setMetaError(e.message);
      } finally {
        if (!cancelled) setMetaLoading(false);
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [datasetId]);

  // load timestamp options
  useEffect(() => {
    let cancelled = false;
    (async function loadTimestamps() {
      if (!datasetId) return;
      try {
        const res = await fetch(`/api/timestamps?datasetId=${encodeURIComponent(datasetId)}&limit=2000`);
        if (!res.ok) return;
        const { timestamps } = await res.json();
        if (cancelled) return;
        const opts = Array.isArray(timestamps) ? timestamps : [];
        setTimestampOptions(opts);
        if (!selectedTimeStart && opts.length) setSelectedTimeStart(opts[0]);
        if (!selectedTimeEnd && opts.length) setSelectedTimeEnd(opts[opts.length - 1]);
      } catch {
        // silent fallback to mock options
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [datasetId]);

  // fetch series and log everything (ts, value, quality_flag)
  const handleSubmit = async () => {
    setApiError(null);
    setApiLoading(true);
    setServerSeriesMap(null);

    try {
      if (!datasetId) throw new Error('Missing datasetId from URL');
      if (!selectedStreams?.length) throw new Error('Please select at least one stream');
      if (!selectedTimeStart || !selectedTimeEnd) throw new Error('Please select start and end time');

      const fromISO = toISO(selectedTimeStart);
      const toISO_  = toISO(selectedTimeEnd);
      const interval = selectedInterval || 'raw';

      const tasks = selectedStreams.map(async (stream) => {
        const url = `/api/series?datasetId=${encodeURIComponent(datasetId)}`
                  + `&stream=${encodeURIComponent(stream)}`
                  + `&interval=${encodeURIComponent(interval)}`
                  + `&from=${encodeURIComponent(fromISO)}&to=${encodeURIComponent(toISO_)}`;
        const res = await fetch(url);
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.message || `Series request failed (${res.status}) for ${stream}`);
        }
        const json = await res.json(); // { series: [{ ts, value, quality_flag? }, ...] }

        // 🔎 Logs (exactly what you asked for)
        console.log(`Stream "${stream}": ${json.series?.length || 0} rows`);
        console.log(`Data for "${stream}":`, json.series); // each item includes ts, value, quality_flag

        return [stream, json.series || []];
      });

      const entries = await Promise.all(tasks);
      const map = Object.fromEntries(entries);

      setServerSeriesMap(map);

      // merged rows used by Chart (also logged)
      const merged = mergeSeriesToWide(map);
      console.log('Merged chart data:', merged);

    } catch (e) {
      console.error(e);
      setApiError(e.message);
    } finally {
      setApiLoading(false);
    }
  };

  const streamListForLabel = meta?.fields?.length
    ? meta.fields.join(', ')
    : mockStreamNames.map(s => s.name).join(', ');

  if (mockLoading && metaLoading) return <p>Loading dataset...</p>;
  if (mockError) return <p>Error loading local dataset: {String(mockError)}</p>;
  if (metaError) return <p>Error loading metadata: {String(metaError)}</p>;

  return (
    <div>
      <div className='label-plate'>
        Hello World! I just came alive with this Sensor Data Set with {meta?.fieldCount ?? 7} fields!!
      </div>

      <div className='dashboard-container'>
        <div className='label-plate'>Streams: {streamListForLabel}</div>

        <div className='selector-grid'>
          <div className='selector-group card'>
            <StreamSelector
              data={mockData}
              streams={meta?.fields}                 // prefer backend field names
              selectedStreams={selectedStreams}
              setSelectedStreams={setSelectedStreams}
            />
          </div>

          <div className='selector-group card'>
            <IntervalSelector
              intervals={['raw', '5min', '15min', '1h', '6h']}
              selectedInterval={selectedInterval}
              setSelectedInterval={setSelectedInterval}
            />
          </div>

          <div className='selector-group card'>
            <h3>Time Range Selection</h3>
            <div className='card-content'>
              <div>
                <TimeSelector
                  label="Start Time"
                  timeOptions={timestampOptions.length ? timestampOptions : mockTimeOptions}
                  selectedTime={selectedTimeStart}
                  setSelectedTime={setSelectedTimeStart}
                />
              </div>
              <div>
                <TimeSelector
                  label="End Time"
                  timeOptions={timestampOptions.length ? timestampOptions : mockTimeOptions}
                  selectedTime={selectedTimeEnd}
                  setSelectedTime={setSelectedTimeEnd}
                />
              </div>
              <div className='button'>
                <button onClick={handleSubmit} disabled={apiLoading}>
                  {apiLoading ? 'Loading…' : 'Analyse Time Range'}
                </button>
                {apiError && <p style={{ color: 'red' }}>{apiError}</p>}
                {serverSeriesMap && !apiError && !apiLoading && (
                  <p>Loaded server data for {Object.keys(serverSeriesMap).length} stream(s).</p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div>
          <div className='stream-stats'>
            {selectedStreams.map(stream => (
              <StreamStats key={stream} data={displayData} stream={stream} />
            ))}
            {selectedStreams.length > 2 && (
              <MostCorrelatedPair data={displayData} streams={selectedStreams} />
            )}
          </div>
        </div>

        <div className="chart-container">
          <Chart data={displayData} selectedStreams={selectedStreams} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import Papa from 'papaparse';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import RealTimeGraph from './RealTimeGraph';

const AnalyzePanel = () => {
  const [selectedStreams, setSelectedStreams] = useState([]);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [expectedCorrelation, setExpectedCorrelation] = useState('');
  const [result, setResult] = useState(null);

  const graphRef = useRef(null);
  const streams = ['Sensor 1', 'Sensor 2', 'Sensor 3', 'Sensor 4', 'Sensor 5'];

  // Clear result when input changes
  useEffect(() => {
    setResult(null);
  }, [selectedStreams, startTime, endTime, expectedCorrelation]);

  const analyze = async () => {
    if (selectedStreams.length !== 3 || !startTime || !endTime || !expectedCorrelation) {
      alert('Please select exactly 3 streams and fill all fields.');
      return;
    }
    try {
      const { data } = await axios.post('http://localhost:5000/api/analyze', {
        streams: selectedStreams,
        start: startTime,
        end: endTime,
        expectedCorrelation: parseFloat(expectedCorrelation),
      });
      setResult(data);
    } catch (err) {
      console.error(err);
      alert('Analysis failed – check backend/network.');
    }
  };

  const exportAll = async () => {
    if (!result) {
      alert('Run an analysis first.');
      return;
    }

    try {
      if (!Array.isArray(result.data)) {
        alert('Unexpected data format for CSV export.');
        return;
      }

      const csv = Papa.unparse(result.data);
      saveAs(new Blob([csv], { type: 'text/csv;charset=utf-8;' }), 'analysis.csv');

      const canvas = await html2canvas(graphRef.current);

      await new Promise(res => canvas.toBlob(b => { saveAs(b, 'analysis.png'); res(); }));

      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [canvas.width, canvas.height],
      });
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0);
      pdf.save('analysis.pdf');
    } catch (err) {
      console.error(err);
      alert('Export failed – see console for details.');
    }
  };

  return (
    <div style={{ padding: 20, maxWidth: 650, margin: '0 auto' }}>
      <h2>📊 Analyze Sensor Correlation</h2>

      <label>Select 3 Streams:</label>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 10 }}>
        {streams.map((s, i) => (
          <label key={s} htmlFor={`stream-${i}`}>
            <input
              id={`stream-${i}`}
              type="checkbox"
              checked={selectedStreams.includes(s)}
              onChange={() =>
                setSelectedStreams((prev) =>
                  prev.includes(s) ? prev.filter((p) => p !== s) : [...prev, s]
                )
              }
            />
            {s}
          </label>
        ))}
      </div>

      <div>
        <label htmlFor="startTime">Start Time:</label>{' '}
        <input id="startTime" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
      </div>
      <div>
        <label htmlFor="endTime">End Time:</label>{' '}
        <input id="endTime" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
      </div>
      <div>
        <label htmlFor="expectedCorrelation">Expected Correlation (0–1):</label>{' '}
        <input
          id="expectedCorrelation"
          type="number"
          step="0.1"
          min="0"
          max="1"
          value={expectedCorrelation}
          onChange={(e) => setExpectedCorrelation(e.target.value)}
        />
      </div>

      <div style={{ marginTop: 15, display: 'flex', gap: 10 }}>
        <button onClick={analyze}>🔍 Analyze</button>
        <button onClick={exportAll} disabled={!result}>⬇️ Export</button>
      </div>

      <div
        ref={graphRef}
        style={{ marginTop: 20, padding: 10, background: '#f7f7f7' }}
      >
        {result && (
          <div style={{ marginBottom: 20 }}>
            <strong>Result:</strong>
            <pre>{JSON.stringify(result, null, 2)}</pre>
          </div>
        )}

        <RealTimeGraph selectedStreams={selectedStreams} />
      </div>
    </div>
  );
};

export default AnalyzePanel;

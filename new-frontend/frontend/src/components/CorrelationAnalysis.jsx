import { useMemo } from 'react';
import ScatterPlot from './ScatterPlot.jsx';
import { calculateCorrelation } from '../utils/correlationUtils.js';

const getRelationship = (value) => {
  const magnitude = Math.abs(value);

  if (magnitude >= 0.7) return `Strong ${value < 0 ? 'negative' : 'positive'} relationship`;
  if (magnitude >= 0.3) return `Moderate ${value < 0 ? 'negative' : 'positive'} relationship`;
  return 'Weak relationship';
};

const getCorrelationResult = (data, streams) => {
  if (streams.length < 2) return null;

  const candidates = [];

  for (let index = 0; index < streams.length - 1; index += 1) {
    for (let comparisonIndex = index + 1; comparisonIndex < streams.length; comparisonIndex += 1) {
      const xStream = streams[index];
      const yStream = streams[comparisonIndex];
      const pairedData = data
        .map((entry) => ({
          [xStream]: Number(entry[xStream]),
          [yStream]: Number(entry[yStream]),
        }))
        .filter((entry) => Number.isFinite(entry[xStream]) && Number.isFinite(entry[yStream]));

      if (pairedData.length < 2) continue;

      const correlation = calculateCorrelation(
        pairedData.map((entry) => entry[xStream]),
        pairedData.map((entry) => entry[yStream]),
      );

      if (Number.isFinite(correlation)) {
        candidates.push({ xStream, yStream, pairedData, correlation });
      }
    }
  }

  if (candidates.length === 0) return null;

  return candidates.reduce((best, candidate) => (
    Math.abs(candidate.correlation) > Math.abs(best.correlation) ? candidate : best
  ));
};

const CorrelationAnalysis = ({ data, selectedStreams }) => {
  const result = useMemo(
    () => getCorrelationResult(data, selectedStreams),
    [data, selectedStreams],
  );

  if (selectedStreams.length < 2) {
    return (
      <p className="chart-empty-state">
        Select two or more streams to view correlation analysis.
      </p>
    );
  }

  if (!result) {
    return (
      <p className="chart-empty-state">
        Correlation cannot be calculated because the selected streams need at least two paired readings with variation.
      </p>
    );
  }

  const relationship = getRelationship(result.correlation);
  const directionClass = result.correlation < 0 ? 'negative' : 'positive';

  return (
    <div className="correlation-content">
      <div className="correlation-summary" aria-live="polite">
        <span>Correlation Coefficient</span>
        <strong>{result.correlation.toFixed(2)}</strong>
        <p className={directionClass}>{relationship}</p>
        {selectedStreams.length > 2 && (
          <small>Strongest selected pair: {result.xStream} and {result.yStream}</small>
        )}
      </div>
      <ScatterPlot data={result.pairedData} streams={[result.xStream, result.yStream]} title="Scatter Plot" />
    </div>
  );
};

export default CorrelationAnalysis;

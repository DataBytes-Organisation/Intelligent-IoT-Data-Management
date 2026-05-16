import { findMostCorrelatedPair } from '../utils/correlationUtils.js';
import ScatterPlot from './ScatterPlot.jsx';
import { hasVariance } from '../utils/varianceUtils.js';

const MostCorrelatedPair = ({ data, streams }) => {
  const correlatedPair = findMostCorrelatedPair(data, streams);

  if (!correlatedPair || !correlatedPair.pair) {
    return <h3>No correlated pair found.</h3>;
  }

  const xStream = correlatedPair.pair[0];
  const yStream = correlatedPair.pair[1];

  const hasXVariance = hasVariance(data, xStream);
  const hasYVariance = hasVariance(data, yStream);

  if (!hasXVariance || !hasYVariance) {
    return <h3>No meaningful scatter plot available for this pair.</h3>;
  }

  let interpretation = 'Little or no correlation';
  let interpretationClass = 'neutral';

  if (correlatedPair.correlation >= 0.8) {
    interpretation = 'Strong positive correlation';
    interpretationClass = 'positive';
  } else if (correlatedPair.correlation >= 0.5) {
    interpretation = 'Moderate positive correlation';
    interpretationClass = 'positive';
  } else if (correlatedPair.correlation >= 0.3) {
    interpretation = 'Weak positive correlation';
    interpretationClass = 'positive';
  } else if (correlatedPair.correlation <= -0.8) {
    interpretation = 'Strong negative correlation';
    interpretationClass = 'negative';
  } else if (correlatedPair.correlation <= -0.5) {
    interpretation = 'Moderate negative correlation';
    interpretationClass = 'negative';
  } else if (correlatedPair.correlation <= -0.3) {
    interpretation = 'Weak negative correlation';
    interpretationClass = 'negative';
  }

  let explanation = 'The selected pair does not show a strong relationship.';
  if (correlatedPair.correlation >= 0.3) {
    explanation = 'This pair shows a positive relationship, so both streams tend to move in the same direction.';
  } else if (correlatedPair.correlation <= -0.3) {
    explanation = 'This pair shows a negative relationship, so one stream tends to move opposite to the other.';
  }

  return (
    <div className="correlation-result-card">
      <h3 className="correlation-heading">Most Correlated Pair in Selected Time Range</h3>

      <div className="correlation-summary-box">
        <p><strong>Selected Pair:</strong> {xStream} and {yStream}</p>

        <div className="correlation-value-box">
          <span className="correlation-label">Correlation Value</span>
          <span className="correlation-number">{correlatedPair.correlation.toFixed(2)}</span>
        </div>

        <div className={`interpretation-box ${interpretationClass}`}>
          <strong>Interpretation:</strong> {interpretation}
        </div>

        <p className="correlation-explanation">{explanation}</p>
      </div>
      
      <ScatterPlot
       data={data}
       streams={[xStream, yStream]}
       title={`Scatter Plot: ${xStream} vs ${yStream}`}
       showSummary={false}
      />
    </div>
  );
};

export default MostCorrelatedPair;
import { findMostCorrelatedPair } from '../utils/correlationUtils.js'
import ScatterPlot from './ScatterPlot.jsx';
import { hasVariance } from '../utils/varianceUtils.js';

const MostCorrelatedPair = ({ data, streams }) => {
  const correlatedPair = findMostCorrelatedPair(data, streams);

  const xStream = correlatedPair.pair[0];
  const yStream = correlatedPair.pair[1];

  const hasXVariance = hasVariance(data, xStream);
  const hasYVariance = hasVariance(data, yStream);

if (!hasXVariance || !hasYVariance) {
  return <h3>No meaningful scatter plot available for this pair.</h3>;
}

  console.log('Correlated Pair:', correlatedPair);

  return (
    <div>
      <h4>Scatter plot for the Most Correlated Pairs in Selected Time Range: </h4>

        <h4>{correlatedPair.pair[0]} & {correlatedPair.pair[1]} ||
           Correlation: {correlatedPair.correlation.toFixed(2)}</h4>

        <ScatterPlot data={data} title={`Scatter Plot of the Most Correlated Pair: ${xStream} vs ${yStream}`} streams={[xStream, yStream]} />

    </div>
  );
};

export default MostCorrelatedPair;
import { findMostCorrelatedPair } from "../utils/correlationUtils.js";
import ScatterPlot from "./ScatterPlot.jsx";
import { hasVariance } from "../utils/varianceUtils.js";

const MostCorrelatedPair = ({ data, streams }) => {
  const findMostCorrelatedPair = (data, streams) => {
    if (streams.length < 2) return null;

    // Mock implementation - replace with your actual correlation calculation
    return {
      pair: [streams[0], streams[1]],
      correlation: 0.75, // Mock correlation value
    };
  };

  const hasVariance = (data, stream) => {
    const values = data
      .map((d) => parseFloat(d[stream]))
      .filter((v) => !isNaN(v));
    if (values.length < 2) return false;
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance =
      values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
    return variance > 0.001; // Small threshold for variance
  };

  if (!data || data.length === 0 || streams.length < 2) {
    return (
      <div className="bg-white rounded-lg border border-gray-300 p-6 mt-4">
        <h4 className="text-lg font-semibold text-gray-800 mb-4">
          Most Correlated Pair
        </h4>
        <p className="text-gray-500">
          Select at least 2 streams to see correlations
        </p>
      </div>
    );
  }

  const correlatedPair = findMostCorrelatedPair(data, streams);

  if (!correlatedPair) {
    return (
      <div className="bg-white rounded-lg border border-gray-300 p-6 mt-4">
        <h4 className="text-lg font-semibold text-gray-800 mb-4">
          Most Correlated Pair
        </h4>
        <p className="text-gray-500">No correlation data available</p>
      </div>
    );
  }

  const xStream = correlatedPair.pair[0];
  const yStream = correlatedPair.pair[1];

  const hasXVariance = hasVariance(data, xStream);
  const hasYVariance = hasVariance(data, yStream);

  if (!hasXVariance || !hasYVariance) {
    return (
      <div className="bg-white rounded-lg border border-gray-300 p-6 mt-4">
        <h4 className="text-lg font-semibold text-gray-800 mb-4">
          Most Correlated Pair
        </h4>
        <h3 className="text-gray-600">
          No meaningful scatter plot available for this pair.
        </h3>
      </div>
    );
  }

  return (
    <div className="mt-4">
      <div className="bg-white rounded-lg border border-gray-300 p-6">
        <h4 className="text-lg font-semibold text-gray-800 mb-4">
          Scatter plot for the Most Correlated Pairs in Selected Time Range:
        </h4>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <h4 className="text-blue-800 font-semibold">
            {correlatedPair.pair[0]} & {correlatedPair.pair[1]} || Correlation:{" "}
            {correlatedPair.correlation.toFixed(2)}
          </h4>
        </div>
      </div>

      <ScatterPlot
        data={data}
        title={`Scatter Plot of the Most Correlated Pair: ${xStream} vs ${yStream}`}
        streams={[xStream, yStream]}
      />
    </div>
  );
};

export default MostCorrelatedPair;

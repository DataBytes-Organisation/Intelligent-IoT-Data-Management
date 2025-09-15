import { findMostCorrelatedPair } from "../utils/correlationUtils.js";

const MostCorrelatedPair = ({ data, streams }) => {
  const correlatedPair = findMostCorrelatedPair(data, streams);
  console.log("Correlated Pair:", correlatedPair);

  return (
    <div className=" p-6 max-w-sm w-full mx-auto">
      <h3 className="text-xl font-semibold text-gray-800 mb-4 border-b pb-2">
        Most Correlated Pairs
      </h3>
      <ul className="space-y-2 text-gray-700">
        <li className="flex justify-between">
          <span>Pair:</span>
          <span className="font-medium">
            {correlatedPair.pair[0]} & {correlatedPair.pair[1]}
          </span>
        </li>
        <li className="flex justify-between">
          <span>Correlation:</span>
          <span className="font-medium">
            {correlatedPair.correlation.toFixed(2)}
          </span>
        </li>
      </ul>
    </div>
  );
};

export default MostCorrelatedPair;

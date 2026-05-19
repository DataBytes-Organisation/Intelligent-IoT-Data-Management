// components/StreamSelector.jsx
import { useStreamNames } from "../hooks/useStreamNames";

const StreamSelector = ({ data, selectedStreams, setSelectedStreams }) => {
  const streamNames = useStreamNames(data);

  const handleStreamToggle = (streamId) => {
    if (selectedStreams.includes(streamId)) {
      setSelectedStreams(selectedStreams.filter((id) => id !== streamId));
    } else {
      setSelectedStreams([...selectedStreams, streamId]);
    }
  };

  if (!streamNames || streamNames.length === 0) {
    return <p>No streams available</p>;
  }

  return (
    <div>
      <h3 className="text-gray-800 font-semibold mb-3">Select Stream:</h3>
      <div className="grid grid-cols-2 gap-3 max-h-48 overflow-y-auto">
        {streamNames.map((stream) => (
          <label
            key={stream.id}
            className="flex items-center space-x-3 cursor-pointer"
          >
            <input
              type="checkbox"
              checked={selectedStreams.includes(stream.id)}
              onChange={() => handleStreamToggle(stream.id)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
            />
            <span className="text-gray-700">{stream.name}</span>
          </label>
        ))}
      </div>
      <div className="mt-3 text-xs text-gray-500">
        {selectedStreams.length} stream(s) selected
      </div>
    </div>
  );
};

export default StreamSelector;

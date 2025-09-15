// components/StreamSelector.jsx
import { useStreamNames } from "../hooks/useStreamNames";
import { FilterIcon } from "lucide-react";

const StreamSelector = ({ data, selectedStreams, setSelectedStreams }) => {
  const streamNames = useStreamNames(data);

  if (!streamNames || streamNames.length === 0) {
    return <p>No streams available</p>;
  }

  const handleStreamToggle = (streamId) => {
    if (selectedStreams.includes(streamId)) {
      // Remove stream if already selected
      setSelectedStreams(selectedStreams.filter((id) => id !== streamId));
    } else {
      // Add stream if not selected
      setSelectedStreams([...selectedStreams, streamId]);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-5 h-full flex flex-col">
      <div className="flex items-center mb-4 text-blue-700">
        <FilterIcon className="h-5 w-5 mr-2" />
        <h3 className="text-lg font-medium">Select Streams</h3>
      </div>
      <div className="flex-1">
        <p className="text-sm text-gray-600 mb-3 text-left">
          Choose one or more streams to analyze
        </p>
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-2 gap-2">
            {streamNames.map((stream) => (
              <label
                key={stream.id}
                className="flex items-center space-x-2 p-2 rounded-md hover:bg-gray-50 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedStreams.includes(stream.id)}
                  onChange={() => handleStreamToggle(stream.id)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded bg-white"
                />
                <span className="text-sm text-gray-700 truncate">
                  {stream.name}
                </span>
              </label>
            ))}
          </div>
        </div>
        {selectedStreams.length > 0 && (
          <div className="mt-3 text-xs text-gray-500">
            {selectedStreams.length} stream(s) selected
          </div>
        )}
      </div>
    </div>
  );
};

export default StreamSelector;

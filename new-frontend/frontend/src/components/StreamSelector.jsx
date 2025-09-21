// components/StreamSelector.jsx
import { useStreamNames } from "../hooks/useStreamNames";

const StreamSelector = ({ data, selectedStreams, setSelectedStreams }) => {
  const streamNames = useStreamNames(data);

  if (!streamNames || streamNames.length === 0) {
    return <p>No streams available</p>;
  }

  return (
    <div>
      <label>
        <h3>Select Stream:</h3>

        <select
          multiple
          value={selectedStreams}
          onChange={(e) => {
            const selected = Array.from(
              e.target.selectedOptions,
              (option) => option.value
            );
            setSelectedStreams(selected);
            console.log("Selected streams:", selected);
          }}
        >
          {streamNames.map((stream) => (
            <option key={stream.id} value={stream.id}>
              {stream.name}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
};

export default StreamSelector;

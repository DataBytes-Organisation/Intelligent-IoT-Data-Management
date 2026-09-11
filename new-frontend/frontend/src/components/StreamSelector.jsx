import { useState, useRef, useEffect } from "react";
import "./StreamSelector.css";

const STREAM_LABELS = {
  field1: "eCO2",
  field2: "eTVOC",
  field3: "Temperature",
  field4: "Air Pressure",
  field5: "Humidity",
  field6: "Secondary Temperature",
  field7: "Controller Temperature",
  field8: "Conductance",
};

/**
 * StreamDropdownSelector Component
 * --------------------------------
 * A reusable multi-select dropdown component for choosing streams.
 * 
 * Features:
 * - Displays a compact dropdown button showing the number of selected streams.
 * - Opens a vertical list of checkboxes for multi-selection.
 * - Closes automatically when clicking outside the dropdown.
 * - Updates the selectedStreams state in the parent component.
 */
const StreamDropdownSelector = ({ streams, selectedStreams, setSelectedStreams }) => {

  // Controls whether the dropdown menu is open or closed
  const [open, setOpen] = useState(false);

  // Reference to the dropdown container (used for click‑outside detection)
  const dropdownRef = useRef(null);

  /**
   * toggleStream()
   * --------------
   * Adds or removes a stream from the selectedStreams array.
   * This function is triggered when a checkbox is clicked.
   */
  const toggleStream = (stream) => {
    if (selectedStreams.includes(stream)) {
      // Remove stream if already selected
      setSelectedStreams(selectedStreams.filter(s => s !== stream));
    } else {
      // Add stream if not selected
      setSelectedStreams([...selectedStreams, stream]);
    }
  };

    // Select All / Deselect All
  const toggleSelectAll = () => {
    if (selectedStreams.length === streams.length) {
      // All selected → deselect all
      setSelectedStreams([]);
    } else {
      // Not all selected → select all
      setSelectedStreams([...streams]);
    }
  };

  /**
   * useEffect() — Click Outside to Close Dropdown
   * ---------------------------------------------
   * Adds a global event listener that checks if the user clicks
   * outside the dropdown container. If so, the dropdown closes.
   * 
   * This improves UX by preventing the dropdown from blocking
   * other UI elements (charts, selectors, etc.).
   */
  useEffect(() => {
    const handleClickOutside = (event) => {
      // If click is outside the dropdown container → close menu
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    // Cleanup listener when component unmounts
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

    // Determine Select All checkbox state
    const allSelected = selectedStreams.length === streams.length;
    const noneSelected = selectedStreams.length === 0;
    const isIndeterminate = !allSelected && !noneSelected;

  return (
    // Wrapper div with ref for click‑outside detection
    <div className="stream-dropdown" ref={dropdownRef}>

      {/* Dropdown button showing number of selected streams */}
      <button className="dropdown-button" onClick={() => setOpen(!open)}>
        Select Streams ({selectedStreams.length})
      </button>

      {/* Dropdown menu — only rendered when open */}
      {open && (
        <div className="dropdown-menu">

          {/* Select All Option */}
          <label className="dropdown-item select-all-item">
            <input
              type="checkbox"
              checked={allSelected}
              ref={(el) => {
                if (el) el.indeterminate = isIndeterminate;
              }}
              onChange={toggleSelectAll}
            />
            Select All
          </label>

          <hr className="dropdown-divider" />

          {/* Individual Streams */}
          {streams.map((stream) => (
            <label key={stream} className="dropdown-item">

              {/* Checkbox for each stream */}
              <input
                type="checkbox"
                checked={selectedStreams.includes(stream)}
                onChange={() => toggleStream(stream)}
              />

              {/* Stream name */}
              {STREAM_LABELS[stream] || stream}
            </label>
          ))}
        </div>
      )}
    </div>
  );
};

export default StreamDropdownSelector;

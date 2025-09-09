import React from 'react';

export default function StreamSelector({
  streams = [],              // e.g. ["field1","field2","field3", ...]
  selectedStreams = [],      // e.g. ["field1","field3"]
  setSelectedStreams,
  label = 'Select Streams'
}) {
  const onChange = (e) => {
    const selected = Array.from(e.target.selectedOptions, opt => opt.value);
    setSelectedStreams(selected);
    console.log('Selected streams:', selected);
  };

  if (!streams || streams.length === 0) {
    return (
      <div>
        <h3>{label}</h3>
        <p>No streams available</p>
      </div>
    );
  }

  return (
    <div>
      <h3>{label}</h3>
      <select
        multiple
        size={Math.min(streams.length, 8)}  // show up to 8 rows before scroll
        value={selectedStreams}
        onChange={onChange}
        style={{ width: '100%', minHeight: 140 }}
        aria-label={label}
      >
        {streams.map(name => (
          <option key={name} value={name}>{name}</option>
        ))}
      </select>
      <div style={{ fontSize: 12, color: '#666', marginTop: 6 }}>
        Hold <b>Ctrl</b> (Windows/Linux) or <b>Cmd</b> (Mac) to select multiple.
      </div>
    </div>
  );
}

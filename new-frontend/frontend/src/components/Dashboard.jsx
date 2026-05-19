import React, { useState } from "react";
import { useSensorData } from "../hooks/useSensorData.js";
import { useFilteredData } from "../hooks/useFilteredData.js";
import { useStreamNames } from "../hooks/useStreamNames.js";
import { useTimeRange } from "../hooks/useTimeRange.js";
import TimeSelector from "./TimeSelector.jsx";
import StreamSelector from "./StreamSelector.jsx";
import IntervalSelector from "./IntervalSelector.jsx";
import StreamStats from "./StreamStats.jsx";
import "./Dashboard.css";
import Chart from "./Chart.jsx";
import MostCorrelatedPair from "./MostCorrelatedPair.jsx";
import ScatterPlot from "./ScatterPlot.jsx";

const Dashboard = () => {
  const { data, loading, error } = useSensorData(true); // mock mode
  const streamNames = useStreamNames(data);
  const [startTime, endTime] = useTimeRange(data);
  const timeOptions = useTimeRange(data);
  const [selectedTimeStart, setSelectedTimeStart] = useState("");
  const [selectedTimeEnd, setSelectedTimeEnd] = useState("");
  //const correlation = useCorrelationMatrix(data, streamNames, startTime, endTime);
  const [selectedStreams, setSelectedStreams] = useState([]);

  const intervals = ["5min", "15min", "1h", "6h"];

  const [selectedInterval, setSelectedInterval] = useState(intervals[0]);

  const filteredData = useFilteredData(data, {
    startTime: selectedTimeStart,
    endTime: selectedTimeEnd,
    selectedStreams,
    interval: selectedInterval,
  });

  const streamCount = selectedStreams.length;

  const handleSubmit = () => {
    console.log(
      "Selected Time Range:",
      selectedTimeStart,
      "→",
      selectedTimeEnd
    );

    console.log("selectedInterval:", selectedInterval);
    // You can filter data, send to backend, or trigger chart updates

    console.log("Filtered Data:", filteredData);
  };

  if (loading) return <p>Loading dataset...</p>;
  if (error) return <p>Error loading data</p>;

  return (
    <div>
      <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6 mb-6">
        <h3 className="text-blue-800 font-semibold mb-3">Note:</h3>
        <div className="text-blue-700 space-y-2 text-sm leading-relaxed">
          <p>Select at least one stream to view the line chart.</p>
          <p>
            Select two streams to see their scatter plot with a trendline, their
            correlation coefficient, and a rolling correlation line plot in the
            time interval using the selected time-window.
          </p>
          <p>
            Select at least three streams and a time range, to see which two
            streams are the most correlated in the selected time range, their
            scatter plot with a trendline.
          </p>
          <p>
            If no scatter plot is shown, it means there is not enough variance
            in the data during the selected time range.
          </p>
          <p>
            If no rolling correlation line is shown, it means there is not
            enough variance in the data during the selected time range.
          </p>
          <p>
            If no meaningful scatter plot is available for the most correlated
            pair, it means one or both streams lack variance in the selected
            time range.
          </p>
          <p>If no time range is selected, the entire dataset is used.</p>
          <p className="font-medium">
            Total Data Points in Dataset: 775 | Data Points in Selected Range:
            775
          </p>
        </div>
      </div>
      <div className="dashboard-container">
        <div className="bg-gray-200 border-2 border-gray-300 rounded-lg p-4 mb-8">
          <span className="text-gray-700 font-medium">
            Streams: {streamNames.map((s) => s.name).join(", ")}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Stream Selection */}
          <div className="bg-white rounded-lg border border-gray-300 p-6">
            <StreamSelector
              data={data}
              selectedStreams={selectedStreams}
              setSelectedStreams={setSelectedStreams}
            />
          </div>

          {/* Interval Selection */}
          <div className="bg-white rounded-lg border border-gray-300 p-6">
            <IntervalSelector
              intervals={intervals}
              selectedInterval={selectedInterval}
              setSelectedInterval={setSelectedInterval}
            />
          </div>

          {/* Time Range Selection */}
          <div className="bg-white rounded-lg border border-gray-300 p-6">
            <h3 className="text-gray-800 font-semibold mb-4">
              Time Range Selection
            </h3>
            <div className="space-y-4">
              <TimeSelector
                label="Start Time"
                timeOptions={timeOptions}
                selectedTime={selectedTimeStart}
                setSelectedTime={setSelectedTimeStart}
              />
              <TimeSelector
                label="End Time"
                timeOptions={timeOptions}
                selectedTime={selectedTimeEnd}
                setSelectedTime={setSelectedTimeEnd}
              />
              <button
                onClick={handleSubmit}
                className="w-full bg-gray-800 hover:bg-gray-900 text-white font-medium py-2 px-4 rounded transition-colors duration-200"
              >
                Analyse Time Range
              </button>
            </div>
          </div>
        </div>

        {/* Conditional Content Based on Stream Count */}
        {streamCount === 0 && (
          <div className="text-center mb-8">
            <p className="text-blue-600 font-medium">
              Please select one or more streams to view statistics and charts.
            </p>
          </div>
        )}

        {streamCount === 1 && (
          <div className="bg-white rounded-lg border border-gray-300 p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-800">
              Selected one stream to see their scatter plot. Select another
              stream to explore correlations.
            </h3>
          </div>
        )}

        {streamCount === 2 && (
          <div className="mb-8">
            <div className="bg-white rounded-lg border border-gray-300 p-6 mb-4">
              <h4 className="text-lg font-semibold text-gray-800">
                Selected two streams to see their scatter plot and rolling
                correlation. Select one more stream to see the most correlated
                pair among the selected streams.
              </h4>
            </div>
            <ScatterPlot
              data={filteredData}
              streams={selectedStreams}
              title={`Scatter Plot of selected two streams:`}
            />
          </div>
        )}

        {streamCount > 2 && (
          <div className="mb-8">
            <div className="bg-white rounded-lg border border-gray-300 p-6 mb-4">
              <h3 className="text-lg font-semibold text-gray-800">
                Selected {streamCount} streams.
              </h3>
              <p className="text-gray-600 mt-2">
                Note: If no scatter plot is shown, it means there is not enough
                variance in the data during the selected time range.
              </p>
            </div>
            <MostCorrelatedPair data={filteredData} streams={selectedStreams} />
          </div>
        )}

        {/* Stream Stats */}
        {selectedStreams.length > 0 && (
          <div className="mb-8">
            <h3 className="text-xl font-bold text-gray-800 mb-6">
              Stream Statistics
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {selectedStreams.map((stream) => (
                <StreamStats key={stream} data={filteredData} stream={stream} />
              ))}
            </div>
          </div>
        )}

        {/* Chart Section */}
        <div className="mb-8">
          <Chart data={filteredData} selectedStreams={selectedStreams} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

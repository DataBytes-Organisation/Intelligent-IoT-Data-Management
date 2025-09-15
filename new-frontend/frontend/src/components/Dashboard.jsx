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
import NotificationBanner from "../common/NotificationBanner/index.jsx";
//import { useCorrelationMatrix } from '../hooks/useCorrelationMatrix.js/index.js';
import { CalendarIcon } from "lucide-react";

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

  //const [selectedTimeRange, setSelectedTimeRange] = useState(3600000); // 1 hour

  const filteredData = useFilteredData(data, {
    startTime: selectedTimeStart,
    endTime: selectedTimeEnd,
    selectedStreams,
    interval: selectedInterval,
  });

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
      <NotificationBanner message="Hello World! I just came alive with this Sensor Data Set with 7 fields!!" />
      <div className="dashboard-container">
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <h3 className="text-lg font-medium text-gray-700 mb-2 text-left">
            Available Streams
          </h3>
          <div className="flex flex-wrap gap-2">
            {streamNames.map((field) => (
              <span
                key={field.name}
                className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
              >
                {field.name}
              </span>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="h-full">
            <StreamSelector
              data={data}
              // streams={streamNames}
              selectedStreams={selectedStreams}
              setSelectedStreams={setSelectedStreams}
            />
          </div>
          <div className="h-full">
            <IntervalSelector
              intervals={intervals}
              selectedInterval={selectedInterval}
              setSelectedInterval={setSelectedInterval}
            />
          </div>

          {/* <p>Time Range: {startTime?.toISOString()} – {endTime?.toISOString()}</p>  */}
          {/* <pre>{JSON.stringify(correlation, null, 2)}</pre>
      {/* Add dropdowns, charts, etc. */}

          <div className="bg-white rounded-lg shadow-md p-5 h-full flex flex-col">
            <div className="flex items-center mb-4 text-blue-700">
              <CalendarIcon className="h-5 w-5 mr-2" />
              <h3 className="text-lg font-medium">Time Range Selection</h3>
            </div>

            <div className="card-content flex-1 flex flex-col justify-between">
              <div className="space-y-4">
                <div>
                  <TimeSelector
                    label="Start Time"
                    timeOptions={timeOptions}
                    selectedTime={selectedTimeStart}
                    setSelectedTime={setSelectedTimeStart}
                  />
                </div>
                <div>
                  <TimeSelector
                    label="End Time"
                    timeOptions={timeOptions}
                    selectedTime={selectedTimeEnd}
                    setSelectedTime={setSelectedTimeEnd}
                  />
                </div>
              </div>

              <div className="mt-6 w-full">
                <button
                  onClick={handleSubmit}
                  className="w-full bg-black text-white py-2 px-4 rounded-md hover:bg-gray-800 transition-colors"
                >
                  Analyse Time Range
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Row with Stream Stats and Most Correlated Pair (before chart) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-medium text-gray-700 mb-4">
              Stream Stats (Selected)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {selectedStreams.length > 0 ? (
                selectedStreams.map((stream) => (
                  <StreamStats
                    key={stream}
                    data={filteredData}
                    stream={stream}
                  />
                ))
              ) : (
                <div className="text-gray-500">No streams selected</div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-medium text-gray-700 mb-4">
              Most Correlated Pair (Selected Streams)
            </h3>
            {selectedStreams.length >= 2 ? (
              <MostCorrelatedPair
                data={filteredData}
                streams={selectedStreams}
              />
            ) : (
              <div className="text-gray-500">Select at least two streams</div>
            )}
          </div>
        </div>

        <div className="chart-container bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-medium text-gray-700 mb-4">
            Data Visualization
          </h3>
          <Chart data={filteredData} selectedStreams={selectedStreams} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

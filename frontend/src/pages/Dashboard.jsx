import React, { useState } from 'react';
import { Chart as ChartJS, LineElement, BarElement, CategoryScale, LinearScale, PointElement, ArcElement, Tooltip, Legend } from 'chart.js';
import { Line, Bar, Pie } from 'react-chartjs-2'; 
import './dashboard.css'; 

// Register chart components for use in the dashboard
ChartJS.register(LineElement, BarElement, CategoryScale, LinearScale, PointElement, ArcElement, Tooltip, Legend);

const Dashboard = () => {
  // State to hold the widgets, initially empty
  const [widgets, setWidgets] = useState([]);
  
  // State to track the selected chart type for new widgets
  const [selectedType, setSelectedType] = useState('line');

  // Date  format (DD/MM/YYYY HH:mm:ss)
  const formatDate = (date) => {
    const options = { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' };
    return new Intl.DateTimeFormat('en-AU', options).format(new Date(date));
  };

  // Add a new widget
  const addWidget = () => {
    const id = `widget-${Date.now()}`; 
    setWidgets(prev => [...prev, {  // Add the new widget to the list
      id,
      name: `Widget ${prev.length + 1}`, 
      time: formatDate(new Date()), // Set the time when the widget is created
      chartType: selectedType, // Set the type of chart (line, bar, pie)
    }]);
  };

  // Remove a widget based on its id
  const removeWidget = (id) => {
    setWidgets(widgets.filter(w => w.id !== id)); // Filter out the widget with the matching id
  };

  // Update the widget's name
  const updateWidgetName = (id, name) => {
    setWidgets(prev => prev.map(w => w.id === id ? { ...w, name } : w)); // Update the name of the widget with the given id
  };

  // Update the widget's chart type (Line, Bar, Pie)
  const updateWidgetType = (id, type) => {
    setWidgets(prev => prev.map(w => w.id === id ? { ...w, chartType: type } : w)); // Update the chart type for the widget
  };

  // Render the chart based on the selected type (Line, Bar, Pie)
  const renderChart = (type) => {
    // Placeholder data for empty charts
    const emptyData = {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
      datasets: [{
        label: 'No Data Available',
        data: [null, null, null, null, null], // Empty data for now
        backgroundColor: 'rgba(59, 130, 246, 0.4)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 2,
        tension: 0.4,
      }]
    };

    const options = {
      responsive: true, // Ensure the chart resizes correctly
      maintainAspectRatio: false, // Allow the chart to scale
      plugins: {
        legend: { display: false } // Hide the legend
      }
    };

    // Return the appropriate chart based on the selected type
    if (type === 'bar') return <Bar data={emptyData} options={options} />;
    if (type === 'pie') return <Pie data={emptyData} options={options} />;
    return <Line data={emptyData} options={options} />; // Default to Line chart
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      {/* Header section */}
      <header className="bg-white shadow rounded-xl p-6 mb-6 flex flex-col sm:flex-row sm:justify-between items-center">
        <div className="w-full text-center">
          <h1 className="dashboard-title">📊 Smart IoT Dashboard</h1>
        </div>
        <div className="flex items-center gap-4 mt-4 sm:mt-0">
          {/* Dropdown to select chart type */}
          <select
            className="bg-transparent text-gray-800 focus:outline-none cursor-pointer"
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)} // Update the selected chart type
          >
            <option value="line">Line</option>
            <option value="bar">Bar</option>
            <option value="pie">Pie</option>
          </select>
          {/* Button to add a new widget */}
          <button
            onClick={addWidget}
            className="bg-green-500 text-white text-xl font-semibold px-4 py-2 rounded-full hover:bg-green-600 focus:outline-none"
          >
            +
          </button>
        </div>
      </header>

      {/* Widget section, where widgets are displayed */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {widgets.map(widget => (
          <div key={widget.id} className="widget-card">
            {/* Button to remove the widget */}
            <button
              onClick={() => removeWidget(widget.id)}
              className="remove-btn"
            >
              ✕
            </button>

            {/* Input field for widget name */}
            <input
              type="text"
              value={widget.name}
              onChange={(e) => updateWidgetName(widget.id, e.target.value)}
              className="widget-input"
            />

            {/* Display the creation time of the widget */}
            <p className="text-sm text-gray-400 mb-2">{widget.time}</p>

            {/* Dropdown to change the chart type for this widget */}
            <select
              value={widget.chartType}
              onChange={(e) => updateWidgetType(widget.id, e.target.value)}
              className="widget-input"
            >
              <option value="line">Line</option>
              <option value="bar">Bar</option>
              <option value="pie">Pie</option>
            </select>

            {/* Render the chart based on selected type */}
            <div className="h-48">
              {renderChart(widget.chartType)}
            </div>
          </div>
        ))}
      </section>

      {/* Message displayed if no widgets are added */}
      {widgets.length === 0 && (
        <p className="text-center text-gray-400 mt-10 text-lg">No widgets added. Click "+" to begin.</p>
      )}
    </div>
  );
};

export default Dashboard;

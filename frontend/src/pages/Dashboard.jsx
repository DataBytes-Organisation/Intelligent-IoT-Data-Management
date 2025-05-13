import React, { useState } from 'react';
import { Line, Bar, Pie } from 'react-chartjs-2';
import { Chart as ChartJS, LineElement, BarElement, CategoryScale, LinearScale, PointElement, ArcElement, Tooltip, Legend } from 'chart.js';
import './dashboard.css';

// Register Chart.js components
ChartJS.register(LineElement, BarElement, CategoryScale, LinearScale, PointElement, ArcElement, Tooltip, Legend);

const Dashboard = () => {
  // All widget-related state
  const [widgets, setWidgets] = useState([]);
  const [showCreationDate, setShowCreationDate] = useState({});
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [widgetToDelete, setWidgetToDelete] = useState(null);
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [widgetName, setWidgetName] = useState('');
  const [newWidgetType, setNewWidgetType] = useState('line');
  const [collapsedWidgets, setCollapsedWidgets] = useState({});

  // Format creation date
  const formatDate = (date) => {
    const options = { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' };
    return new Intl.DateTimeFormat('en-AU', options).format(new Date(date));
  };

  // Add new widget
  const addWidget = () => {
    const id = `widget-${Date.now()}`;
    setWidgets(prev => [...prev, {
      id,
      name: widgetName || `Widget ${prev.length + 1}`,
      time: formatDate(new Date()),
      chartType: newWidgetType,
    }]);
    setIsCreateModalVisible(false);
    setWidgetName('');
    setNewWidgetType('line');
  };

  // Cancel widget creation
  const cancelWidget = () => {
    setIsCreateModalVisible(false);
    setWidgetName('');
    setNewWidgetType('line');
  };

  // Open delete modal
  const confirmDelete = (id) => {
    setShowConfirmation(true);
    setWidgetToDelete(id);
  };

  // Cancel deletion
  const cancelDelete = () => {
    setShowConfirmation(false);
    setWidgetToDelete(null);
  };

  // Delete widget
  const deleteWidget = () => {
    if (widgetToDelete) {
      setWidgets(widgets.filter(w => w.id !== widgetToDelete));
      setShowConfirmation(false);
      setWidgetToDelete(null);
    }
  };

  // Update widget name
  const updateWidgetName = (id, name) => {
    setWidgets(prev => prev.map(w => w.id === id ? { ...w, name } : w));
  };

  // Update chart type
  const updateWidgetType = (id, type) => {
    setWidgets(prev => prev.map(w => w.id === id ? { ...w, chartType: type } : w));
  };

  // Toggle creation time
  const toggleCreationDate = (id) => {
    setShowCreationDate(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Toggle chart collapse
  const toggleCollapse = (id) => {
    setCollapsedWidgets(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Render chart with "No data" overlay
  const renderChart = (type) => {
    const emptyData = {
      labels: ['Data1', 'Data2', 'Data3', 'Data4', 'Data5'],
      datasets: [{
        label: 'No Data Available',
        data: [null, null, null, null, null],
        backgroundColor: 'rgba(59, 130, 246, 0.4)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 2,
        tension: 0.4,
      }]
    };

    const options = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { enabled: false },
      },
    };

    const NoDataPlugin = {
      id: 'noData',
      beforeDraw: (chart) => {
        const { ctx, width, height } = chart;
        const datasets = chart.data.datasets;
        const allEmpty = datasets.every(ds => !ds.data || ds.data.every(d => d == null));
        if (allEmpty) {
          ctx.save();
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.font = '20px Arial';
          ctx.fillStyle = '#999';
          ctx.fillText('No data', width / 2, height / 2);
          ctx.restore();
        }
      }
    };

    const chartProps = { data: emptyData, options, plugins: [NoDataPlugin] };

    if (type === 'bar') return <Bar {...chartProps} />;
    if (type === 'pie') return <Pie {...chartProps} />;
    return <Line {...chartProps} />;
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      {/* Delete modal */}
      {showConfirmation && (
        <div className="confirmation-modal">
          <div className="confirmation-content">
            <p>Are you sure you want to delete this widget?</p>
            <button onClick={deleteWidget} className="confirmation-btn confirm">Confirm</button>
            <button onClick={cancelDelete} className="confirmation-btn cancel">Cancel</button>
          </div>
        </div>
      )}

      {/* Create modal */}
      {isCreateModalVisible && (
        <div className="create-widget-modal">
          <div className="modal-content">
            <p>Enter widget name:</p>
            <input
              type="text"
              value={widgetName}
              onChange={(e) => setWidgetName(e.target.value)}
              className="widget-input"
            />
            <p>Select chart type:</p>
            <select
              value={newWidgetType}
              onChange={(e) => setNewWidgetType(e.target.value)}
              className="widget-input"
            >
              <option value="line">Line</option>
              <option value="bar">Bar</option>
              <option value="pie">Pie</option>
            </select>
            <div className="modal-buttons">
              <button onClick={addWidget} className="modal-btn confirm">Confirm</button>
              <button onClick={cancelWidget} className="modal-btn cancel">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-white shadow rounded-xl p-6 mb-6 flex flex-col sm:flex-row sm:justify-between items-center">
        <div className="w-full text-center">
          <h1 className="dashboard-title">📊 IoT Dashboard</h1>
        </div>
        <div className="flex items-center gap-4 mt-4 sm:mt-0">
          <button
            onClick={() => setIsCreateModalVisible(true)}
            className="bg-green-500 text-white text-xl font-semibold px-4 py-2 rounded-full hover:bg-green-600 focus:outline-none"
          >
            +
          </button>
        </div>
      </header>

      {/* Widget list */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6">
        {widgets.map(widget => (
          <div key={widget.id} className="widget-card">
            {/* Delete button */}
            <button onClick={() => confirmDelete(widget.id)} className="remove-btn">✕</button>

            {/* Name and type editor */}
            <div className="widget-input-container">
              <input
                type="text"
                value={widget.name}
                onChange={(e) => updateWidgetName(widget.id, e.target.value)}
                className="widget-input"
              />
              <select
                value={widget.chartType}
                onChange={(e) => updateWidgetType(widget.id, e.target.value)}
                className="widget-input"
              >
                <option value="line">Line</option>
                <option value="bar">Bar</option>
                <option value="pie">Pie</option>
              </select>
            </div>

            {/* More Info toggle */}
            <button onClick={() => toggleCreationDate(widget.id)} className="more-info-btn">
              More Information
            </button>

            {/* Show creation time */}
            {showCreationDate[widget.id] && (
              <p className="text-sm text-gray-400 mb-2">
                <strong>Creation Time:</strong> {widget.time}
              </p>
            )}

            {/* Collapse chart toggle */}
            <button onClick={() => toggleCollapse(widget.id)} className="collapse-btn">
              {collapsedWidgets[widget.id] ? 'Show Chart 🔼' : 'Hide Chart 🔽'}
            </button>

            {/* Render chart unless collapsed */}
            {!collapsedWidgets[widget.id] && (
              <div className="h-48">
                {renderChart(widget.chartType)}
              </div>
            )}
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

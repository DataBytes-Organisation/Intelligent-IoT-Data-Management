import React, { useState, useEffect } from 'react';
import { Line, Bar, Pie } from 'react-chartjs-2';
import { ThreeDots } from 'react-loader-spinner';
import './App.css';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, BarElement, ArcElement } from 'chart.js';

// Register Chart.js components including ArcElement for Pie charts
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, BarElement, ArcElement);

function App() {
  const [selectedData, setSelectedData] = useState('');
  const [selectedGraph, setSelectedGraph] = useState('');
  const [loading, setLoading] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);  // State for dark mode

  const features = [
    { title: 'Advanced Data Analytics', description: 'Transform your raw data into actionable insights with advanced algorithms and visualization tools.' },
    { title: 'Real-time Graphs & Visualizations', description: 'Instantly visualize your data with real-time, interactive graphs and charts.' },
    { title: 'Seamless Data Integration', description: 'Integrate with multiple data sources for smooth syncing and analysis.' },
    { title: 'Customizable Dashboards', description: 'Create personalized dashboards to track KPIs and monitor data trends.' },
  ];

  const [graphData, setGraphData] = useState({
    labels: ['January', 'February', 'March', 'April', 'May', 'June', 'July'],
    datasets: [
      {
        label: 'Sales',
        data: [33, 53, 85, 41, 44, 65, 78],
        borderColor: 'rgba(75, 192, 192, 1)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.4,
      },
    ],
  });

  useEffect(() => {
    if (selectedData && selectedGraph) {
      setLoading(true);
      setTimeout(() => {
        setLoading(false); // Simulating data fetch
      }, 2000);
    }
  }, [selectedData, selectedGraph]);

  useEffect(() => {
    // Get the theme from localStorage on load and set the state accordingly
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      setIsDarkMode(savedTheme === 'dark');
    }
  }, []);

  useEffect(() => {
    // Whenever the theme changes, save the theme to localStorage
    if (isDarkMode) {
      document.body.classList.add('dark-mode');
      document.body.classList.remove('light-mode');
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.classList.add('light-mode');
      document.body.classList.remove('dark-mode');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const handleDataSelection = (e) => setSelectedData(e.target.value);
  const handleGraphSelection = (e) => setSelectedGraph(e.target.value);

  const renderGraph = () => {
    switch (selectedGraph) {
      case 'graph1': return <Bar data={graphData} />;
      case 'graph2': return <Line data={graphData} />;
      case 'graph3': return <Pie data={graphData} />;
      default: return null;
    }
  };

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);  // Toggle dark mode
  };

  return (
    <div className={`app-container ${isDarkMode ? 'dark-mode' : ''}`}>
      {/* Top Navigation Bar */}
      <header className="top-nav">
        <div className="nav-links">
          <a href="#home">Home</a>
          <a href="#features">Features</a>
          <a href="#data-selection">Data Selection</a>
          <a href="#graphs">Graphs</a>
        </div>
        <button onClick={toggleTheme} className="theme-toggle-btn">
          {isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        </button>
      </header>

      {/* Main Content Section */}
      <div className="content">
        {/* Home Section */}
        <section id="home">
          <h1>Welcome to Our Data Visualization Platform</h1>
          <p>Your Data, Our Insights. Unlock the Power of Your Information.</p>
          <a href="#data-selection" className="cta-button">Get Started</a>
        </section>

        {/* Features Section */}
        <section id="features" className="features">
          <h2>Explore Key Features</h2>
          <div className="card-container">
            {features.map((feature, index) => (
              <div key={index} className="card">
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Data Selection Section */}
        <section id="data-selection" className="data-selection">
          <h2>Select Your Data and Graph Type</h2>
          <select value={selectedData} onChange={handleDataSelection}>
            <option value="">Select Data Type</option>
            <option value="temperature">Temperature Data</option>
            <option value="humidity">Humidity Data</option>
            <option value="pressure">Pressure Data</option>
            <option value="sensor1">Sensor 1 Data</option>
            <option value="sensor2">Sensor 2 Data</option>
            <option value="synthetic">Synthetic IoT Data</option>
          </select>

          <select value={selectedGraph} onChange={handleGraphSelection}>
            <option value="">Select Graph Type</option>
            <option value="graph1">Line Graph</option>
            <option value="graph2">Bar Chart</option>
            <option value="graph3">Pie Chart</option>
          </select>

          <button onClick={() => alert('Data and Graph selection submitted')}>
            Submit Selection
          </button>
        </section>

        {/* Graphs Section */}
        <section id="graphs" className="graphs">
          <h2>Graphs & Insights</h2>
          {loading ? (
            <div className="spinner">
              <ThreeDots color="#DECBA4" height={80} width={80} />
            </div>
          ) : (
            selectedData && selectedGraph && (
              <div>
                <p>You have selected {selectedData} and {selectedGraph} for visualization.</p>
                {renderGraph()}
              </div>
            )
          )}
        </section>

        {/* Footer Section */}
        <footer>
          <p>&copy; 2025 Your Company. All Rights Reserved.</p>
        </footer>
      </div>
    </div>
  );
}

export default App;


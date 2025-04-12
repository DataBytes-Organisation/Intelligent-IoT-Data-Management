import { useState, useEffect, useRef } from 'react'
import { Line, Bar, Pie } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, BarElement, ArcElement } from 'chart.js';

// Register Chart.js components including ArcElement for Pie charts
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, BarElement, ArcElement);

const Home = () => {
    const [loading, setLoading] = useState(false);
    const [selectedData, setSelectedData] = useState('');
    const [selectedGraph, setSelectedGraph] = useState('');
    const [file, setFile] = useState(null); // File upload state
    const [isUploadVisible, setIsUploadVisible] = useState(false); // File upload visibility
    const [graphVisible, setGraphVisible] = useState(false); // Control visibility of graph on submit
    const chartRef = useRef(null);  // Reference for the chart

    const features = [
    { title: 'Advanced Data Analytics', description: 'Transform your raw data into actionable insights with advanced algorithms and visualization tools.' },
    { title: 'Real-time Graphs & Visualizations', description: 'Instantly visualize your data with real-time, interactive graphs and charts.' },
    { title: 'Seamless Data Integration', description: 'Integrate with multiple data sources for smooth syncing and analysis.' },
    { title: 'Customizable Dashboards', description: 'Create personalized dashboards to track KPIs and monitor data trends.' },
    ];

    useEffect(() => {
        if (selectedData && selectedGraph) {
          setLoading(true);
          setTimeout(() => {
            setLoading(false); // Simulating data fetch
          }, 2000);
        }
      }, [selectedData, selectedGraph]);

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
    
    const handleDataSelection = (e) => setSelectedData(e.target.value);
    const handleGraphSelection = (e) => setSelectedGraph(e.target.value);
  
    const renderGraph = () => {
      switch (selectedGraph) {
        case 'graph1': return <Bar data={graphData} ref={chartRef} />;
        case 'graph2': return <Line data={graphData} ref={chartRef} />;
        case 'graph3': return <Pie data={graphData} ref={chartRef} />;
        default: return null;
      }
    };

    const handleFileChange = (event) => {
        const uploadedFile = event.target.files[0];
        setFile(uploadedFile);
      };
    
      const handleFileUpload = () => {
        if (file) {
          // Process the file upload (this can be sending it to the backend)
          alert(`File uploaded: ${file.name}`);
        } else {
          alert("No file selected!");
        }
      };
    
      const handleUploadButtonClick = () => {
        setIsUploadVisible(true); // Show file upload input when upload button is clicked
      };
    
      const handleSubmit = () => {
        setGraphVisible(true);  // Show graph only after submit
      };
    
      const exportChart = () => {
        const chart = chartRef.current.chartInstance;  // Access the chart instance
        const imageUrl = chart.toBase64Image();  // Get base64 image of the chart
        const link = document.createElement('a');
        link.href = imageUrl;
        link.download = 'chart.png';  // Name of the downloaded file
        link.click();
      };

    return(
        <div>
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
                        <option value="graph1">Bar Graph</option>
                        <option value="graph2">Line Chart</option>
                        <option value="graph3">Pie Chart</option>
                    </select>
                
                    <button onClick={handleSubmit} style={{ marginBottom: '10px' }}>
                        Submit Selection
                    </button>
                
                    {/* Small Upload File Button */}
                    <button className="upload-file-btn" onClick={handleUploadButtonClick} style={{ marginTop: '10px' }}>
                        Upload File
                    </button>
                
                    {/* Conditionally Render Upload File Section */}
                    {isUploadVisible && (
                        <div className="data-selection">
                        <h2>Upload Your File</h2>
                        <input
                            type="file"
                            id="fileUpload"
                            className="file-upload-input"
                            onChange={handleFileChange}
                        />
                        <button onClick={handleFileUpload}>Upload</button>
                        </div>
                    )}
                </section>
            
                {/* Graphs Section */}
                <section id="graphs" className="graphs">
                <h2>Graphs & Insights</h2>
                {loading ? (
                    <div>Loading...</div>
                ) : (
                    graphVisible && selectedData && selectedGraph && (
                    <div>
                        <p>You have selected {selectedData} and {selectedGraph} for visualization.</p>
                        {renderGraph()}
                        {/* Export Button */}
                        <button onClick={exportChart} style={{ marginTop: '10px' }}>Export Chart</button>
                    </div>
                    )
                )}
                </section>
            </div>
        </div>
    )
}

export default Home
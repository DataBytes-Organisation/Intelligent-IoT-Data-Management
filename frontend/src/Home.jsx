import { useState, useEffect, useRef } from "react";
import { Line, Bar, Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  BarElement,
  ArcElement,
} from "chart.js";
import { Link } from "react-router-dom";
import { LayoutDashboard } from "lucide-react";
import { ChartNoAxesCombined } from "lucide-react";
import { ChartScatter } from "lucide-react";
import { HardDrive } from "lucide-react";
import {
  Button,
  Card,
  CardContent,
  Typography,
  Grid,
  IconButton,
  Stack,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import { useThemeContext } from "./utils/theme";
import { FileUp } from "lucide-react";
import { Download } from "lucide-react";

// Register Chart.js components including ArcElement for Pie charts
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  BarElement,
  ArcElement
);

const Home = () => {
  const [loading, setLoading] = useState(false);
  const [selectedData, setSelectedData] = useState("");
  const [selectedGraph, setSelectedGraph] = useState("");
  const [file, setFile] = useState(null); // File upload state
  const [isUploadVisible, setIsUploadVisible] = useState(false); // File upload visibility
  const [graphVisible, setGraphVisible] = useState(false); // Control visibility of graph on submit
  const chartRef = useRef(null); // Reference for the chart

  const features = [
    {
      title: "Advanced Data Analytics",
      description:
        "Transform your raw data into actionable insights with advanced algorithms and visualization tools.",
      icon: <ChartNoAxesCombined fontSize="large" />,
    },
    {
      title: "Real-time Graphs & Visualizations",
      description:
        "Instantly visualize your data with real-time, interactive graphs and charts.",
      icon: <ChartScatter fontSize="large" />,
    },
    {
      title: "Seamless Data Integration",
      description:
        "Integrate with multiple data sources for smooth syncing and analysis.",
      icon: <HardDrive fontSize="large" />,
    },
    {
      title: "Customizable Dashboards",
      description:
        "Create personalized dashboards to track KPIs and monitor data trends.",
      icon: <LayoutDashboard fontSize="large" />,
    },
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
    labels: ["January", "February", "March", "April", "May", "June", "July"],
    datasets: [
      {
        label: "Sales",
        data: [33, 53, 85, 41, 44, 65, 78],
        borderColor: "rgba(75, 192, 192, 1)",
        backgroundColor: "rgba(75, 192, 192, 0.2)",
        tension: 0.4,
      },
    ],
  });

  const handleDataSelection = (e) => setSelectedData(e.target.value);
  const handleGraphSelection = (e) => setSelectedGraph(e.target.value);

  const renderGraph = () => {
    switch (selectedGraph) {
      case "graph1":
        return <Bar data={graphData} ref={chartRef} />;
      case "graph2":
        return <Line data={graphData} ref={chartRef} />;
      case "graph3":
        return <Pie data={graphData} ref={chartRef} />;
      default:
        return null;
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
    setGraphVisible(true); // Show graph only after submit
  };

  const exportChart = () => {
    const chart = chartRef.current.chartInstance; // Access the chart instance
    const imageUrl = chart.toBase64Image(); // Get base64 image of the chart
    const link = document.createElement("a");
    link.href = imageUrl;
    link.download = "chart.png"; // Name of the downloaded file
    link.click();
  };

  const { isDarkMode } = useThemeContext();
  console.log(isDarkMode);
  return (
    <div>
      {/* Main Content Section */}
      <div className="content">
        {/* Home Section */}
        <section id="home">
          <Typography variant="h1">
            Welcome to Our Data Visualization Platform
          </Typography>
          <Typography sx={{ marginTop: "20px" }} variant="h6">
            Your Data, Our Insights. Unlock the Power of Your Information.
          </Typography>
          <Button
            sx={{
              marginTop: "20px",
              background: isDarkMode ? "#fff !important" : "#000 !important",
              color: isDarkMode ? "#000 !important" : "#fff !important",
            }}
            variant="contained"
            href="#data-selection"
          >
            Get Started
          </Button>
        </section>

        {/* Features Section */}
        <section id="features" className="features">
          <Typography
            variant="h2"
            sx={{
              color:
                isDarkMode === "light" ? "#fff !important" : "#000 !important",
            }}
          >
            Explore Key Features
          </Typography>
          <Grid sx={{display:"flex",justifyContent:"center"}} container spacing={3}>
            {features.map((feature, index) => {
              const isDashboard = feature.title === "Customizable Dashboards";

              const cardBody = (
                <Card
                  sx={{
                    width: 346,
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    transition: "0.3s",
                    cursor: "pointer",
                    "&:hover": {
                      boxShadow: 6,
                    },
                  }}
                >
                  <CardContent>
                    <Stack
                      direction={"row"}
                      justifyContent={"space-between"}
                      alignItems={"center"}
                      gap={"16px"}
                    >
                      <Typography variant="h6" component="h3" gutterBottom>
                        {feature.title}
                      </Typography>
                      <IconButton
                        sx={{
                          bgcolor: "#000",
                          color: "#fff",
                          mb: 2,
                          "&:hover": { bgcolor: "primary.dark" },
                        }}
                      >
                        {feature.icon}
                      </IconButton>
                    </Stack>
                    <Typography variant="body2" color="text.secondary">
                      {feature.description}
                    </Typography>
                  </CardContent>
                </Card>
              );

              return (
                <Grid item xs={12} sm={6} md={4} key={index}>
                  {isDashboard ? (
                    <Link
                      to="/dashboard"
                      style={{ textDecoration: "none", color: "inherit" }}
                    >
                      {cardBody}
                    </Link>
                  ) : (
                    cardBody
                  )}
                </Grid>
              );
            })}
          </Grid>
        </section>

        {/* Data Selection Section */}
        <section id="data-selection" className="data-selection">
          <Typography
            variant="h6"
            sx={{ minWidth: "250px", fontWeight: "bold" }}
          >
            Select Your Data and Graph Type
          </Typography>

          <Stack
            direction="row"
            spacing={3}
            alignItems="center"
            justifyContent="center"
            sx={{
              p: 2,
              flexWrap: "wrap", // Makes it responsive for smaller screens
              backgroundColor: isDarkMode ? "#121212" : "#fafafa",
              color: isDarkMode ? "#fff" : "#000",
              borderRadius: 2,
            }}
          >
            {/* Heading */}

            {/* Data Type Selector */}
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel
                id="data-type-label"
                sx={{ color: isDarkMode ? "#ccc" : "#000" }}
              >
                Data Type
              </InputLabel>
              <Select
                labelId="data-type-label"
                value={selectedData}
                onChange={handleDataSelection}
                sx={{
                  backgroundColor: isDarkMode ? "#1e1e1e" : "#fff",
                  color: isDarkMode ? "#fff" : "#000",
                }}
              >
                <MenuItem value="">Select Data Type</MenuItem>
                <MenuItem value="temperature">Temperature Data</MenuItem>
                <MenuItem value="humidity">Humidity Data</MenuItem>
                <MenuItem value="pressure">Pressure Data</MenuItem>
                <MenuItem value="sensor1">Sensor 1 Data</MenuItem>
                <MenuItem value="sensor2">Sensor 2 Data</MenuItem>
                <MenuItem value="synthetic">Synthetic IoT Data</MenuItem>
              </Select>
            </FormControl>

            {/* Graph Type Selector */}
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel
                id="graph-type-label"
                sx={{ color: isDarkMode ? "#ccc" : "#000" }}
              >
                Graph Type
              </InputLabel>
              <Select
                labelId="graph-type-label"
                value={selectedGraph}
                onChange={handleGraphSelection}
                sx={{
                  backgroundColor: isDarkMode ? "#1e1e1e" : "#fff",
                  color: isDarkMode ? "#fff" : "#000",
                }}
              >
                <MenuItem value="">Select Graph Type</MenuItem>
                <MenuItem value="graph1">Bar Graph</MenuItem>
                <MenuItem value="graph2">Line Chart</MenuItem>
                <MenuItem value="graph3">Pie Chart</MenuItem>
              </Select>
            </FormControl>

            {/* Submit Button */}
            {/* <Button
              variant="contained"
              onClick={handleSubmit}
              sx={{
                minWidth: 150,
                backgroundColor: isDarkMode ? "#fff" : "#000",
                color: isDarkMode ? "#000" : "#fff",
                height: "56px", // Match the height of the Select inputs
              }}
            >
              Submit
            </Button> */}
            <Button
              variant="contained"
              onClick={handleUploadButtonClick}
              startIcon={<FileUp />}
              sx={{
                minWidth: 150,
                backgroundColor: isDarkMode ? "#fff" : "#000",
                color: isDarkMode ? "#000" : "#fff",
                height: "56px", // Match the height of the Select inputs
              }}
            >
              Upload File
            </Button>
          </Stack>

          {/* Small Upload File Button */}

          {/* Conditionally Render Upload File Section */}
          {isUploadVisible && (
            <div
              className="data-selection"
              style={{
                width: "100%",
                padding: "40px 20px",
                borderRadius: "12px",
                border: `2px dashed ${isDarkMode ? "#555" : "#ccc"}`,
                backgroundColor: isDarkMode ? "#1e1e1e" : "#fafafa",
                color: isDarkMode ? "#ccc" : "#333",
                textAlign: "center",
                transition: "0.3s",
                cursor: "pointer",
              }}
              onClick={() => document.getElementById("fileUpload")?.click()}
            >
              <Typography
                variant="h5"
                sx={{
                  fontWeight: "bold",
                  mb: 1.5,
                  color: isDarkMode ? "#ccc" : "#333",
                }}
              >
                Drag & Drop or Click to Upload
              </Typography>

              <Typography
                variant="body2"
                sx={{
                  mb: 3,
                  color: isDarkMode ? "#aaa" : "#666",
                }}
              >
                Supported formats: .csv, .xlsx, .json
              </Typography>

              <input
                type="file"
                id="fileUpload"
                className="file-upload-input"
                onChange={handleFileChange}
                style={{
                  display: "none",
                }}
              />

              <Button
                onClick={(e) => {
                  e.stopPropagation(); // Prevent parent div's click
                  handleFileUpload();
                }}
                variant="contained"
                startIcon={<FileUp />}
                sx={{
                  backgroundColor: isDarkMode ? "#fff" : "#3f51b5",
                  color: isDarkMode ? "#000" : "#fff",
                  padding: "12px 24px",
                  fontSize: "16px",
                  borderRadius: "8px",
                  fontWeight: "bold",
                  "&:hover": {
                    backgroundColor: isDarkMode ? "#ccc" : "#303f9f",
                  },
                }}
              >
                Upload File
              </Button>

              {file && (
                <Typography
                  variant="body2"
                  sx={{ mt: 2, color: isDarkMode ? "#bbb" : "#555" }}
                >
                  Selected: {file.name}
                </Typography>
              )}
            </div>
          )}
        </section>

        {/* Graphs Section */}
        <section id="graphs" className="graphs">
          {loading ? (
            <div>Loading...</div>
          ) : (
            graphVisible &&
            selectedData &&
            selectedGraph && (
              <div>
                <Stack
                  direction={"row"}
                  justifyContent={"space-between"}
                  alignItems={"center"}
                  sx={{ margin: "24px" }}
                >
                  <div>
                    <Typography variant="h4">Graphs & Insights</Typography>
                    <Typography variant="h6">
                      You have selected {selectedData} and {selectedGraph} for
                      visualization.
                    </Typography>
                  </div>
                  <Button
                    onClick={exportChart}
                    variant="contained"
                    startIcon={<Download />}
                    sx={{
                      backgroundColor: isDarkMode ? "#fff" : "#000",
                      color: isDarkMode ? "#000" : "#fff",
                    }}
                  >
                    Export Chart
                  </Button>
                </Stack>
                <div style={{ padding: "24px" }}>{renderGraph()}</div>
                {/* Export Button */}
              </div>
            )
          )}
        </section>
      </div>
    </div>
  );
};

export default Home;

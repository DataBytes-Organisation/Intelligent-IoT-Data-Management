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
import {
  Button,
  Stack,
  ThemeProvider,
  Typography,
  Grid,
  Card,
  CardContent,
  Link,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  useTheme,
} from "@mui/material";
import { darkTheme, lightTheme } from "./utils/theme";
import { LayoutDashboard } from "lucide-react";
import { ChartNoAxesCombined } from "lucide-react";
import { ChartScatter } from "lucide-react";
import { FileUp } from "lucide-react";
import { Download } from "lucide-react";
import { HardDrive } from "lucide-react";
import useMediaQuery from "@mui/material/useMediaQuery";

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
  const [file, setFile] = useState(null);
  const [isUploadVisible, setIsUploadVisible] = useState(false);
  const [graphVisible, setGraphVisible] = useState(false);
  const chartRef = useRef(null);
  const theme = useTheme();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const fullScreen = useMediaQuery(theme.breakpoints.down("md"));

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

  return (
    <ThemeProvider theme={isDarkMode ? darkTheme : lightTheme}>
      {/* Main Content Section */}
      <div className="content">
        {/* Home Section */}
        <section id="home">
          <Typography variant="h3">
            Welcome to Our Data Visualization Platform
          </Typography>
          <Typography variant="h6">
            Your Data, Our Insights. Unlock the Power of Your Information.
          </Typography>
          <Button
            href="#data-selection"
            sx={{
              backgroundColor: isDarkMode ? "#DECBA4" : "#DECBA4",
              color: isDarkMode ? "#fff" : "#000",
              "&:hover": {
                backgroundColor: isDarkMode ? "#DECBA4" : "#DECBA4",
              },
              marginTop: "20px",
            }}
            variant="contained"
          >
            Get Started
          </Button>
        </section>

        {/* Features Section */}
        <section id="features" className="features">
          <Typography variant="h3" textAlign={"center"}>
            Explore Key Features
          </Typography>
          <Grid
            direction={"row"}
            justifyContent={"center"}
            alignItems={"center"}
            container
            spacing={2}
            sx={{ marginTop: "30px" }}
          >
            {features.map((feature, index) => {
              const isDashboard = feature.title === "Customizable Dashboards";

              const cardBody = (
                <Card
                  fullScreen={fullScreen}
                  sx={{
                    width: 400,
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
                          bgcolor: "#DECBA4",
                          color: "#000",
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
          <Typography variant="h4">Select Your Data and Graph Type</Typography>
          <Stack
            direction="row"
            spacing={3}
            alignItems="center"
            justifyContent="center"
            sx={{
              p: 2,
              flexWrap: "wrap", // Makes it responsive for smaller screens

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
              endIcon={<FileUp size={24} />}
              sx={{
                minWidth: 150,
                backgroundColor: isDarkMode ? "#DECBA4" : "#DECBA4",
                color: isDarkMode ? "#000" : "#000",
                height: "56px", // Match the height of the Select inputs
              }}
            >
              Upload File
            </Button>
          </Stack>

          {/* Conditionally Render Upload File Section */}

          <Dialog
            open={isUploadVisible}
            onClose={() => setIsUploadVisible(false)}
            aria-labelledby="responsive-dialog-title"
            sx={""}
          >
            <DialogTitle id="responsive-dialog-title">File Upload</DialogTitle>

            <DialogContent>
              <div>
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

                  {file && (
                    <Typography
                      variant="body2"
                      sx={{ mt: 2, color: isDarkMode ? "#bbb" : "#555" }}
                    >
                      Selected: {file.name}
                    </Typography>
                  )}
                </div>
              </div>
            </DialogContent>
            <DialogActions>
              <Button
                variant="contained"
                onClick={() => setIsUploadVisible(false)}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                onClick={(e) => {
                  e.stopPropagation(); // Prevent parent div's click
                  handleFileUpload();
                }}
                sx={{
                  backgroundColor: isDarkMode ? "#FFA500" : "#FFA500",
                  color: isDarkMode ? "#000000" : "#000",
                  "&:hover": {
                    backgroundColor: isDarkMode ? "#FFA500" : "#FFA500",
                  },
                }}
              >
                Upload
              </Button>
            </DialogActions>
          </Dialog>
          {/* <div className="data-selection">
               
                <button >Upload</button>
              </div></> */}
        </section>

        {/* Graphs Section */}
        <section id="graphs" className="graphs">
          <h2>Graphs & Insights</h2>
          {loading ? (
            <div>Loading...</div>
          ) : (
            graphVisible &&
            selectedData &&
            selectedGraph && (
              <div>
                <p>
                  You have selected {selectedData} and {selectedGraph} for
                  visualization.
                </p>
                {renderGraph()}
                {/* Export Button */}
                <button onClick={exportChart} style={{ marginTop: "10px" }}>
                  Export Chart
                </button>
              </div>
            )
          )}
        </section>
      </div>
    </ThemeProvider>
  );
};

export default Home;

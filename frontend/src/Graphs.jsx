import React, { useState, useEffect, useRef } from "react";
import Papa from "papaparse";
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
} from "chart.js";
import { Line } from "react-chartjs-2";
import {
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Typography,
  Stack,
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  useTheme,
  Button,
} from "@mui/material";
import { UploadCloudIcon } from "lucide-react";

ChartJS.register(
  Title,
  Tooltip,
  Legend,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale
);

function GraphsComponent() {
  const [csvData, setCsvData] = useState([]);
  const [chartType, setChartType] = useState("line");
  const theme = useTheme();
  const fileInputRef = useRef();
  const handleFileChange = (e) => {
    const uploadedFile = e.target.files[0];
    if (uploadedFile && uploadedFile.name.endsWith(".csv")) {
      Papa.parse(uploadedFile, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          setCsvData(results.data);
        },
      });
    } else {
      alert("Please upload a valid .csv file");
    }
  };

  const lineLabels = csvData.map((row) => row.time);
  const allKeys =
    csvData.length > 0
      ? Object.keys(csvData[0]).filter((key) => key !== "time")
      : [];
  const colors = ["#42A5F5", "#FF7043", "#66BB6A", "#AB47BC", "#26A69A"];

  const lineData = {
    labels: lineLabels,
    datasets: allKeys.map((key, index) => ({
      label: key.toUpperCase(),
      data: csvData.map((row) => parseFloat(row[key]) || 0),
      borderColor: colors[index % colors.length],
      backgroundColor: colors[index % colors.length],
      fill: false,
    })),
  };

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
      },
      title: {
        display: true,
        text: "CSV Data Visualization",
      },
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: "Time",
        },
      },
      y: {
        display: true,
        title: {
          display: true,
          text: "Value",
        },
      },
    },
  };

  // Custom heatmap component using MUI
  const renderHeatmap = () => {
    if (csvData.length === 0 || allKeys.length === 0) return null;

    // Calculate min/max values for color scaling
    const allValues = csvData.flatMap((row) =>
      allKeys.map((key) => parseFloat(row[key]) || 0)
    );
    const minVal = Math.min(...allValues);
    const maxVal = Math.max(...allValues);

    const getColor = (value) => {
      const normalized = (value - minVal) / (maxVal - minVal);
      const hue = (1 - normalized) * 240; // Blue to red scale
      return `hsl(${hue}, 70%, 50%)`;
    };

    return (
      <Box>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Heatmap Visualization
        </Typography>
        <TableContainer
          component={Paper}
          sx={{ maxHeight: 400, overflow: "auto" }}
        >
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell
                  sx={{ fontWeight: "bold", backgroundColor: "#f5f5f5" }}
                >
                  Time
                </TableCell>
                {allKeys.map((key) => (
                  <TableCell
                    key={key}
                    align="center"
                    sx={{ fontWeight: "bold", backgroundColor: "#f5f5f5" }}
                  >
                    {key.toUpperCase()}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {csvData.map((row, rowIndex) => (
                <TableRow key={rowIndex}>
                  <TableCell
                    sx={{
                      fontWeight: "medium",
                      backgroundColor: "#fafafa",
                      minWidth: "80px",
                    }}
                  >
                    {row.time}
                  </TableCell>
                  {allKeys.map((key) => {
                    const value = parseFloat(row[key]) || 0;
                    return (
                      <TableCell
                        key={key}
                        align="center"
                        sx={{
                          backgroundColor: getColor(value),
                          color: "white",
                          fontWeight: "medium",
                          minWidth: "60px",
                          height: "40px",
                          cursor: "pointer",
                          "&:hover": {
                            opacity: 0.8,
                          },
                        }}
                        title={`${key}: ${value}`}
                      >
                        {value.toFixed(1)}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <Stack
          direction="row"
          spacing={3}
          justifyContent="center"
          sx={{ mt: 2 }}
        >
          <Stack direction="row" spacing={1} alignItems="center">
            <Box
              sx={{
                width: 16,
                height: 16,
                backgroundColor: getColor(minVal),
              }}
            />
            <Typography variant="body2">Min: {minVal.toFixed(1)}</Typography>
          </Stack>
          <Stack direction="row" spacing={1} alignItems="center">
            <Box
              sx={{
                width: 16,
                height: 16,
                backgroundColor: getColor(maxVal),
              }}
            />
            <Typography variant="body2">Max: {maxVal.toFixed(1)}</Typography>
          </Stack>
        </Stack>
      </Box>
    );
  };

  return (
    <Box sx={{ p: 3, maxWidth: "1200px", mx: "auto" }}>
      <Typography
        variant="h4"
        component="h1"
        sx={{ mb: 3, textAlign: "center" }}
      >
        Graph Visualization
      </Typography>

      <Stack spacing={3} sx={{ mb: 3 }}>
        <Box>
          <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
            Upload CSV File
          </Typography>

          <Paper
            elevation={3}
            onClick={() => fileInputRef.current.click()}
            sx={{
              p: 3,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              border: `2px dashed ${
                theme.palette.mode === "dark"
                  ? theme.palette.primary.light
                  : theme.palette.primary.main
              }`,
              backgroundColor:
                theme.palette.mode === "dark" ? "#121212" : "#fafafa",
              color: theme.palette.text.secondary,
              "&:hover": {
                backgroundColor:
                  theme.palette.mode === "dark" ? "#1f1f1f" : "#f0f0f0",
              },
              transition: "background-color 0.3s ease",
              minHeight: 80,
              userSelect: "none",
              mb: 2,
            }}
          >
            <UploadCloudIcon
              style={{ marginRight: 12, width: 30, height: 30 }}
            />
            <Typography variant="body1" sx={{ userSelect: "none" }}>
              Click or Drag your file here
            </Typography>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              hidden
              ref={fileInputRef}
            />
          </Paper>
        </Box>

        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Chart Type</InputLabel>
          <Select
            value={chartType}
            label="Chart Type"
            onChange={(e) => setChartType(e.target.value)}
          >
            <MenuItem value="line">Interactive Line Chart</MenuItem>
            <MenuItem value="heatmap">Heatmap</MenuItem>
          </Select>
        </FormControl>
      </Stack>

      <Box sx={{ mt: 3 }}>
        {csvData.length > 0 && chartType === "line" && (
          <Box sx={{ height: 400 }}>
            <Line data={lineData} options={lineOptions} />
          </Box>
        )}
        {csvData.length > 0 && chartType === "heatmap" && renderHeatmap()}
      </Box>

      {csvData.length === 0 && (
        <Typography variant="body1" color="textSecondary" textAlign={"center"}>
          Please upload a CSV file to start visualizing your data
        </Typography>
      )}
    </Box>
  );
}
export default GraphsComponent;

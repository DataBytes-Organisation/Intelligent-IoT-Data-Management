import React, { useState, useRef } from "react";
import axios from "axios";
import RealTimeGraph from "./RealTimeGraph";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import "./AnalyzePanel.css";
import {
  Box,
  Typography,
  Checkbox,
  FormControlLabel,
  FormGroup,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Paper,
  useTheme,
  Stack,
} from "@mui/material";

const AnalyzePanel = () => {
  const [selectedStreams, setSelectedStreams] = useState([]);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [expectedCorrelation, setExpectedCorrelation] = useState("");
  const [exportType, setExportType] = useState("CSV");
  const graphRef = useRef(null);

  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const sampleData = [
    {
      Time: "08:00",
      "Sensor 1": 21.5,
      "Sensor 2": 45.2,
      "Sensor 3": 10.7,
      "Sensor 4": 33.1,
      "Sensor 5": 67.8,
    },
    {
      Time: "09:00",
      "Sensor 1": 22.1,
      "Sensor 2": 44.8,
      "Sensor 3": 11.2,
      "Sensor 4": 34.5,
      "Sensor 5": 66.3,
    },
    {
      Time: "10:00",
      "Sensor 1": 23.4,
      "Sensor 2": 46.1,
      "Sensor 3": 12.5,
      "Sensor 4": 35.2,
      "Sensor 5": 65.9,
    },
    {
      Time: "11:00",
      "Sensor 1": 24.2,
      "Sensor 2": 45.7,
      "Sensor 3": 11.9,
      "Sensor 4": 36.7,
      "Sensor 5": 68.2,
    },
    {
      Time: "12:00",
      "Sensor 1": 25.0,
      "Sensor 2": 47.3,
      "Sensor 3": 12.1,
      "Sensor 4": 35.9,
      "Sensor 5": 70.1,
    },
  ];

  const [timeRange, setTimeRange] = useState("");
  const [sensorFilter, setSensorFilter] = useState("");
  const [valueThreshold, setValueThreshold] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const availableStreams = [
    "Sensor 1",
    "Sensor 2",
    "Sensor 3",
    "Sensor 4",
    "Sensor 5",
  ];

  const handleStreamChange = (stream) => {
    setSelectedStreams((prev) =>
      prev.includes(stream)
        ? prev.filter((s) => s !== stream)
        : [...prev, stream]
    );
  };

  const handleAnalyze = async () => {
    if (
      selectedStreams.length < 3 ||
      !startTime ||
      !endTime ||
      !expectedCorrelation
    ) {
      setError("Please select 3 streams and fill all fields.");
      return;
    }

    setError("");

    try {
      const response = await axios.post("http://localhost:5000/api/analyze", {
        streams: selectedStreams,
        start: startTime,
        end: endTime,
        expectedCorrelation: parseFloat(expectedCorrelation),
      });
      setResult(data);
    } catch (err) {
      console.error(err);
      alert("Analysis failed – check backend/network.");
    }
  };

  const exportAll = async () => {
    if (!result) {
      alert("Run an analysis first.");
      return;
    }

    try {
      if (!Array.isArray(result.data)) {
        alert("Unexpected data format for CSV export.");
        return;
      }

      const csv = Papa.unparse(result.data);
      saveAs(
        new Blob([csv], { type: "text/csv;charset=utf-8;" }),
        "analysis.csv"
      );

      const canvas = await html2canvas(graphRef.current);

      await new Promise((res) =>
        canvas.toBlob((b) => {
          saveAs(b, "analysis.png");
          res();
        })
      );

      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "px",
        format: [canvas.width, canvas.height],
      });
      pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, 0);
      pdf.save("analysis.pdf");
    } catch (err) {
      console.error("Error during analysis:", err);
      setError("Analysis failed. Check backend or network.");
    }
  };

  const getFilteredData = () => {
    if (selectedStreams.length === 0) return sampleData;

    return sampleData.map((row) => {
      const filteredRow = { Time: row.Time };
      selectedStreams.forEach((stream) => {
        filteredRow[stream] = row[stream];
      });
      return filteredRow;
    });
  };

  const exportToCSV = () => {
    const filteredData = getFilteredData();

    const headers = Object.keys(filteredData[0]);

    let csvContent = headers.join(",") + "\n";

    filteredData.forEach((row) => {
      const rowValues = headers.map((header) => {
        const value = row[header];
        // Handle values that might need quotes (like strings with commas)
        const cellValue =
          value !== null && value !== undefined ? String(value) : "";
        return cellValue.includes(",") ? `"${cellValue}"` : cellValue;
      });
      csvContent += rowValues.join(",") + "\n";
    });

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute("download", "sensor-data.csv");
    link.style.visibility = "hidden";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExport = () => {
    switch (exportType) {
      case "CSV":
        exportToCSV();
        break;
      case "PDF":
        exportToPDF();
        break;
      case "PNG":
        exportToPNG();
        break;
      default:
        break;
    }
  };

  const exportToPDF = () => {
    if (!graphRef.current) return;

    const doc = new jsPDF("landscape", "mm", "a4");
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setFontSize(16);
    doc.text("Sensor Correlation Analysis", pageWidth / 2, 20, {
      align: "center",
    });

    html2canvas(graphRef.current).then((canvas) => {
      const imgData = canvas.toDataURL("image/png");
      const imgWidth = pageWidth - 40;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      doc.addImage(imgData, "PNG", 20, 30, imgWidth, imgHeight);

      const filteredData = getFilteredData();
      const startY = imgHeight + 40;

      doc.setFontSize(12);
      let yPos = startY;
      let xPos = 20;

      const headers = Object.keys(filteredData[0]);
      headers.forEach((header) => {
        doc.text(header, xPos, yPos);
        xPos += 40;
      });
      filteredData.slice(0, 5).forEach((row, rowIndex) => {
        yPos += 10;
        xPos = 20;

        headers.forEach((header) => {
          doc.text(String(row[header]), xPos, yPos);
          xPos += 40;
        });
      });
      doc.save("sensor-analysis.pdf");
    });
  };

  const exportToPNG = () => {
    if (!graphRef.current) return;

    html2canvas(graphRef.current).then((canvas) => {
      const link = document.createElement("a");
      link.download = "sensor-graph.png";
      link.href = canvas.toDataURL("image/png");
      link.click();
    });
  };

  const theme = useTheme();
  return (
    <>
      <Typography
        variant="h5"
        textAlign={"center"}
        fontWeight="bold"
        gutterBottom
        marginTop={"24px"}
      >
        {" "}
        Analyze Sensor Correlation
      </Typography>

      <FormControl
        fullWidth
        sx={{ mb: 3, display: "flex", alignItems: "center" }}
      >
        <Typography>Select 3 Streams:</Typography>
        <FormGroup row>
          {availableStreams.map((stream) => (
            <FormControlLabel
              key={stream}
              control={
                <Checkbox
                  checked={selectedStreams.includes(stream)}
                  onChange={() => handleStreamChange(stream)}
                  color="default"
                  sx={{
                    color: theme.palette.text.primary,
                    "&.Mui-checked": {
                      color: theme.palette.text.primary,
                    },
                  }}
                />
              }
              label={stream}
            />
          ))}
        </FormGroup>
      </FormControl>

      <div className="form-group">
        <div>
          <label>Start Time:</label>
          <input
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="input-field"
            style={{ width: "100%" }}
          />
        </div>

        <div>
          <label>End Time:</label>
          <input
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className="input-field"
          />
        </div>
      </div>
      <Stack padding={"24px"}>
        <label>Expected Correlation (0.0 - 1.0):</label>
        <input
          id="expectedCorrelation"
          type="number"
          step="0.1"
          min="0"
          max="1"
          value={expectedCorrelation}
          onChange={(e) => setExpectedCorrelation(e.target.value)}
          className="input-field"
        />
      </Stack>

      <Box
        display="flex"
        gap={2}
        sx={{ mb: 3 }}
        justifyContent="center"
        alignItems="stretch" // Ensures all children take full height of the tallest sibling
      >
        <Button
          variant="contained"
          size="large"
          sx={{
            backgroundColor: "#DECBA4",
            color: "#000",
            px: 4,
            minHeight: 56, // Ensures consistent height with Select
          }}
          onClick={handleAnalyze}
        >
          🔍 Analyze
        </Button>

        <FormControl
          sx={{
            minWidth: 200,
            minHeight: 56,
            justifyContent: "center",
          }}
          size="large"
        >
          <InputLabel>Export</InputLabel>
          <Select
            value={exportType}
            label="Export"
            onChange={(e) => setExportType(e.target.value)}
            sx={{
              minHeight: 56,
              display: "flex",
              alignItems: "center",
            }}
          >
            <MenuItem value="CSV">CSV</MenuItem>
            <MenuItem value="PDF">PDF</MenuItem>
            <MenuItem value="PNG">PNG</MenuItem>
          </Select>
        </FormControl>

        <Button
          variant="contained"
          size="large"
          sx={{
            backgroundColor: "#DECBA4",
            color: "#000",
            px: 4,
            minHeight: 56,
          }}
          onClick={handleExport}
        >
          📥 Export
        </Button>
      </Box>

      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}

      <Box padding={"24px"}>
        {/* Header */}
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="h6">📈 Real-Time Data Graph</Typography>
          <Typography color="success.main">🟢 Live Stream</Typography>
        </Box>

        {/* Button Actions */}
        <Box display="flex" gap={2} mt={3}>
          <Button variant="contained" onClick={handleAnalyze}>
            🔍 Analyze
          </Button>
          <Button
            variant="contained"
            color="secondary"
            onClick={() => setShowFilters(!showFilters)}
          >
            ⏳ Filter Data
          </Button>
        </Box>

        {/* Filters */}
        {showFilters && (
          <Box display="flex" gap={2} mt={3}>
            <FormControl fullWidth>
              <InputLabel>Time Range</InputLabel>
              <Select
                value={timeRange}
                label="Time Range"
                onChange={(e) => setTimeRange(e.target.value)}
              >
                <MenuItem value="1h">Last Hour</MenuItem>
                <MenuItem value="24h">Last Day</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Sensor Type</InputLabel>
              <Select
                value={sensorFilter}
                label="Sensor Type"
                onChange={(e) => setSensorFilter(e.target.value)}
              >
                {availableStreams.map((s) => (
                  <MenuItem key={s} value={s}>
                    {s}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Value Range</InputLabel>
              <Select
                value={valueThreshold}
                label="Value Range"
                onChange={(e) => setValueThreshold(e.target.value)}
              >
                <MenuItem value="10">Above 10</MenuItem>
                <MenuItem value="20">Above 20</MenuItem>
                <MenuItem value="30">Above 30</MenuItem>
                <MenuItem value="40">Above 40</MenuItem>
                <MenuItem value="50">Above 50</MenuItem>
              </Select>
            </FormControl>
          </Box>
        )}

        {/* Graphs Side-by-Side */}
        <Box display="flex" gap={4} mt={4} flexWrap="wrap">
          {/* Real-Time Graph */}
          <Box flex={1} minWidth="400px">
            <Typography variant="h6" gutterBottom>
              📡 Raw Stream
            </Typography>
            <RealTimeGraph selectedStreams={selectedStreams} />
          </Box>

          {/* Filtered Graph */}
          <Box flex={1} minWidth="400px">
            <Typography variant="h6" gutterBottom>
              📈 Filtered Stream {sensorFilter ? `for ${sensorFilter}` : ""}
            </Typography>
            <div ref={graphRef}>
              <RealTimeGraph
                selectedStreams={selectedStreams}
                timeRange={timeRange}
                sensorFilter={sensorFilter}
                valueThreshold={valueThreshold}
              />
            </div>
          </Box>
        </Box>
      </Box>
    </>
  );
};

export default AnalyzePanel;

import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import Papa from "papaparse";
import { saveAs } from "file-saver";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import RealTimeGraph from "./RealTimeGraph";
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
  useTheme,
  Stack,
} from "@mui/material";

const AnalyzePanel = () => {
  const [selectedStreams, setSelectedStreams] = useState([]);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [expectedCorrelation, setExpectedCorrelation] = useState("");
  const [exportType, setExportType] = useState("CSV");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [timeRange, setTimeRange] = useState("");
  const [sensorFilter, setSensorFilter] = useState("");
  const [valueThreshold, setValueThreshold] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const graphRef = useRef(null);

  const availableStreams = [
    "Sensor 1",
    "Sensor 2",
    "Sensor 3",
    "Sensor 4",
    "Sensor 5",
  ];

  useEffect(() => {
    setResult(null);
  }, [selectedStreams, startTime, endTime, expectedCorrelation]);

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
      setResult(response.data);
    } catch (err) {
      console.error("Error during analysis:", err);
      setError("Analysis failed. Check backend or network.");
    }
  };

  const getFilteredData = () => {
    if (selectedStreams.length === 0) return [];

    return result?.data?.map((row) => {
      const filteredRow = { Time: row.Time };
      selectedStreams.forEach((stream) => {
        filteredRow[stream] = row[stream];
      });
      return filteredRow;
    }) || [];
  };

  const exportToCSV = () => {
    const filteredData = getFilteredData();
    const csv = Papa.unparse(filteredData);
    saveAs(new Blob([csv], { type: "text/csv;charset=utf-8;" }), "analysis.csv");
  };

  const exportToPDF = async () => {
    if (!graphRef.current) return;

    const canvas = await html2canvas(graphRef.current);
    const pdf = new jsPDF({
      orientation: "landscape",
      unit: "px",
      format: [canvas.width, canvas.height],
    });
    pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, 0);
    pdf.save("sensor-analysis.pdf");
  };

  const exportToPNG = async () => {
    if (!graphRef.current) return;

    const canvas = await html2canvas(graphRef.current);
    const link = document.createElement("a");
    link.download = "sensor-graph.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
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

  const theme = useTheme();

  return (
    <>
      <Typography variant="h5" textAlign={"center"} fontWeight="bold" gutterBottom marginTop={"24px"}>
        📊 Analyze Sensor Correlation
      </Typography>

      <FormControl fullWidth sx={{ mb: 3, display: "flex", alignItems: "center" }}>
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
        <TextField
          fullWidth
          label="Start Time"
          type="time"
          value={startTime}
          onChange={(e) => setStartTime(e.target.value)}
          sx={{ mb: 2 }}
        />
        <TextField
          fullWidth
          label="End Time"
          type="time"
          value={endTime}
          onChange={(e) => setEndTime(e.target.value)}
          sx={{ mb: 2 }}
        />
        <TextField
          fullWidth
          label="Expected Correlation (0.0 - 1.0)"
          type="number"
          inputProps={{ min: 0, max: 1, step: 0.1 }}
          value={expectedCorrelation}
          onChange={(e) => setExpectedCorrelation(e.target.value)}
          sx={{ mb: 2 }}
        />
      </div>

      <Box display="flex" gap={2} mb={3}>
        <Button variant="contained" onClick={handleAnalyze}>🔍 Analyze</Button>
        <FormControl>
          <InputLabel>Export</InputLabel>
          <Select
            value={exportType}
            onChange={(e) => setExportType(e.target.value)}
            label="Export"
          >
            <MenuItem value="CSV">CSV</MenuItem>
            <MenuItem value="PDF">PDF</MenuItem>
            <MenuItem value="PNG">PNG</MenuItem>
          </Select>
        </FormControl>
        <Button variant="contained" onClick={handleExport} disabled={!result}>📥 Export</Button>
      </Box>

      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}

      <Box padding={"24px"}>
        <Typography variant="h6" gutterBottom>📈 Real-Time Data Graph</Typography>
        <div ref={graphRef}>
          <RealTimeGraph
            selectedStreams={selectedStreams}
            timeRange={timeRange}
            sensorFilter={sensorFilter}
            valueThreshold={valueThreshold}
          />
        </div>
      </Box>
    </>
  );
};

export default AnalyzePanel;

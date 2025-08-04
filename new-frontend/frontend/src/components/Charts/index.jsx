import React, { useState, useEffect } from "react";
import Papa from "papaparse";
import { Line } from "react-chartjs-2";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Checkbox,
  FormGroup,
  FormControlLabel,
  TextField,
  Button,
  Grid,
} from "@mui/material";

import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Legend,
  Tooltip,
} from "chart.js";

ChartJS.register(
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Legend,
  Tooltip
);

const ChartSeriesComponent = () => {
  const [data, setData] = useState([]);
  const [series, setSeries] = useState(["s1", "s2", "s3"]);
  const [availableSeries, setAvailableSeries] = useState([]);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [maxTime, setMaxTime] = useState(0);
  const [minTime, setMinTime] = useState(0);

  useEffect(() => {
    fetch("/datasets/most_correlated_streams.csv")
      .then((res) => res.text())
      .then((text) => {
        const parsed = Papa.parse(text, { header: true, dynamicTyping: true });
        const cleanData = parsed.data.filter(
          (row) => row.time !== undefined && !isNaN(row.time)
        );
        setData(cleanData);
        setAvailableSeries(
          Object.keys(cleanData[0]).filter((k) => k !== "time")
        );

        // Set min and max time values
        const times = cleanData.map((d) => d.time);
        const min = Math.min(...times);
        const max = Math.max(...times);
        setMinTime(min);
        setMaxTime(max);

        // Set default start and end times to show all data
        setStartTime(min.toString());
        setEndTime(max.toString());
      })
      .catch((error) => {
        console.error("Error loading CSV file:", error);
      });
  }, []);

  const handleSeriesToggle = (s) => {
    setSeries((prev) =>
      prev.includes(s) ? prev.filter((item) => item !== s) : [...prev, s]
    );
  };

  const handleApplyTimeRange = () => {
    // This function can be used for additional validation if needed
    // For now, the filtering happens automatically when startTime/endTime change
  };

  const filteredData = data.filter((d) => {
    const start = startTime ? parseFloat(startTime) : minTime;
    const end = endTime ? parseFloat(endTime) : maxTime;
    return d.time >= start && d.time <= end;
  });

  const chartData = {
    labels: filteredData.map((d) => d.time),
    datasets: series.map((s, idx) => ({
      label: s,
      data: filteredData.map((d) => d[s]),
      borderColor: ["#1976d2", "#9c27b0", "#2e7d32"][idx % 3],
      fill: false,
      tension: 0.3,
    })),
  };

  return (
    <Box sx={{ width: "100%", margin: "auto", padding: 4 }}>
      <Card elevation={3}>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            Time Series Visualization
          </Typography>

          {/* Time Range Inputs */}
          <Box sx={{ my: 3 }}>
            <Typography gutterBottom>Time Range</Typography>
            <Grid
              container
              spacing={2}
              alignItems="flex-start"
              justifyContent="center"
            >
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Start Time"
                  type="number"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  inputProps={{
                    min: minTime,
                    max: maxTime,
                    step: "any",
                  }}
                  helperText={`Min: ${minTime}`}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="End Time"
                  type="number"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  inputProps={{
                    min: minTime,
                    max: maxTime,
                    step: "any",
                  }}
                  helperText={`Max: ${maxTime}`}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <Button
                  variant="contained"
                  onClick={handleApplyTimeRange}
                  sx={{ height: 56 }}
                >
                  Apply Filter
                </Button>
              </Grid>
            </Grid>
          </Box>

          {/* Series Toggle */}
          <Box
            sx={{
              mb: 3,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <Typography gutterBottom>Choose Data Series</Typography>
            <FormGroup row sx={{ justifyContent: "center" }}>
              {availableSeries.map((s) => (
                <FormControlLabel
                  key={s}
                  control={
                    <Checkbox
                      checked={series.includes(s)}
                      onChange={() => handleSeriesToggle(s)}
                    />
                  }
                  label={s}
                />
              ))}
            </FormGroup>
          </Box>

          {/* Line Chart */}
          <Box>
            <Line data={chartData} />
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default ChartSeriesComponent;

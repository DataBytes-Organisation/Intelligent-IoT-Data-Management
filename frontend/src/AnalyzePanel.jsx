import React, { useState, useRef, useEffect } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import RealTimeGraph from "./RealTimeGraph";

const AnalyzePanel = () => {
  const [selectedStreams, setSelectedStreams] = useState([]);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [expectedCorrelation, setExpectedCorrelation] = useState("");
  const [result, setResult] = useState(null);
  const [exportType, setExportType] = useState("CSV");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const graphRef = useRef(null);

  const availableStreams = [
    "Sensor 1",
    "Sensor 2",
    "Sensor 3",
    "Sensor 4",
    "Sensor 5",
  ];
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
      alert("Please select 3 streams and fill all fields.");
      return;
    }

    setIsAnalyzing(true);

    try {
      // Using fetch API
      const response = await fetch("http://localhost:5000/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          streams: selectedStreams,
          start: startTime,
          end: endTime,
          expectedCorrelation: parseFloat(expectedCorrelation),
        }),
      });

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      console.error("Error during analysis:", err);
      alert("Analysis failed. Check backend or network.");
    } finally {
      setIsAnalyzing(false);
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

  return (
    <div className="analyze_container">
      <div className="analyze_header">
        <span className="analyze_headerIcon">📊</span>
        <h2 className="analyze_title">Analyze Sensor Correlation</h2>
      </div>

      <div className="analyze_formGroup">
        <label className="analyze_label">
          Select 3 or More Sensor Streams:
        </label>
        <div className="analyze_checkboxGroup">
          {availableStreams.map((stream) => (
            <label
              key={stream}
              className={`analyze_checkboxLabel ${
                selectedStreams.includes(stream)
                  ? "analyze_checkboxLabelSelected"
                  : ""
              }`}
            >
              <input
                type="checkbox"
                checked={selectedStreams.includes(stream)}
                onChange={() => handleStreamChange(stream)}
                style={{ marginRight: "8px" }}
              />
              {stream}
            </label>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", gap: "50px" }}>
        <div className="analyze_formGroup" style={{ flex: 1 }}>
          <label className="label">Start Time:</label>
          <input
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="analyze_input"
          />
        </div>

        <div className="analyze_formGroup" style={{ flex: 1 }}>
          <label className="analzye_label">End Time:</label>
          <input
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className="analyze_input"
          />
        </div>
      </div>

      <div className="analyze_formGroup">
        <label className="label">Expected Correlation (0.0 - 1.0):</label>
        <input
          type="number"
          step="0.1"
          min="0"
          max="1"
          value={expectedCorrelation}
          onChange={(e) => setExpectedCorrelation(e.target.value)}
          className="analyze_input"
        />
      </div>

      <div className="analyze_buttonGroup">
        <button
          onClick={handleAnalyze}
          className="analyze_button analyze_primaryButton"
          disabled={isAnalyzing}
        >
          <span className="analyze_icon">🔍</span>
          {isAnalyzing ? "Analyzing..." : "Analyze"}
        </button>

        <select
          value={exportType}
          onChange={(e) => setExportType(e.target.value)}
          className="select"
        >
          <option value="CSV">CSV</option>
          <option value="PDF">PDF</option>
          <option value="PNG">PNG</option>
        </select>

        <button
          onClick={handleExport}
          className="analyze_button analyze_secondaryButton"
        >
          <span className="analyze_icon">📥</span>
          Export
        </button>
      </div>

      {result && (
        <div className="analyze_resultContainer">
          <div className="analyze_resultHeader">Analysis Result:</div>
          <pre className="analyze_resultContent">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}

      {/* Real-Time Graph Integration with ref for export functionality */}
      <div className="analyze_resultContent" ref={graphRef}>
        <RealTimeGraph selectedStreams={selectedStreams} />
      </div>
    </div>
  );
};

export default AnalyzePanel;

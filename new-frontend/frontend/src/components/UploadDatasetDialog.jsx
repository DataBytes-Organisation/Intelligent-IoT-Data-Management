import { createDataset } from "../services/datasetService";
import { useState } from "react";
import "./UploadDatasetDialog.css";

const predefinedFields = [
    "field1",
    "field2",
    "field3",
    "field4",
    "field5",
    "field6",
    "field7",
    "field8",
];


const UploadDatasetDialog = ({ onClose }) => {
    const [file, setFile] = useState(null);
    const [datasetName, setDatasetName] = useState("");
    const [columns, setColumns] = useState([]);
    const [previewData, setPreviewData] = useState([]);
    const [allRows, setAllRows] = useState([]);
    const [timestampColumn, setTimestampColumn] = useState("");
    const [columnConfig, setColumnConfig] = useState([]);
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const detectTimestampColumn = (headers) => {
        const timestampNames = [
            "created_at",
            "timestamp",
            "datetime",
            "date_time",
            "time",
            "date",
            "recorded_at",
            "reading_time",
        ];

        const detectedColumn = headers.find((header) =>
            timestampNames.includes(header.toLowerCase())
        );
        return detectedColumn || "";
    };

    // Timestamp validation:
    // A timestamp column must contain non-empty values
    // and every value must be parseable as a date.
    const isValidTimestampColumn = (column, rows) => {
        if (!column || rows.length === 0) {
            return false;
        }

        const values = rows.map((row) => row[column]);

        if (values.some(
            (value) =>
                value === undefined ||
                value === null ||
                String(value).trim() === ""
        )) {
            return false;
        }

        return values.every((value) => {
            const textValue = String(value).trim();

            // Prevent ordinary numeric ID columns from being treated as dates.
            if (/^\d+$/.test(textValue)) {
                return false;
            }

            return !Number.isNaN(new Date(textValue).getTime());
        });
    };

    const detectDataType = (column, rows) => {
        const values = rows.map((row) => row[column]).filter((value) =>

            value !== undefined &&
            value !== null &&
            value.trim() !== ""
        );

        if (values.length === 0) {
            return "Unknown";
        }

        const allNumeric = values.every(
            (value) => !Number.isNaN(Number(value))
        );

        if (allNumeric) {
            return "Number";
        }

        return "Text";
    };

    const parseCSVLine = (line) => {
        const values = [];
        let currentValue = "";
        let insideQuotes = false;

        for(let i =0; i < line.length; i++){
            const character = line[i];

            if(character === '"'){
                if(insideQuotes && line[i+1] ==='"'){
                    currentValue += '"';
                    i++;

                }else{
                    insideQuotes = !insideQuotes;
                }
            }else if(character === "," && !insideQuotes){
                values.push(currentValue.trim());
                currentValue = "";
            }else{
                currentValue += character;
            }
        }

        values.push(currentValue.trim());

        return values;
    };

    const handleFileChange = (event) => {
        const selectedFile = event.target.files[0];

        if (!selectedFile) return;

        if (!selectedFile.name.toLowerCase().endsWith(".csv")) {
            setError("Please select a CSV file.");

            setFile(null);
            setDatasetName("");
            setColumns([]);
            setPreviewData([]);
            setAllRows([]);
            setTimestampColumn("");
            setColumnConfig([]);
            setSuccessMessage("");

            return;
        }

        setFile(selectedFile);
        setDatasetName(selectedFile.name.replace(/\.csv$/i, ""));
        setError("");
        setSuccessMessage("");

        const reader = new FileReader();

        reader.onload = (event) => {
            try {
                const text = event.target.result;

                const lines = text.split(/\r?\n/).filter((line) => line.trim() !== "");

                if (lines.length < 2) {
                    setError("CSV file does not contain any data.");

                    setColumns([]);
                    setPreviewData([]);
                    setAllRows([]);
                    setTimestampColumn("");
                    setColumnConfig([]);

                    return;
                }

                const headers = parseCSVLine(lines[0]);
                if (headers.length < 2) {
                    setError("CSV file must have a timestamp and sensor column");

                    setColumns([]);
                    setPreviewData([]);
                    setAllRows([]);
                    setTimestampColumn("");
                    setColumnConfig([]);

                    return;
                }

                const parsedRows = lines.slice(1).map((line) => {
                    const values = parseCSVLine(line);
                    const row = {};
                    headers.forEach((header, index) => {
                        row[header] = values[index] ?? "";
                    });
                    return row;
                });

                const rows = parsedRows.slice(0, 5);

                setColumns(headers);
                setPreviewData(rows);
                setAllRows(parsedRows);

                // Timestamp validation:
                // Auto-select the detected timestamp only when its values
                // are actually valid timestamps.
                const detectedTimestampCandidate = detectTimestampColumn(headers);

                const detectedTimestamp =
                    detectedTimestampCandidate &&
                    isValidTimestampColumn(
                        detectedTimestampCandidate,
                        parsedRows
                    )
                        ? detectedTimestampCandidate
                        : "";

                setTimestampColumn(detectedTimestamp);

                const config = headers.filter((header) =>
                    header !== detectedTimestamp
                ).map((header) => ({
                    columnName: header,

                    dataType: detectDataType(
                        header,
                        parsedRows
                    ),
                    import: false,
                    backendField: "",

                    displayName: header,
                }));

                setColumnConfig(config);

                // Timestamp validation:
                // Warn if the CSV contains no column whose values
                // can safely be used as timestamps.
                const validTimestampColumns = headers.filter((header) =>
                    isValidTimestampColumn(header, parsedRows)
                );

                if (validTimestampColumns.length === 0) {
                    setError(
                        "No valid timestamp column was found. The timestamp column must contain a valid date or time value in every row."
                    );
                } else {
                    setError("");
                }
            } catch (err) {
                console.error(err);

                setError("Unable to read CSV file");

                setColumns([]);
                setPreviewData([]);
                setAllRows([]);
                setTimestampColumn("");
                setColumnConfig([]);
            }
        };

        reader.onerror = () => {
            setError("Unable to read CSV file");
        };
        reader.readAsText(selectedFile);
    };

    const handleTimestampChange = (event) => {
        const newTimestamp = event.target.value;
        setTimestampColumn(newTimestamp);

        const newConfig = columns.filter((column) => column !== newTimestamp).map((column) => {
            const existingConfig = columnConfig.find((item) => item.columnName === column);

            if (existingConfig) {
                return existingConfig;
            }

            return {
                columnName: column,

                dataType: detectDataType(
                    column,
                    allRows
                ),
                import: false,
                backendField: "",
                displayName: column,
            };
        });
        setColumnConfig(newConfig);
        setError("");
        setSuccessMessage("");
    };

    const handleImportChange = (index) => {
        const currentColumn = columnConfig[index];

        if (currentColumn.dataType !== "Number") {
            return;
        }

        if (!currentColumn.import) {
            const selectedColumns = columnConfig.filter(
                (column) => column.import
            );

            if (selectedColumns.length >= 8) {
                setError("A maximum of 8 sensor columns can be imported");
                return;
            }

            const usedFields = selectedColumns.map(
                (column) => column.backendField
            );

            const availableField = predefinedFields.find(
                (field) => !usedFields.includes(field)
            );

            const updatedConfig = columnConfig.map(
                (column, columnIndex) => columnIndex === index
                    ? {
                        ...column,
                        import: true,
                        backendField: availableField || "",
                    }
                    : column
            );
            setColumnConfig(updatedConfig);
            setError("");
            setSuccessMessage("");
            return;
        }

        const updatedConfig = columnConfig.map(
            (column, columnIndex) => columnIndex === index
                ? {
                    ...column,
                    import: false,
                    backendField: ""
                }
                : column
        );
        setColumnConfig(updatedConfig);
        setError("");
        setSuccessMessage("");
    };

    const handleBackendFieldChange = (index, field) => {
        const updatedConfig = columnConfig.map(
            (column, columnIndex) =>
                columnIndex === index ? {
                    ...column,
                    backendField: field,
                }
                    : column
        );
        setColumnConfig(updatedConfig);
        setError("");
        setSuccessMessage("");
    };

    const handleDisplayNameChange = (index, displayName) => {
        const updatedConfig = columnConfig.map((column, columnIndex) =>
            columnIndex === index ? {
                ...column,
                displayName,
            } : column

        );
        setColumnConfig(updatedConfig);
        setError("");
        setSuccessMessage("");
    };

    const handleConfirm = async () => {
        if (!file) {
            setError("Please select a CSV file");
            return;
        }

        if (!datasetName.trim()) {
            setError("Please enter a dataset name");
            return;
        }

        if (datasetName.trim().length > 120) {
            setError("Dataset name must be at most 120 characters");
            return;
        }

        if(!timestampColumn){
            setError("Please select a timestamp column before confirming the upload");

            return;
        }

        // Timestamp validation:
        // Re-check before sending so the frontend never knowingly submits
        // an invalid timestamp mapping.
        if (!isValidTimestampColumn(timestampColumn, allRows)) {
            setError(
                "The selected timestamp column contains an invalid or empty timestamp value."
            );
            return;
        }

        if (allRows.length === 0) {
            setError("CSV file does not contain any data.");
            return;
        }

        const selectedSensors = columnConfig.filter((column) => column.import);

        if (selectedSensors.length === 0) {
            setError("Please select at least one sensor column");
            return;
        }

        if (selectedSensors.length > 8) {
            setError("A maximum of 8 sensor columns can be imported");

            return;
        }

        const missingBackendField = selectedSensors.some((column) => !column.backendField);

        if (missingBackendField) {
            setError("Please select a backend field for every imported sensor.");
            return;
        }

        const backendFields = selectedSensors.map((column) => column.backendField);
        if (new Set(backendFields).size !== backendFields.length) {
            setError("Each sensor must use a different backend field");
            return;
        }

        const missingDisplayName = selectedSensors.some((column) => !column.displayName.trim());
        if (missingDisplayName) {
            setError("Please enter a display name for imported sensor.");
            return;
        }

        const displayNames = selectedSensors.map((column) => column.displayName.trim().toLowerCase());
        if (new Set(displayNames).size !== displayNames.length) {
            setError("Display names must be unique.");
            return;
        }

        const invalidDisplayName = selectedSensors.some(
            (column) => column.displayName.trim().length > 120
        );

        if (invalidDisplayName) {
            setError("Display names must be at most 120 characters.");
            return;
        }

        setError("");
        setSuccessMessage("");

        const sensorMappings = selectedSensors.map((column) => ({
            sourceField: column.columnName,
            storageField: column.backendField,
            displayName: column.displayName.trim(),
            sourceDataType: "number",
        }));

        const uploadConfig = {
            name: datasetName.trim(),
            timestampField: timestampColumn,
            mappings: sensorMappings,
            rows: allRows,
        };

        try {
            setIsSubmitting(true);

            await createDataset(uploadConfig);

            setSuccessMessage("Dataset uploaded successfully.");
            onClose();
        } catch (err) {
            console.error(err);

            const backendError = err.response?.data?.error;

            if (backendError?.fields) {
                const firstFieldError = Object.values(backendError.fields)[0];

                setError(
                    firstFieldError ||
                    backendError.message ||
                    "Unable to upload dataset."
                );
            } else {
                setError(
                    backendError?.message ||
                    "Unable to upload dataset. Please try again."
                );
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const selectedSensorCount = columnConfig.filter((column) => column.import).length;




    return (
        <div className="dialog-overlay">
            <div className="upload-dialog">

                <div className="dialog-header">
                    <h2>Upload Dataset</h2>

                    <button type="button" className="close-dialog" onClick={onClose}>
                        x
                    </button>
                </div>

                <p>
                    Upload a CSV file and preview data.
                </p>

                <div className="file-section">
                    <label htmlFor="dataset-file">
                        Select CSV File
                    </label>

                    <input id="dataset-file" type="file" accept=".csv"
                        onChange={
                            handleFileChange
                        }
                    />
                    {file && (
                        <p className="selected-file">
                            Selected:{" "} <strong>{file.name}</strong>
                        </p>
                    )}
                </div>

                {file && (
                    <div className="file-section">
                        <label htmlFor="dataset-name">
                            Dataset Name
                        </label>

                        <input
                            id="dataset-name"
                            type="text"
                            value={datasetName}
                            maxLength={120}
                            onChange={(event) => {
                                setDatasetName(event.target.value);
                                setError("");
                                setSuccessMessage("");
                            }}
                            placeholder="Enter dataset name"
                        />
                    </div>
                )}

                {error && (
                    <div className="error-message" role="alert">
                        {error}
                    </div>
                )}

                {successMessage && (
                    <div className="selected-file" role="status">
                        {successMessage}
                    </div>
                )}

                {columns.length > 0 && (

                    <div className="timestamp-section">
                        <h3>Timestamp Column</h3>
                        <p> Select the column that contains the timestamp for each sensor reading.</p>
                        <select value={timestampColumn} onChange={handleTimestampChange}>
                            <option value=""> Select timestamp column</option>

                            {columns
                                .filter((column) =>
                                    isValidTimestampColumn(column, allRows)
                                )
                                .map((column) => (
                                    <option key={column} value={column}>
                                        {column}</option>
                                )
                                )}

                        </select>
                        {timestampColumn && (
                            <p className="timestamp-detected">
                                Selected timestamp:{" "}
                                <strong>{timestampColumn}</strong>
                            </p>
                        )}
                    </div>
                )}

                {columnConfig.length > 0 && (
                    <div className="sensor-field-section">
                        <div className="sensor-field-header">
                            <div>
                                <h3>Select Sensor Fields</h3>
                                <p> Select up to eight numeric columns to import and configure how they will be stored. </p>
                            </div>

                            <span className="field-count">
                                {selectedSensorCount}
                                {" / 8 selected"}
                            </span>
                        </div>

                        <div className="column-config-wrapper">
                            <table className="column-config-table">
                                <thead>
                                    <tr>
                                        <th> Import</th>
                                        <th> Column Name</th>
                                        <th> Data Type </th>
                                        <th> Store As </th>
                                        <th> Display Name</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {columnConfig.map((column, index) => {
                                        const isNumeric = column.dataType === "Number";
                                        return (
                                            <tr key={column.columnName}>
                                                <td>
                                                    <input type="checkbox" checked={column.import} disabled={!isNumeric} onChange={() => handleImportChange(index)} />
                                                </td>
                                                <td>
                                                    <strong>{column.columnName}</strong>
                                                </td>
                                                <td>
                                                    <span className={isNumeric ? "data-type data-type--number" : "data-type data-type--text"}>
                                                        {column.dataType}
                                                    </span>
                                                </td>
                                                <td>
                                                    {isNumeric ? (
                                                        <select value={column.backendField} disabled={!column.import} onChange={(event) =>
                                                            handleBackendFieldChange(index, event.target.value)} >
                                                            <option value=""> Select field </option>
                                                            {predefinedFields.map((field) => {
                                                                const alreadyUsed = columnConfig.some((item, itemIndex) =>
                                                                    item.backendField === field && itemIndex !== index);
                                                                return (
                                                                    <option key={field} value={field} disabled={alreadyUsed}>
                                                                        {field}
                                                                    </option>
                                                                );
                                                            })}
                                                        </select>
                                                    ) : (
                                                        <span className="not-available"> Not available</span>)}
                                                </td>
                                                <td>
                                                    {isNumeric ? (
                                                        <input type="text" value={column.displayName} disabled={!column.import} placeholder="Display name" onChange={(event) =>
                                                            handleDisplayNameChange(index, event.target.value)} />
                                                    ) : (<span className="not-available"> — </span>)}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>

                        </div>

                    </div>
                )}


                {previewData.length >
                    0 && (
                        <div className="preview-section">

                            <h3>
                                CSV Preview
                            </h3>

                            <p>
                                Showing the first{" "}
                                {previewData.length}{" "}
                                rows.
                            </p>

                            <div className="preview-table-wrapper">

                                <table className="preview-table">

                                    <thead>

                                        <tr>

                                            {columns.map((column) => (
                                                <th key={column}>
                                                    {column}
                                                </th>
                                            ))}

                                        </tr>

                                    </thead>

                                    <tbody>

                                        {previewData.map((row, rowIndex) => (
                                            <tr key={rowIndex}>
                                                {columns.map((column) => (
                                                    <td key={column}>
                                                        {row[column]}
                                                    </td>

                                                ))}
                                            </tr>

                                        ))}

                                    </tbody>

                                </table>

                            </div>

                        </div>
                    )}



                <div className="dialog-actions">

                    <button type="button" className="cancel-button" onClick={onClose} disabled={isSubmitting}>Cancel </button>
                    <button type="button" className="confirm-button" onClick={handleConfirm} disabled={!file || !timestampColumn || isSubmitting}>
                        {isSubmitting ? "Uploading..." : "Confirm"}
                    </button>

                </div>

            </div>

        </div>
    );
};

export default UploadDatasetDialog;
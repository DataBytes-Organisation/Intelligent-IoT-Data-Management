from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd

from main import detect_correlation_change_alert as run_correlation_pipeline

app = Flask(__name__)
CORS(app)


@app.route("/health", methods=["GET"])
def health():
    return jsonify({
        "status": "running",
        "message": "Correlation Alert Service is running.",
        "service": "correlation-alert-api"
    })


@app.route("/detect-correlation-alert", methods=["POST"])
def detect_correlation_alert_api():
    try:
        # OPTION 1: CSV file upload using multipart/form-data
        if "file" in request.files:
            uploaded_file = request.files["file"]

            df = pd.read_csv(uploaded_file)
            df.columns = df.columns.str.strip()

            timestamp_col = request.form.get("timestamp_col")
            selected_streams = request.form.get("selected_streams")
            window_size = int(request.form.get("window_size", 30))
            step_size = int(request.form.get("step_size", 5))
            method = request.form.get("method", "pearson")

            if selected_streams:
                selected_streams = [col.strip() for col in selected_streams.split(",")]

        # OPTION 2: JSON input
        else:
            body = request.get_json()

            data = body.get("data")
            timestamp_col = body.get("timestamp_col")
            selected_streams = body.get("selected_streams")
            window_size = body.get("window_size", 30)
            step_size = body.get("step_size", 5)
            method = body.get("method", "pearson")

            if data is None:
                return jsonify({"error": "Missing 'data' in request body."}), 400

            df = pd.DataFrame(data)
            df.columns = df.columns.str.strip()

        if timestamp_col is None:
            return jsonify({"error": "Missing 'timestamp_col'."}), 400

        if selected_streams is None:
            return jsonify({"error": "Missing 'selected_streams'."}), 400

        result = run_correlation_pipeline(
            df,
            timestamp_col,
            selected_streams,
            window_size,
            step_size,
            method
        )

        alerts = result["alerts"]
        changes = result["changes"]

        correlations = []

        for item in result["correlation_results"]:
            correlations.append({
                "window_index": item["window_index"],
                "start_time": str(item["start_time"]),
                "end_time": str(item["end_time"]),
                "window_size": item["window_size"],
                "correlation_matrix": item["correlation_matrix"].round(4).to_dict()
            })

        response = {
            "status": "success",
            "summary": {
                "processed_rows": len(result["processed_data"]),
                "windows": len(result["windows"]),
                "correlation_results": len(result["correlation_results"]),
                "changes": len(changes),
                "alerts": len(alerts)
            },
            "correlations": correlations,
            "alerts": alerts,
            "changes": changes
        }

        return jsonify(response), 200

    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

if __name__ == "__main__":
    app.run(debug=True, port=5001)
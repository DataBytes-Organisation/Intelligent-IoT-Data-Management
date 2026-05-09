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
        body = request.get_json()

        data = body.get("data")
        timestamp_col = body.get("timestamp_col")
        selected_streams = body.get("selected_streams")
        window_size = body.get("window_size", 30)
        step_size = body.get("step_size", 5)
        method = body.get("method", "pearson")

        if data is None:
            return jsonify({"error": "Missing 'data' in request body."}), 400

        if timestamp_col is None:
            return jsonify({"error": "Missing 'timestamp_col' in request body."}), 400

        if selected_streams is None:
            return jsonify({"error": "Missing 'selected_streams' in request body."}), 400

        df = pd.DataFrame(data)
        df.columns = df.columns.str.strip()

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

        response = {
            "status": "success",
            "summary": {
                "processed_rows": len(result["processed_data"]),
                "windows": len(result["windows"]),
                "correlation_results": len(result["correlation_results"]),
                "changes": len(changes),
                "alerts": len(alerts)
            },
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
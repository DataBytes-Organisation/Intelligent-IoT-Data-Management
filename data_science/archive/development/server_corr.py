import sys
import os
import pandas as pd
from flask import Flask, request, jsonify, send_file
import json
import numpy as np
from pathlib import Path

from test import get_dataset, get_corr

UPLOAD_FOLDER = os.path.join('data_science', 'storage')

# ensure the project root is on the import path
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

from data_science.development.choose_algorithm import choose_algorithm

app = Flask(__name__)


@app.route('/')
def home():
    return "Server is up. POST JSON to /analyze"


BASE_DIR = os.path.abspath(os.path.dirname(__file__))
DATASET_PATH = os.path.abspath(os.path.join(BASE_DIR, '..', 'datasets', 'complex.csv'))
STORAGE_DIR = os.path.abspath(os.path.join(BASE_DIR, '..', 'storage'))


@app.route('/analyze-csv', methods=['POST'])
def analyzeCsv():
    # selected = json.loads(request.args.get('selected')) if request.args.get('selected') else []
    # print('window_size',request.args.get('window_size'))
    # print('window_size',request.args.get('selected'))
    # selected = ['data_point'] + selected

    uploaded_file = request.files.get('file')
    window_size = int(request.form.get('window_size')) if request.form.get('window_size') else None
    print('window_size', window_size)

    file_path = get_dataset(uploaded_file, "data_point", window_size)
    print('file_path', file_path)

    base_dir = Path(__file__).parent.parent.parent  # moves up from scripts/ to development/
    csv_path = base_dir / file_path

    try:
        return send_file(
            csv_path,
            mimetype="text/csv",
            as_attachment=True,  # bật để trình duyệt tự download
            download_name='report.csv'  # tên file khi download
        )
    except Exception as e:
        return jsonify({"success": False, "message": ""})


@app.route('/analyze', methods=['POST'])
def analyze():
    streams = json.loads(request.form.get('streams')) if request.form.get('streams') else []
    start_date = request.form.get('start_date')
    end_date = request.form.get('end_date')
    threshold = float(request.form.get('threshold')) if request.form.get('threshold') else None
    algo_type = request.form.get('algo_type')

    uploaded_file = request.files.get('file')
    if not uploaded_file:
        return 'No files were sent', 400

    if uploaded_file.filename == '':
        return 'No files selected', 400

    os.makedirs(UPLOAD_FOLDER, exist_ok=True)

    save_path = os.path.join(UPLOAD_FOLDER, uploaded_file.filename)
    uploaded_file.save(save_path)

    try:
        # Read CSV directly from file path
        df = pd.read_csv(save_path, parse_dates=['created_at'])
        df.sort_values(by='created_at', inplace=True)
        df.set_index('created_at', inplace=True)
        df = df.interpolate()

    except Exception as e:
        return f'Error in reading CSV: {e}', 400

    # run analysis
    try:
        result = choose_algorithm(df, streams, start_date, end_date, threshold, algo_type)
    except Exception as e:
        print('e', e)
        return jsonify({'error': str(e)}), 400

    print('result', result)

    clean_result = {}
    for stream, metrics in result.items():
        clean_metrics = {k: to_native(v) for k, v in metrics.items()}
        clean_result[stream] = clean_metrics

    return jsonify({"result": clean_result})


@app.route('/analyze-corr', methods=['POST'])
def analyze_corr():
    uploaded_file = request.files.get('file')
    time_col = request.form.get('time_col') if request.form.get('time_col') else 'data_point'
    window_size = int(request.form.get('window_size')) if request.form.get('window_size') else 15
    output_dir = request.form.get('output_dir')
    start_year = int(request.form.get('start_year')) if request.form.get('start_year') else 2025
    start_month = int(request.form.get('start_month')) if request.form.get('start_month') else 1
    start_day = int(request.form.get('start_day')) if request.form.get('start_day') else 1
    start_hour = int(request.form.get('start_hour')) if request.form.get('start_hour') else 0
    start_minute = int(request.form.get('start_minute')) if request.form.get('start_minute') else 0
    start_second = int(request.form.get('start_second')) if request.form.get('start_second') else 0
    end_year = int(request.form.get('end_year')) if request.form.get('end_year') else 2025
    end_month = int(request.form.get('end_month')) if request.form.get('end_month') else 1
    end_day = int(request.form.get('end_day')) if request.form.get('end_day') else 6
    end_hour = int(request.form.get('end_hour')) if request.form.get('end_hour') else 0
    end_minute = int(request.form.get('end_minute')) if request.form.get('end_minute') else 10
    end_second = int(request.form.get('end_second')) if request.form.get('end_second') else 0

    corrs = get_corr(uploaded_file, time_col, window_size, output_dir, start_year, start_month, start_day, start_hour,
                         start_minute, start_second, end_year, end_month, end_day, end_hour, end_minute, end_second, )

    return jsonify({"success": True, "corrs": corrs})


def to_native(val):
    if isinstance(val, np.generic):
        return val.item()
    return val


if __name__ == "__main__":
    # debug=True for auto-reload on edits
    app.run(host="0.0.0.0", port=5000, debug=True)

import pandas as pd
import numpy as np
import os
import matplotlib.pyplot as plt
import tkinter as tk
from tkinter import ttk

# --- Paths Setup ---
BASE_DIR = os.path.abspath(os.path.dirname(__file__))
DATASET_PATH = os.path.abspath(os.path.join(BASE_DIR, '..', 'datasets', 'complex.csv'))
STORAGE_DIR = os.path.abspath(os.path.join(BASE_DIR, '..', 'storage'))
os.makedirs(STORAGE_DIR, exist_ok=True)

# --- Data Functions ---
def load_data(csv_file):
    df = pd.read_csv(csv_file)
    original_time_col = df.columns[0]
    df.rename(columns={original_time_col: 'data_point'}, inplace=True)
    df['data_point'] = list(range(len(df)))
    min_dp = df['data_point'].min()
    max_dp = df['data_point'].max()
    return df, min_dp, max_dp, 'data_point'


def normalize_data(df, time_col='data_point'):
    df = df.copy()
    df.dropna(how='all', inplace=True)
    df.dropna(axis=1, how='all', inplace=True)
    sensor_cols = [c for c in df.columns if c != time_col]
    numeric_cols = df[sensor_cols].select_dtypes(include=[np.number]).columns.tolist()
    df[numeric_cols] = df[numeric_cols].interpolate(method='linear', limit_direction='both')
    df.dropna(how='any', inplace=True)
    return df[[time_col] + numeric_cols]


def compute_sliding_correlations(df, window_size, time_col='data_point'):
    stream_cols = df.columns.drop(time_col)
    correlations = {}
    for i in range(len(stream_cols)):
        for j in range(i + 1, len(stream_cols)):
            s1, s2 = stream_cols[i], stream_cols[j]
            corrs = []
            for start in range(len(df) - window_size + 1):
                window = df.iloc[start:start + window_size]
                corrs.append(window[s1].corr(window[s2]))
            correlations[(s1, s2)] = corrs
    return correlations


def save_correlations(df, correlations, output_dir, time_col='data_point'):
    df_to_save = df.copy()
    for (s1, s2), vals in correlations.items():
        col_name = f'c({s1},{s2})'
        padding = [None] * (len(df_to_save) - len(vals)) + vals
        df_to_save[col_name] = padding
    out_path = os.path.join(output_dir, 'complex_formatted.csv')
    df_to_save.to_csv(out_path, index=False)
    print(f'Saved correlations to: {out_path}')


def plot_with_correlation(df, correlations, window_size, time_col='data_point'):
    t = df[time_col].values
    for (s1, s2), vals in correlations.items():
        fig, ax = plt.subplots(figsize=(10, 5))
        ax.plot(t, df[s1], label=s1)
        ax.plot(t, df[s2], label=s2)
        corr_arr = np.full(len(df), np.nan)
        corr_arr[window_size - 1:] = vals
        ax.plot(t, corr_arr, label=f'Corr({s1},{s2})', linestyle='--')
        ax.set_title(f'{s1} vs {s2} with Sliding Correlation')
        ax.set_xlabel(time_col)
        ax.set_ylabel('Value')
        ax.legend()
        fig.tight_layout()
        plt.show()

# --- GUI Setup ---
def setup_gui(min_dp, max_dp, sensor_cols, callback):
    root = tk.Tk()
    root.title('Window Slider Correlation')
    root.geometry('600x400')
    frame = ttk.Frame(root, padding=10)
    frame.pack(fill=tk.BOTH, expand=True)

    ttk.Label(frame, text='Window Size:').grid(row=0, column=0, sticky='w')
    entry = ttk.Entry(frame, width=5)
    entry.insert(0, '15')
    entry.grid(row=0, column=1, sticky='w')

    slider = tk.Scale(frame, from_=1, to=max_dp, orient=tk.HORIZONTAL, length=300)
    slider.set(15)
    slider.grid(row=1, column=0, columnspan=3, pady=10)

    def sync_entry(_):
        try:
            v = int(entry.get())
            if 1 <= v <= max_dp:
                slider.set(v)
        except: pass
    entry.bind('<KeyRelease>', sync_entry)

    slider.config(command=lambda v: entry.delete(0, tk.END) or entry.insert(0, str(int(float(v)))))

    ttk.Label(frame, text='Select Streams:').grid(row=2, column=0, sticky='nw', pady=5)
    vars_map = {}
    for idx, col in enumerate(sensor_cols):
        var = tk.BooleanVar(value=True)
        chk = ttk.Checkbutton(frame, text=col, variable=var)
        chk.grid(row=2 + idx // 3, column=1 + idx % 3, sticky='w')
        vars_map[col] = var

    def on_display():
        try:
            w = int(entry.get())
            callback(w, vars_map)
        except Exception as e:
            print('Error:', e)

    ttk.Button(frame, text='Display', command=on_display).grid(row=6, column=0, columnspan=4, pady=15)
    return root

# --- Callback Logic ---
def process_callback(window_size, stream_vars):
    selected = ['data_point'] + [s for s, var in stream_vars.items() if var.get()]
    df_sel = df_raw[selected]
    df_norm = normalize_data(df_sel)
    corrs = compute_sliding_correlations(df_norm, window_size)
    plot_with_correlation(df_norm, corrs, window_size)
    save_correlations(df_norm, corrs, STORAGE_DIR)

# --- Main ---
if __name__ == '__main__':
    df_raw, min_dp, max_dp, time_col = load_data(DATASET_PATH)
    sensor_cols = [c for c in df_raw.columns if c != time_col]
    root = setup_gui(min_dp, max_dp, sensor_cols, process_callback)
    root.mainloop()

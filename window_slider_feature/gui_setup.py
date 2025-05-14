import tkinter as tk
from tkinter import ttk
from datetime import datetime

def setup_gui(min_dp, max_dp, sensor_columns, process_callback):
    """
    Sets up the Tkinter GUI for selecting window size and stream types.
    The stream selection checkboxes are generated dynamically based on the available sensor columns.

    Parameters:
        min_dp (int): Minimum value of the data point index.
        max_dp (int): Maximum value of the data point index.
        sensor_columns (list): List of available sensor stream column names.
        process_callback (function): Function to call when the Display button is clicked.

    Returns:
        root (tk.Tk): The root window of the Tkinter interface.
    """
    root = tk.Tk()
    root.title("Window Size & Stream Selector + Normalization")
    root.geometry("500x300")
    root.configure(bg="#f9f9f9")

    style = ttk.Style()
    style.configure("TLabel", font=("Segoe UI", 10, "bold"), background="#f9f9f9")
    style.configure("TButton", font=("Segoe UI", 10))
    style.configure("TCheckbutton", font=("Segoe UI", 10), background="#f9f9f9")

    # Window Size Label and Entry
    ttk.Label(root, text="Window Size:").grid(row=0, column=0, padx=10, pady=10)
    window_entry = ttk.Entry(root, width=10)
    window_entry.insert(0, "15")
    window_entry.grid(row=0, column=1, sticky="w")

    # Window Size Slider
    window_slider = tk.Scale(root, from_=1, to=max_dp, orient=tk.HORIZONTAL, length=250, bg="#f9f9f9")
    window_slider.set(15)
    window_slider.grid(row=1, column=0, columnspan=3, padx=10)

    def sync_slider_and_entry(*args):
        try:
            val = int(window_entry.get())
            if 1 <= val <= max_dp:
                window_slider.set(val)
        except ValueError:
            pass

    def sync_entry_and_slider(val):
        window_entry.delete(0, tk.END)
        window_entry.insert(0, str(int(float(val))))

    window_entry.bind("<KeyRelease>", lambda e: sync_slider_and_entry())
    window_slider.config(command=sync_entry_and_slider)

    # Dynamic Stream Selection
    ttk.Label(root, text="Select Streams:").grid(row=2, column=0, padx=10, pady=10)
    stream_vars = {}
    for idx, stream in enumerate(sensor_columns):
        var = tk.BooleanVar(value=True)
        chk = ttk.Checkbutton(root, text=stream, variable=var)
        chk.grid(row=2 + idx // 3, column=1 + idx % 3, sticky="w", padx=5)
        stream_vars[stream] = var

    # Display Button
    def on_click():
        try:
            window_size = int(window_entry.get())
            if 1 <= window_size <= max_dp:
                process_callback(window_size, stream_vars)
            else:
                print("Invalid window size")
        except ValueError:
            print("Please enter a valid integer for window size.")

    ttk.Button(root, text="Display", command=on_click).grid(row=3, columnspan=4, pady=20)

    return root
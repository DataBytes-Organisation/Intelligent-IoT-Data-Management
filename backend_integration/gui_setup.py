import tkinter as tk
from tkinter import ttk
from tkcalendar import DateEntry
from datetime import datetime, timedelta
import os

def setup_gui(min_datetime, max_datetime, process_callback):
    """
    Builds a GUI for selecting a time range, window size, and sensor streams
    with valid constraints based on available data. Syncs user input via both
    entry boxes and dropdowns to avoid invalid selections.

    Parameters:
        min_datetime (datetime): Earliest timestamp in the dataset.
        max_datetime (datetime): Latest timestamp in the dataset.
        process_callback (function): Callback to execute on user submission.
    """
    root = tk.Tk()
    root.title("Time Range & Stream Selector + Correlation Viewer")
    root.geometry("600x250")
    root.configure(bg="#f9f9f9")

    # --- Styling ---
    style = ttk.Style()
    style.configure("TLabel", font=("Segoe UI", 10, "bold"), background="#f9f9f9")
    style.configure("TButton", font=("Segoe UI", 10))
    style.configure("TCheckbutton", font=("Segoe UI", 10), background="#f9f9f9")

    # --- Time restriction helpers ---
    def get_allowed_hours(date, for_start):
        if date == min_datetime.date() and date == max_datetime.date():
            return [f"{h:02d}" for h in range(min_datetime.hour, max_datetime.hour + 1)]
        elif for_start and date == min_datetime.date():
            return [f"{h:02d}" for h in range(min_datetime.hour, 24)]
        elif not for_start and date == max_datetime.date():
            return [f"{h:02d}" for h in range(0, max_datetime.hour + 1)]
        return [f"{h:02d}" for h in range(0, 24)]

    def get_allowed_minutes(date, hour, for_start):
        hour = int(hour)
        if date == min_datetime.date() and date == max_datetime.date():
            if hour == min_datetime.hour and hour == max_datetime.hour:
                return [f"{m:02d}" for m in range(min_datetime.minute, max_datetime.minute + 1)]
            elif hour == min_datetime.hour:
                return [f"{m:02d}" for m in range(min_datetime.minute, 60)]
            elif hour == max_datetime.hour:
                return [f"{m:02d}" for m in range(0, max_datetime.minute + 1)]
        elif for_start and date == min_datetime.date() and hour == min_datetime.hour:
            return [f"{m:02d}" for m in range(min_datetime.minute, 60)]
        elif not for_start and date == max_datetime.date() and hour == max_datetime.hour:
            return [f"{m:02d}" for m in range(0, max_datetime.minute + 1)]
        return [f"{m:02d}" for m in range(0, 60)]

    def get_allowed_seconds(date, hour, minute, for_start):
        hour = int(hour)
        minute = int(minute)
        if date == min_datetime.date() and date == max_datetime.date():
            if hour == min_datetime.hour and minute == min_datetime.minute and hour == max_datetime.hour and minute == max_datetime.minute:
                return [f"{s:02d}" for s in range(min_datetime.second, max_datetime.second + 1)]
            elif hour == min_datetime.hour and minute == min_datetime.minute:
                return [f"{s:02d}" for s in range(min_datetime.second, 60)]
            elif hour == max_datetime.hour and minute == max_datetime.minute:
                return [f"{s:02d}" for s in range(0, max_datetime.second + 1)]
        elif for_start and date == min_datetime.date() and hour == min_datetime.hour and minute == min_datetime.minute:
            return [f"{s:02d}" for s in range(min_datetime.second, 60)]
        elif not for_start and date == max_datetime.date() and hour == max_datetime.hour and minute == max_datetime.minute:
            return [f"{s:02d}" for s in range(0, max_datetime.second + 1)]
        return [f"{s:02d}" for s in range(0, 60)]

    # --- START datetime widgets ---
    ttk.Label(root, text="Start Date:").grid(row=0, column=0)
    start_date = DateEntry(root, date_pattern="y-mm-dd", mindate=min_datetime.date(), maxdate=max_datetime.date())
    start_date.set_date(min_datetime.date())
    start_date.grid(row=0, column=1)

    ttk.Label(root, text="Start Time:").grid(row=0, column=2)
    start_hour = ttk.Combobox(root, width=3)
    start_min = ttk.Combobox(root, width=3)
    start_sec = ttk.Combobox(root, width=3)
    start_hour.grid(row=0, column=3)
    start_min.grid(row=0, column=4)
    start_sec.grid(row=0, column=5)

    # --- END datetime widgets ---
    ttk.Label(root, text="End Date:").grid(row=1, column=0)
    end_date = DateEntry(root, date_pattern="y-mm-dd", mindate=min_datetime.date(), maxdate=max_datetime.date())
    end_date.set_date(max_datetime.date())
    end_date.grid(row=1, column=1)

    ttk.Label(root, text="End Time:").grid(row=1, column=2)
    end_hour = ttk.Combobox(root, width=3)
    end_min = ttk.Combobox(root, width=3)
    end_sec = ttk.Combobox(root, width=3)
    end_hour.grid(row=1, column=3)
    end_min.grid(row=1, column=4)
    end_sec.grid(row=1, column=5)

    # --- Window Size Entry + Slider ---
    ttk.Label(root, text="Window Size:").grid(row=2, column=0, padx=10, pady=10)
    window_size_box = ttk.Entry(root, width=6)
    window_size_box.insert(0, "15")
    window_size_box.grid(row=2, column=1)

    window_slider = tk.Scale(root, from_=1, to=500, orient=tk.HORIZONTAL, length=200, bg="#f9f9f9")
    window_slider.set(15)
    window_slider.grid(row=2, column=2, columnspan=3, padx=5)

    def sync_slider(*args):
        try:
            window_slider.set(int(window_size_box.get()))
        except ValueError:
            pass

    def sync_box(val):
        window_size_box.delete(0, tk.END)
        window_size_box.insert(0, str(int(float(val))))

    window_size_box.bind("<KeyRelease>", lambda e: sync_slider())
    window_slider.config(command=sync_box)

    # --- Stream selection checkboxes ---
    ttk.Label(root, text="Select Streams:").grid(row=3, column=0, padx=10, pady=10)
    stream_vars = {}
    for idx, stream in enumerate(["s1", "s2", "s3"]):
        var = tk.BooleanVar(value=True)
        chk = ttk.Checkbutton(root, text=stream, variable=var)
        chk.grid(row=3, column=1 + idx)
        stream_vars[stream] = var

    # --- Dynamic option refresh logic ---
    def refresh_start(*_):
        d = start_date.get_date()
        h_vals = get_allowed_hours(d, True)
        start_hour["values"] = h_vals
        start_hour.set(h_vals[0])
        refresh_start_min()

    def refresh_start_min(*_):
        d = start_date.get_date()
        h = start_hour.get()
        m_vals = get_allowed_minutes(d, h, True)
        start_min["values"] = m_vals
        start_min.set(m_vals[0])
        refresh_start_sec()

    def refresh_start_sec(*_):
        d = start_date.get_date()
        h = start_hour.get()
        m = start_min.get()
        s_vals = get_allowed_seconds(d, h, m, True)
        start_sec["values"] = s_vals
        start_sec.set(s_vals[0])

    def refresh_end(*_):
        d = end_date.get_date()
        h_vals = get_allowed_hours(d, False)
        end_hour["values"] = h_vals
        end_hour.set(h_vals[-1])
        refresh_end_min()

    def refresh_end_min(*_):
        d = end_date.get_date()
        h = end_hour.get()
        m_vals = get_allowed_minutes(d, h, False)
        end_min["values"] = m_vals
        end_min.set(m_vals[-1])
        refresh_end_sec()

    def refresh_end_sec(*_):
        d = end_date.get_date()
        h = end_hour.get()
        m = end_min.get()
        s_vals = get_allowed_seconds(d, h, m, False)
        end_sec["values"] = s_vals
        end_sec.set(s_vals[-1])

    # --- Event triggers ---
    for w in [start_date, end_date]: w.bind("<<DateEntrySelected>>", lambda e: [refresh_start(), refresh_end()])
    for w in [start_hour, start_min]: w.bind("<<ComboboxSelected>>", lambda e: refresh_start_sec())
    for w in [end_hour, end_min]: w.bind("<<ComboboxSelected>>", lambda e: refresh_end_sec())

    refresh_start()
    refresh_end()

    # --- Display button ---
    def on_click():
        process_callback(window_size_box, start_date, start_hour, start_min, start_sec,
                         end_date, end_hour, end_min, end_sec, stream_vars)

    ttk.Button(root, text="Display", command=on_click).grid(row=5, column=0, columnspan=6, pady=20)

    root.mainloop()

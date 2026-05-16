import pandas as pd
from bokeh.plotting import figure, show
from bokeh.io import output_notebook, show
from datetime import datetime


def box_plot(df, streams, start_date, end_date):
    """
    Create interactive boxplots for multiple sensor streams using Bokeh.
    """
    # Add created_at column and ensure datetime
    if "created_at" in df.columns:
        df["created_at"] = pd.to_datetime(df["created_at"], errors="coerce").dt.tz_localize(None)
        
        # Date filtering
        if start_date or end_date:
            df = df[df["created_at"].between(
                pd.to_datetime(start_date) if start_date else df["created_at"].min(),
                pd.to_datetime(end_date) if end_date else df["created_at"].max()
            )]

    # Default: all numeric columns except created_at
    if streams is None:
        streams = df.select_dtypes(include="number").columns.tolist()

    # Prepare Box Plot
    p = figure(title="Boxplots of Sensor Streams", 
               tools="pan,box_zoom,reset,save", 
               width=600, height=400, x_range=streams)

    # Iterate over streams
    for i, col in enumerate(streams):
        values = df[col].dropna()
        if values.empty:
            continue

        # Quartiles
        q1 = values.quantile(0.25)
        q2 = values.quantile(0.50)
        q3 = values.quantile(0.75)
        iqr = q3 - q1
        upper = values[values <= q3 + 1.5 * iqr].max()
        lower = values[values >= q1 - 1.5 * iqr].min()
        outliers = values[(values > upper) | (values < lower)]

        # Box (Q1–Q3)
        p.vbar(x=col, width=0.7, bottom=q1, top=q3, fill_color="lightblue", line_color="black")

        # Median line
        p.segment(x0=col, y0=q2, x1=col, y1=q2, line_width=2, line_color="black")

        # Whiskers
        p.segment(x0=col, y0=q3, x1=col, y1=upper, line_color="black")
        p.segment(x0=col, y0=q1, x1=col, y1=lower, line_color="black")

        # Whisker caps
        p.rect(x=col, y=upper, width=0.2, height=0.01, line_color="black")
        p.rect(x=col, y=lower, width=0.2, height=0.01, line_color="black")

        # Outliers
        if not outliers.empty:
            p.circle(x=[col]*len(outliers), y=outliers, size=6, color="red", alpha=0.6)

    p.yaxis.axis_label = "Value"
    show(p)

import pandas as pd
from bokeh.io import output_notebook, show
from bokeh.layouts import column
from bokeh.models import ColumnDataSource, DataTable, TableColumn, Button, CustomJS
from datetime import datetime


def create_filtered_table(df, streams, start_date, end_date):
    """
    Create a Bokeh DataTable from the provided DataFrame filtered by a date range,
    and add a download button to export the filtered data as CSV.

    Parameters:
    -----------
    df : pandas.DataFrame
        DataFrame containing data with a 'created_at' column (datetime).
    streams : list of str
        List of column names to display.
    start_date : datetime or str
        Start datetime.
    end_date : datetime or str
        End datetime.

    Returns:
    --------
    None
        Displays the DataTable with a CSV download button.
    """
    output_notebook()
    # Convert start_date and end_date to datetime if necessary
    if isinstance(start_date, str):
        start_date = pd.to_datetime(start_date)
    if isinstance(end_date, str):
        end_date = pd.to_datetime(end_date)

    # Ensure the 'created_at' column is in datetime format without timezone
    df['created_at'] = pd.to_datetime(df['created_at']).dt.tz_localize(None)

    # Filter the DataFrame for the given date range and selected columns
    filtered_df = df[(df['created_at'] >= start_date) & (df['created_at'] <= end_date)]
    filtered_df = filtered_df[streams].dropna()

    # Create a ColumnDataSource from the filtered DataFrame
    source = ColumnDataSource(filtered_df.to_dict(orient="list"))

    # Create columns for the DataTable based on the streams list
    table_columns = [TableColumn(field=col, title=col) for col in streams]
    data_table = DataTable(source=source, columns=table_columns, width=800)

    # Create a Download CSV button with a CustomJS callback
    download_callback = CustomJS(args=dict(source=source), code="""
        function table_to_csv(source) {
            const columns = Object.keys(source.data)
            const nrows = source.get_length()
            const lines = [columns.join(',')]
            for (let i = 0; i < nrows; i++) {
                let row = []
                for (let j = 0; j < columns.length; j++) {
                    const column = columns[j]
                    row.push(source.data[column][i].toString())
                }
                lines.push(row.join(','))
            }
            return lines.join('\\n').concat('\\n')
        }
        const filename = 'filtered_data.csv'
        const filetext = table_to_csv(source)
        const blob = new Blob([filetext], { type: 'text/csv;charset=utf-8;' })
        if (navigator.msSaveBlob) {
            navigator.msSaveBlob(blob, filename)
        } else {
            const link = document.createElement('a')
            link.href = URL.createObjectURL(blob)
            link.download = filename
            link.target = '_blank'
            link.style.visibility = 'hidden'
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
        }
    """)
    download_button = Button(label="Download CSV", button_type="success")
    download_button.js_on_click(download_callback)

    # Arrange layout and display the table with the download button
    layout = column(download_button, data_table)
    show(layout)


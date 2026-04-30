import pandas as pd
from sklearn.preprocessing import MinMaxScaler

def load_and_prepare(filepath):
    """
    Load and preprocesses all the sensor data from complex.csv
    Must use a normalised dataframe / scaler.
    """
    df = pd.read_csv(filepath)
    df.columns = df.columns.str.strip()
    df['time'] = pd.date_range(start='2024-01-01', periods=len(df), freq='s')
    df = df.set_index('time')
    df = df.dropna()
    scaler = MinMaxScaler()
    df_scaled = pd.DataFrame(
        scaler.fit_transform(df),
        index=df.index,
        columns=df.columns
    )
    return df_scaled, scaler
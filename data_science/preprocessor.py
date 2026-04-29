import pandas as pd
from sklearn.preprocessing import MinMaxScaler

def load_and_prepare(filepath):
    """
    Load and preprocesses all the sensor data from complex.csv
    Must use a normalised dataframe / scaler.
    """
    
    # Load the data with time for later if needed and because its 1 line
    df = pd.read_csv(filepath, index_col='time', parse_dates=True)
    
    # drops values that are not relevant
    df = df.dropna()
    
    # Normalise to values between 0 and 1
    scaler = MinMaxScaler()
    df_scaled = pd.DataFrame(
        scaler.fit_transform(df),
        index=df.index,
        columns=df.columns
    )
    
    return df_scaled, scaler
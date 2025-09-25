#!/usr/bin/env python
# coding: utf-8

# In[25]:


import pandas as pd

def get_time_series(path):
    try:
        df = pd.read_csv(path)
    except Exception as e:
        raise ValueError(f"Error reading dataset: {e}")
    
    if "created_at" in df.columns:
        df["created_at"] = pd.to_datetime(df["created_at"], errors="coerce", utc=True)
        df = df.dropna(subset=["created_at"])
        df = df.set_index("created_at").sort_index()
        
        if "entry_id" in df.columns:
            df["entry_id"] = pd.to_numeric(df["entry_id"], errors="coerce").astype("Int64")
        
        for col in [c for c in df.columns if c.startswith("field")]:
            df[col] = pd.to_numeric(df[col], errors="coerce")
    
    elif "time" in df.columns:
        df = df.dropna(subset=["time"])
        df = df.set_index("time").sort_index()
        
        for col in [c for c in df.columns if c.startswith("s")]:
            df[col] = pd.to_numeric(df[col], errors="coerce")
    
    else:
        raise ValueError("Dataset must contain either 'created_at' or 'time' column")
    
    df = df.ffill().bfill()
    return df


# In[30]:


path = "C:/Users/yashd/Downloads/2881821.csv"


# In[31]:


get_time_series(path)


# In[ ]:





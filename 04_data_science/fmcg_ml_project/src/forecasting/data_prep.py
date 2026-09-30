"""Prepares per-SKU x Warehouse demand series for forecasting."""
import pandas as pd


def get_series(daily_demand: pd.DataFrame, sku_id: str, warehouse_id: str) -> pd.Series:
    sub = daily_demand[(daily_demand.SKU_ID == sku_id) & (daily_demand.Warehouse_ID == warehouse_id)]
    sub = sub.sort_values("calendar_date").set_index("calendar_date")
    s = sub["qty_shipped"].asfreq("D", fill_value=0)
    return s


def train_test_split_series(s: pd.Series, test_days: int = 30):
    train = s.iloc[:-test_days]
    test = s.iloc[-test_days:]
    return train, test


def list_series_keys(daily_demand: pd.DataFrame):
    return list(daily_demand.groupby(["SKU_ID", "Warehouse_ID"]).groups.keys())

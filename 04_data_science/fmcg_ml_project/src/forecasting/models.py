"""
Three forecasting approaches, weakest to strongest, plus an auto-select
wrapper that picks per SKU based on volume/pattern:

- naive_forecast          : rolling-90d average, repeated flat (== what the
                             SQL mart layer currently uses for ROP/Safety Stock)
- holt_winters_forecast    : Exponential Smoothing w/ weekly seasonality —
                             good for stable/medium-volume SKUs
- sarima_forecast          : SARIMA w/ weekly seasonality — better for
                             volatile/seasonal, higher-volume SKUs, more
                             expensive to fit

fit_forecast() is the one other modules should call; it auto-selects a method
and always falls back to the naive baseline if the statistical model fails
to converge (common on sparse/low-volume series).
"""
import warnings
import numpy as np
import pandas as pd

warnings.filterwarnings("ignore")


def naive_forecast(train: pd.Series, horizon: int, window: int = 90) -> np.ndarray:
    avg = train.iloc[-window:].mean() if len(train) >= window else train.mean()
    return np.full(horizon, max(avg, 0))


def holt_winters_forecast(train: pd.Series, horizon: int) -> np.ndarray:
    from statsmodels.tsa.holtwinters import ExponentialSmoothing
    series = train.clip(lower=0) + 1e-3  # HW multiplicative needs > 0
    model = ExponentialSmoothing(
        series, trend="add", seasonal="add", seasonal_periods=7, initialization_method="estimated"
    ).fit(optimized=True)
    fc = model.forecast(horizon)
    return np.clip(fc.values, 0, None)


def sarima_forecast(train: pd.Series, horizon: int) -> np.ndarray:
    from statsmodels.tsa.statespace.sarimax import SARIMAX
    model = SARIMAX(
        train, order=(1, 1, 1), seasonal_order=(1, 1, 0, 7),
        enforce_stationarity=False, enforce_invertibility=False,
    ).fit(disp=False)
    fc = model.forecast(horizon)
    return np.clip(fc.values, 0, None)


def fit_forecast(train: pd.Series, horizon: int, pattern: str = "medium") -> dict:
    """Returns {"values": np.ndarray, "method": str}. Always succeeds
    (falls back to naive on any failure)."""
    naive = naive_forecast(train, horizon)
    if train.sum() == 0 or len(train) < 30:
        return {"values": naive, "method": "naive_low_data"}

    try:
        if pattern == "volatile":
            values = sarima_forecast(train, horizon)
            method = "sarima"
        else:
            values = holt_winters_forecast(train, horizon)
            method = "holt_winters"
        if np.isnan(values).any():
            raise ValueError("NaN in forecast")
        return {"values": values, "method": method}
    except Exception:
        return {"values": naive, "method": "naive_fallback"}

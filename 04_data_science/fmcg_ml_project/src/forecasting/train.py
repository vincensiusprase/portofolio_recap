"""
Trains a demand forecast per SKU x Warehouse and compares it against the
naive rolling-90d-average baseline (== what the SQL mart layer uses today).

Run:
    python -m src.forecasting.train                 # all series
    python -m src.forecasting.train --limit 10       # quick smoke test
    python -m src.forecasting.train --horizon 14

Outputs:
    outputs/forecast_results.csv     one row per SKU x Warehouse x forecast day
    outputs/forecast_evaluation.csv  one row per SKU x Warehouse: model vs naive metrics
"""
import argparse
import os
import sys

import numpy as np
import pandas as pd

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
import config
from src.data.loader import get_daily_demand
from src.forecasting.data_prep import get_series, train_test_split_series, list_series_keys
from src.forecasting.models import fit_forecast, naive_forecast
from src.forecasting.evaluate import evaluate


def classify_volatility(train: pd.Series) -> str:
    """Data-driven substitute for the synthetic 'pattern' label: high
    coefficient of variation => treat as volatile/seasonal (use SARIMA)."""
    mean = train.mean()
    cv = train.std() / mean if mean > 0 else 0
    return "volatile" if cv > 0.7 else "stable"


def run(horizon: int = 30, test_days: int = 30, limit: int = None):
    daily_demand = get_daily_demand()
    keys = list_series_keys(daily_demand)
    if limit:
        keys = keys[:limit]

    forecast_rows = []
    eval_rows = []

    for i, (sku, wh) in enumerate(keys):
        s = get_series(daily_demand, sku, wh)
        if len(s) < test_days + 30:
            continue  # not enough history to evaluate meaningfully

        train, test = train_test_split_series(s, test_days=test_days)
        pattern = classify_volatility(train)

        model_fc = fit_forecast(train, len(test), pattern=pattern)
        naive_fc = naive_forecast(train, len(test))

        model_metrics = evaluate(test.values, model_fc["values"])
        naive_metrics = evaluate(test.values, naive_fc)

        eval_rows.append({
            "SKU_ID": sku, "Warehouse_ID": wh, "method": model_fc["method"],
            "model_MAE": model_metrics["MAE"], "naive_MAE": naive_metrics["MAE"],
            "model_RMSE": model_metrics["RMSE"], "naive_RMSE": naive_metrics["RMSE"],
            "model_MAPE_%": model_metrics["MAPE_%"], "naive_MAPE_%": naive_metrics["MAPE_%"],
            "improvement_vs_naive_%": round(100 * (naive_metrics["MAE"] - model_metrics["MAE"]) / max(naive_metrics["MAE"], 1e-6), 1),
        })

        # refit on FULL series for the production forward-looking forecast
        full_fc = fit_forecast(s, horizon, pattern=pattern)
        future_dates = pd.date_range(s.index.max() + pd.Timedelta(days=1), periods=horizon, freq="D")
        for d, v in zip(future_dates, full_fc["values"]):
            forecast_rows.append({
                "SKU_ID": sku, "Warehouse_ID": wh, "forecast_date": d.date().isoformat(),
                "forecast_demand": round(float(v), 2), "method": full_fc["method"],
            })

        if (i + 1) % 20 == 0:
            print(f"  ...{i + 1}/{len(keys)} series done")

    forecast_df = pd.DataFrame(forecast_rows)
    eval_df = pd.DataFrame(eval_rows)

    forecast_path = os.path.join(config.OUTPUT_DIR, "forecast_results.csv")
    eval_path = os.path.join(config.OUTPUT_DIR, "forecast_evaluation.csv")
    forecast_df.to_csv(forecast_path, index=False)
    eval_df.to_csv(eval_path, index=False)

    print(f"\nSaved {len(forecast_df)} forecast rows -> {forecast_path}")
    print(f"Saved {len(eval_df)} evaluation rows -> {eval_path}")
    if len(eval_df):
        print("\n=== Model vs naive (rolling-90d avg) baseline, averaged across SKUs ===")
        print(eval_df[["model_MAE", "naive_MAE", "improvement_vs_naive_%"]].mean(numeric_only=True).round(2))
        win_rate = (eval_df["model_MAE"] < eval_df["naive_MAE"]).mean() * 100
        print(f"Model beats naive baseline on {win_rate:.1f}% of series")

    return forecast_df, eval_df


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--horizon", type=int, default=30, help="days to forecast forward")
    parser.add_argument("--test-days", type=int, default=30, help="holdout window for evaluation")
    parser.add_argument("--limit", type=int, default=None, help="limit number of SKU x Warehouse series (for quick runs)")
    args = parser.parse_args()
    run(horizon=args.horizon, test_days=args.test_days, limit=args.limit)

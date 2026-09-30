"""
Hierarchical clustering of SKUs by demand behavior (volume, volatility,
weekly/monthly seasonality strength) — a complementary lens to ABC (which is
purely value-based). Useful for e.g. finding SKUs to bundle/promote together,
or SKUs that need a different forecasting method.

Run:
    python -m src.clustering.demand_clustering
"""
import os
import sys

import numpy as np
import pandas as pd
from scipy.cluster.hierarchy import linkage, fcluster
from sklearn.preprocessing import StandardScaler

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
import config
from src.data.loader import get_daily_demand, get_abc


def build_sku_demand_features(daily_demand: pd.DataFrame) -> pd.DataFrame:
    rows = []
    for sku, grp in daily_demand.groupby("SKU_ID"):
        # collapse warehouses to a company-wide daily series for this SKU
        s = grp.groupby("calendar_date")["qty_shipped"].sum()
        mean = s.mean()
        std = s.std()
        cv = std / mean if mean > 0 else 0
        weekly = s.groupby(s.index.dayofweek).mean()
        weekend_ratio = weekly.iloc[5:7].mean() / weekly.iloc[0:5].mean() if weekly.iloc[0:5].mean() > 0 else 1
        monthly = s.groupby(s.index.month).mean()
        seasonality_amplitude = (monthly.max() - monthly.min()) / mean if mean > 0 else 0
        zero_day_ratio = (s == 0).mean()
        rows.append({
            "SKU_ID": sku, "avg_daily_demand": mean, "demand_cv": cv,
            "weekend_ratio": weekend_ratio, "seasonality_amplitude": seasonality_amplitude,
            "zero_day_ratio": zero_day_ratio,
        })
    return pd.DataFrame(rows)


def run(n_clusters: int = 5):
    daily_demand = get_daily_demand()
    features = build_sku_demand_features(daily_demand)

    feature_cols = ["avg_daily_demand", "demand_cv", "weekend_ratio", "seasonality_amplitude", "zero_day_ratio"]
    X = features[feature_cols].fillna(0)
    X_scaled = StandardScaler().fit_transform(X)

    Z = linkage(X_scaled, method="ward")
    features["demand_cluster"] = fcluster(Z, t=n_clusters, criterion="maxclust")

    cluster_profile = features.groupby("demand_cluster")[feature_cols].mean().round(2)
    print("=== Cluster profiles (mean feature values) ===")
    print(cluster_profile)

    abc = get_abc()
    abc_col = "SKU_ID" if "SKU_ID" in abc.columns else "sku_id"
    merged = features.merge(abc[[abc_col, "abc_class"]].rename(columns={abc_col: "SKU_ID"}), on="SKU_ID", how="left")
    crosstab = pd.crosstab(merged["demand_cluster"], merged["abc_class"])
    print("\n=== Demand cluster (rows) vs ABC class (cols) ===")
    print(crosstab)

    out_path = os.path.join(config.OUTPUT_DIR, "sku_demand_clusters.csv")
    merged.to_csv(out_path, index=False)
    print(f"\nSaved -> {out_path}")
    return merged


if __name__ == "__main__":
    run()

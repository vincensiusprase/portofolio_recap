"""
K-Means clustering on RFM features, benchmarked against the rule-based
`rfm_segment` from mart_rfm_analysis. Answers: does an unsupervised approach
find materially different customer groups than the quintile-rule approach?

Run:
    python -m src.clustering.rfm_clustering
"""
import os
import sys

import numpy as np
import pandas as pd
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import silhouette_score

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
import config
from src.data.loader import get_rfm


FEATURES = ["recency_days", "frequency_orders", "monetary_total"]


def pick_k(X_scaled, k_range=range(2, 8)) -> int:
    scores = {}
    for k in k_range:
        labels = KMeans(n_clusters=k, n_init=10, random_state=42).fit_predict(X_scaled)
        scores[k] = silhouette_score(X_scaled, labels)
    best_k = max(scores, key=scores.get)
    print("Silhouette score by k:", {k: round(v, 3) for k, v in scores.items()})
    print(f"Selected k={best_k}")
    return best_k


def label_clusters(df: pd.DataFrame, cluster_col: str = "kmeans_cluster") -> pd.Series:
    """Give each cluster a human-readable name based on its centroid
    (relative rank of recency/frequency/monetary), same spirit as the
    rule-based segment names."""
    centroids = df.groupby(cluster_col)[FEATURES].mean()
    # lower recency_days = better; higher frequency/monetary = better
    centroids["r_rank"] = centroids["recency_days"].rank()               # 1 = best (lowest days)
    centroids["f_rank"] = centroids["frequency_orders"].rank(ascending=False)
    centroids["m_rank"] = centroids["monetary_total"].rank(ascending=False)
    centroids["score"] = centroids[["r_rank", "f_rank", "m_rank"]].sum(axis=1)
    ordered = centroids.sort_values("score").index.tolist()
    n = len(ordered)
    names = ["Champions", "Loyal Customers", "Potential Loyalist", "Needs Attention", "At Risk", "Hibernating / Lost"]
    label_map = {cluster: names[min(i, len(names) - 1)] for i, cluster in enumerate(ordered)}
    return df[cluster_col].map(label_map)


def run():
    rfm = get_rfm()
    rename = {"Recency_Days": "recency_days", "Frequency_Orders": "frequency_orders", "Monetary_Total": "monetary_total"}
    rfm = rfm.rename(columns={k: v for k, v in rename.items() if k in rfm.columns})

    X = rfm[FEATURES].fillna(0)
    X_scaled = StandardScaler().fit_transform(X)

    k = pick_k(X_scaled)
    km = KMeans(n_clusters=k, n_init=10, random_state=42)
    rfm["kmeans_cluster"] = km.fit_predict(X_scaled)
    rfm["kmeans_segment"] = label_clusters(rfm)

    rule_col = "rfm_segment" if "rfm_segment" in rfm.columns else None
    if rule_col:
        crosstab = pd.crosstab(rfm[rule_col], rfm["kmeans_segment"])
        print("\n=== Rule-based segment (rows) vs K-Means segment (cols) ===")
        print(crosstab)
        agreement = (rfm[rule_col].str.split(" ").str[0] == rfm["kmeans_segment"].str.split(" ").str[0]).mean()
        print(f"\nRough label agreement: {agreement * 100:.1f}%")

    out_path = os.path.join(config.OUTPUT_DIR, "customer_clusters.csv")
    cols = [c for c in ["Customer_ID", "customer_id", "customer"] if c in rfm.columns] + FEATURES + ["kmeans_cluster", "kmeans_segment"]
    if rule_col:
        cols.append(rule_col)
    rfm[cols].to_csv(out_path, index=False)
    print(f"\nSaved -> {out_path}")
    return rfm


if __name__ == "__main__":
    run()

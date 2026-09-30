"""
Trains a classifier to predict `needs_attention` (STOCKOUT / REORDER_NOW)
from SKU x Warehouse features, and reports feature importance — useful to
sanity-check the rule-based mart_replenishment_recommendation logic and see
which drivers matter most.

Run:
    python -m src.classification.train
"""
import os
import sys

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import StratifiedKFold, cross_val_predict
from sklearn.metrics import classification_report, roc_auc_score

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
import config
from src.data.loader import get_inventory_health
from src.classification.feature_engineering import build_feature_table


def run():
    inv_health = get_inventory_health()
    df, feature_cols, key_cols = build_feature_table(inv_health)
    X = df[feature_cols]
    y = df["target_needs_attention"]

    print(f"Dataset: {len(df)} rows, {y.sum()} positive (needs attention), {len(feature_cols)} features")
    print("NOTE: small snapshot dataset (see module docstring) — treat metrics as directional, not final.\n")

    # Leave-one-out-ish via small-k stratified CV since the dataset is tiny
    n_splits = min(5, y.value_counts().min()) if y.nunique() > 1 else 2
    n_splits = max(n_splits, 2)
    cv = StratifiedKFold(n_splits=n_splits, shuffle=True, random_state=42)

    models = {
        "logistic_regression": make_pipeline(StandardScaler(), LogisticRegression(max_iter=2000, class_weight="balanced")),
        "random_forest": RandomForestClassifier(n_estimators=300, max_depth=6, class_weight="balanced", random_state=42),
    }

    results = {}
    for name, model in models.items():
        proba = cross_val_predict(model, X, y, cv=cv, method="predict_proba")[:, 1]
        pred = (proba >= 0.5).astype(int)
        auc = roc_auc_score(y, proba) if y.nunique() > 1 else float("nan")
        print(f"--- {name} (cross-validated, {n_splits}-fold) ---")
        print(classification_report(y, pred, zero_division=0))
        print(f"ROC-AUC: {auc:.3f}\n")
        results[name] = {"proba": proba, "pred": pred, "auc": auc}

    # fit final model on all data for feature importance + scoring artifact
    final_model = RandomForestClassifier(n_estimators=300, max_depth=6, class_weight="balanced", random_state=42)
    final_model.fit(X, y)
    importance = pd.DataFrame({
        "feature": feature_cols, "importance": final_model.feature_importances_
    }).sort_values("importance", ascending=False)
    print("=== Feature importance (Random Forest, fit on full data) ===")
    print(importance.to_string(index=False))

    out = df[key_cols + ["replenishment_status", "target_needs_attention"]].copy()
    out["predicted_risk_proba"] = results["random_forest"]["proba"]
    out["predicted_needs_attention"] = results["random_forest"]["pred"]

    scores_path = os.path.join(config.OUTPUT_DIR, "stockout_risk_scores.csv")
    importance_path = os.path.join(config.OUTPUT_DIR, "stockout_risk_feature_importance.csv")
    out.to_csv(scores_path, index=False)
    importance.to_csv(importance_path, index=False)
    print(f"\nSaved scores -> {scores_path}")
    print(f"Saved feature importance -> {importance_path}")

    return out, importance


if __name__ == "__main__":
    run()

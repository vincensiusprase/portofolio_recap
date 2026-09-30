"""
Builds a SKU x Warehouse feature table + label from the current inventory
snapshot for stockout-risk classification.

LIMITATION (be upfront about this in the portfolio write-up): this is a
single point-in-time snapshot (110 rows: 55 SKU x 2 warehouses), not a
historical panel. It's enough to demonstrate the modeling approach and see
which features drive risk, but too small to trust the metrics as a
production accuracy estimate. See README "Extending this project" for how
to turn int_daily_demand into a proper historical weekly panel (thousands of
rows) for a production-grade version of this model.
"""
import pandas as pd
from sklearn.preprocessing import LabelEncoder


LABEL_STATUSES = {"STOCKOUT", "REORDER_NOW"}


def build_feature_table(inventory_health: pd.DataFrame) -> pd.DataFrame:
    df = inventory_health.copy()

    df["target_needs_attention"] = df["replenishment_status"].isin(LABEL_STATUSES).astype(int)

    feature_cols_numeric = [
        "current_stock", "available_stock", "on_order_qty", "avg_daily_demand",
        "safety_stock", "reorder_point", "projected_stock", "lead_time_avg",
        "moq", "pack_size", "unit_cost", "selling_price",
    ]
    # tolerate either the BigQuery vw_inventory_health naming or the local
    # recompute naming (Current_Stock vs current_stock, etc.)
    rename_map = {
        "Current_Stock": "current_stock", "Available_Stock": "available_stock",
        "On_Order_Qty": "on_order_qty", "avg_daily_demand_90d": "avg_daily_demand",
        "MOQ": "moq", "Pack_Size": "pack_size", "Unit_Cost": "unit_cost",
        "Selling_Price": "selling_price", "Category": "category", "ABC_Class": "abc_class",
        "abc_class_recomputed": "abc_class",
    }
    df = df.rename(columns={k: v for k, v in rename_map.items() if k in df.columns})

    present_numeric = [c for c in feature_cols_numeric if c in df.columns]
    df[present_numeric] = df[present_numeric].fillna(0)

    cat_cols = [c for c in ["category", "abc_class"] if c in df.columns]
    for c in cat_cols:
        df[c] = df[c].fillna("UNKNOWN")
        df[c + "_enc"] = LabelEncoder().fit_transform(df[c])

    feature_cols = present_numeric + [c + "_enc" for c in cat_cols]
    key_cols = [c for c in ["SKU_ID", "sku", "Warehouse_ID", "warehouse"] if c in df.columns]

    return df, feature_cols, key_cols

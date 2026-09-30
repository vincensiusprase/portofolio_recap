"""
Recomputes the same tables the Dataform mart/consumption layer produces
(int_daily_demand, int_demand_stats, mart_abc_analysis, mart_rfm_analysis,
mart_replenishment_recommendation, etc.) directly in pandas from the raw CSVs.

This exists so the ML project can run end-to-end WITHOUT BigQuery credentials.
The logic intentionally mirrors the .sqlx files 1:1 — if you change a formula
in Dataform, change it here too so local dev and production stay consistent.
"""
import os
import numpy as np
import pandas as pd

import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import config


def _p(name):
    return os.path.join(config.RAW_DATA_DIR, name)


def load_raw():
    return {
        "master_product": pd.read_csv(_p("01_master_product.csv")),
        "supplier_master": pd.read_csv(_p("02_supplier_master.csv")),
        "customer_master": pd.read_csv(_p("03_customer_master.csv")),
        "inventory_transactions": pd.read_csv(_p("04_inventory_transactions.csv"), parse_dates=["Transaction_Date"]),
        "purchase_orders": pd.read_csv(_p("05_purchase_orders.csv"), parse_dates=["PO_Date", "Expected_Date", "Actual_Receipt_Date"]),
        "sales_transactions": pd.read_csv(_p("06_sales_transactions.csv"), parse_dates=["Sales_Date"]),
        "current_inventory": pd.read_csv(_p("07_current_inventory.csv"), parse_dates=["Last_Inbound_Date", "Last_Outbound_Date"]),
    }


def clean_inventory_transactions(inv: pd.DataFrame) -> pd.DataFrame:
    """Mirrors stg_inventory_transactions.sqlx: dedup + backfill missing cost."""
    inv = inv.drop_duplicates(subset=["Transaction_ID"]).copy()
    mp = pd.read_csv(_p("01_master_product.csv"))[["SKU_ID", "Unit_Cost"]].rename(columns={"Unit_Cost": "mp_cost"})
    inv = inv.merge(mp, on="SKU_ID", how="left")
    inv["Unit_Cost"] = inv["Unit_Cost"].fillna(inv["mp_cost"])
    inv["Total_Cost"] = inv["Total_Cost"].fillna(inv["Quantity"] * inv["Unit_Cost"])
    return inv.drop(columns=["mp_cost"])


def build_daily_demand(inv_clean: pd.DataFrame) -> pd.DataFrame:
    """Mirrors int_daily_demand.sqlx: full SKU x Warehouse x calendar-day grid,
    0-filled on days with no OUTBOUND."""
    outbound = inv_clean[inv_clean.Transaction_Type == "OUTBOUND"]
    daily = (
        outbound.groupby(["SKU_ID", "Warehouse_ID", "Transaction_Date"])["Quantity"]
        .sum()
        .reset_index()
        .rename(columns={"Transaction_Date": "calendar_date", "Quantity": "qty_shipped"})
    )
    frames = []
    for (sku, wh), grp in daily.groupby(["SKU_ID", "Warehouse_ID"]):
        full_range = pd.date_range(grp.calendar_date.min(), grp.calendar_date.max(), freq="D")
        s = grp.set_index("calendar_date")["qty_shipped"].reindex(full_range, fill_value=0)
        f = s.reset_index().rename(columns={"index": "calendar_date", "qty_shipped": "qty_shipped"})
        f["SKU_ID"] = sku
        f["Warehouse_ID"] = wh
        frames.append(f)
    out = pd.concat(frames, ignore_index=True)
    out["is_weekend"] = out["calendar_date"].dt.dayofweek >= 5
    return out[["SKU_ID", "Warehouse_ID", "calendar_date", "qty_shipped", "is_weekend"]]


def build_demand_stats(daily_demand: pd.DataFrame, window_days: int = None) -> pd.DataFrame:
    """Mirrors int_demand_stats.sqlx: full-history and trailing-90d avg/stddev."""
    window_days = window_days or config.DEMAND_ROLLING_WINDOW_DAYS
    rows = []
    for (sku, wh), grp in daily_demand.groupby(["SKU_ID", "Warehouse_ID"]):
        grp = grp.sort_values("calendar_date")
        as_of = grp.calendar_date.max()
        full = grp["qty_shipped"]
        trailing = grp[grp.calendar_date > as_of - pd.Timedelta(days=window_days)]["qty_shipped"]
        rows.append({
            "SKU_ID": sku, "Warehouse_ID": wh,
            "avg_daily_demand_full": full.mean(), "stddev_daily_demand_full": full.std(ddof=1),
            "avg_daily_demand_90d": trailing.mean(), "stddev_daily_demand_90d": trailing.std(ddof=1),
        })
    return pd.DataFrame(rows)


def build_po_performance(po: pd.DataFrame) -> pd.DataFrame:
    """Mirrors int_po_performance.sqlx."""
    po = po.copy()
    po["days_late"] = (po["Actual_Receipt_Date"] - po["Expected_Date"]).dt.days
    po["fill_rate"] = po["Received_Qty"] / po["Order_Qty"].replace(0, np.nan)
    g = po.groupby(["SKU_ID", "Supplier_ID"])
    out = g.agg(
        total_po_lines=("PO_ID", "count"),
        avg_lead_time_actual_days=("Lead_Time_Actual_Days", "mean"),
        stddev_lead_time_actual_days=("Lead_Time_Actual_Days", lambda x: x.std(ddof=1)),
        avg_fill_rate=("fill_rate", "mean"),
    ).reset_index()
    on_time = po[po.Actual_Receipt_Date.notna()].groupby(["SKU_ID", "Supplier_ID"]).apply(
        lambda d: (d.days_late <= 0).mean()
    ).reset_index(name="on_time_rate")
    return out.merge(on_time, on=["SKU_ID", "Supplier_ID"], how="left")


def build_abc_analysis(inv_clean: pd.DataFrame, master_product: pd.DataFrame) -> pd.DataFrame:
    """Mirrors mart_abc_analysis.sqlx: annualized consumption value, cumulative-% cut."""
    outbound = inv_clean[inv_clean.Transaction_Type == "OUTBOUND"]
    span_days = (inv_clean.Transaction_Date.max() - inv_clean.Transaction_Date.min()).days + 1
    usage = outbound.groupby("SKU_ID").agg(total_qty_shipped=("Quantity", "sum"),
                                            total_cogs_shipped=("Total_Cost", "sum")).reset_index()
    usage["annual_consumption_value"] = usage["total_cogs_shipped"] * 365.0 / span_days
    usage = usage.sort_values("annual_consumption_value", ascending=False).reset_index(drop=True)
    usage["cumulative_value_pct"] = usage["annual_consumption_value"].cumsum() / usage["annual_consumption_value"].sum()

    def classify(p):
        if p <= config.ABC_CUTOFFS["A"]:
            return "A"
        if p <= config.ABC_CUTOFFS["B"]:
            return "B"
        return "C"

    usage["abc_class"] = usage["cumulative_value_pct"].apply(classify)
    return usage[["SKU_ID", "annual_consumption_value", "cumulative_value_pct", "abc_class"]]


def build_rfm(sales: pd.DataFrame, snapshot_date: str = None) -> pd.DataFrame:
    """Mirrors mart_rfm_analysis.sqlx: RFM quintile scores + segment label."""
    snapshot = pd.Timestamp(snapshot_date or config.SNAPSHOT_DATE)
    agg = sales.groupby("Customer_ID").agg(
        last_purchase_date=("Sales_Date", "max"),
        frequency_orders=("Sales_ID", "nunique"),
        monetary_total=("Net_Sales", "sum"),
    ).reset_index()
    agg["recency_days"] = (snapshot - agg["last_purchase_date"]).dt.days
    agg["recency_score"] = 6 - pd.qcut(agg["recency_days"], 5, labels=False, duplicates="drop") - 1
    agg["frequency_score"] = pd.qcut(agg["frequency_orders"].rank(method="first"), 5, labels=False, duplicates="drop") + 1
    agg["monetary_score"] = pd.qcut(agg["monetary_total"], 5, labels=False, duplicates="drop") + 1

    def segment(row):
        r, f, m = row.recency_score, row.frequency_score, row.monetary_score
        if r >= 4 and f >= 4 and m >= 4:
            return "Champions"
        if r >= 4 and f >= 3:
            return "Loyal Customers"
        if r >= 4 and f <= 2:
            return "New / Promising"
        if r == 3 and f >= 3:
            return "Potential Loyalist"
        if r <= 2 and f >= 4 and m >= 4:
            return "At Risk (High Value)"
        if r <= 2 and f >= 3:
            return "Cannot Lose Them"
        if r <= 2 and f <= 2:
            return "Hibernating / Lost"
        return "Needs Attention"

    agg["rfm_segment"] = agg.apply(segment, axis=1)
    return agg


def build_replenishment(current_inventory: pd.DataFrame, demand_stats: pd.DataFrame,
                         po_perf: pd.DataFrame, master_product: pd.DataFrame) -> pd.DataFrame:
    """Mirrors mart_safety_stock_rop.sqlx + mart_replenishment_recommendation.sqlx."""
    lt = po_perf.groupby("SKU_ID").agg(
        lead_time_avg=("avg_lead_time_actual_days", "mean"),
        lead_time_stddev=("stddev_lead_time_actual_days", "mean"),
    ).reset_index()
    mp_lt = master_product[["SKU_ID", "Lead_Time_Days", "MOQ", "Pack_Size"]]
    lt = mp_lt.merge(lt, on="SKU_ID", how="left")
    lt["lead_time_avg"] = lt["lead_time_avg"].fillna(lt["Lead_Time_Days"])
    lt["lead_time_stddev"] = lt["lead_time_stddev"].fillna(lt["Lead_Time_Days"] * 0.2)

    ds = demand_stats.merge(lt, on="SKU_ID", how="left")
    z = config.SERVICE_LEVEL_Z
    d = ds["avg_daily_demand_90d"].fillna(0)
    d_std = ds["stddev_daily_demand_90d"].fillna(0)
    lt_avg = ds["lead_time_avg"]
    lt_std = ds["lead_time_stddev"].fillna(0)
    ds["safety_stock"] = z * np.sqrt(lt_avg * d_std**2 + d**2 * lt_std**2)
    ds["reorder_point"] = d * lt_avg + ds["safety_stock"]
    ds["max_level"] = ds["reorder_point"] + d * lt_avg * 1.1

    rep = current_inventory.merge(ds, on=["SKU_ID", "Warehouse_ID"], how="left")
    rep["projected_stock"] = rep["Current_Stock"] + rep["On_Order_Qty"] - (rep["avg_daily_demand_90d"].fillna(0) * rep["lead_time_avg"])
    rep["replenishment_required"] = rep["projected_stock"] < rep["reorder_point"]
    gap = np.maximum(rep["max_level"] - rep["projected_stock"], rep["MOQ"])
    rep["recommended_order_qty"] = np.where(
        rep["replenishment_required"],
        np.ceil(gap / rep["Pack_Size"]) * rep["Pack_Size"],
        0,
    )

    def status(row):
        if row.Current_Stock <= 0:
            return "STOCKOUT"
        if row.replenishment_required:
            return "REORDER_NOW"
        if row.projected_stock < row.reorder_point * 1.15:
            return "WATCH"
        if row.projected_stock > row.max_level * 1.3:
            return "OVERSTOCK"
        return "HEALTHY"

    rep["replenishment_status"] = rep.apply(status, axis=1)
    return rep


def get_full_pipeline():
    """Convenience: run everything and return a dict of dataframes, same names
    as the BigQuery consumption/mart layer, for use by the ML modules."""
    raw = load_raw()
    inv_clean = clean_inventory_transactions(raw["inventory_transactions"])
    daily_demand = build_daily_demand(inv_clean)
    demand_stats = build_demand_stats(daily_demand)
    po_perf = build_po_performance(raw["purchase_orders"])
    abc = build_abc_analysis(inv_clean, raw["master_product"])
    rfm = build_rfm(raw["sales_transactions"])
    replenishment = build_replenishment(raw["current_inventory"], demand_stats, po_perf, raw["master_product"])

    return {
        **raw,
        "inventory_transactions_clean": inv_clean,
        "daily_demand": daily_demand,
        "demand_stats": demand_stats,
        "po_performance": po_perf,
        "abc_analysis": abc,
        "rfm_analysis": rfm,
        "replenishment": replenishment,
    }


if __name__ == "__main__":
    data = get_full_pipeline()
    for name, df in data.items():
        print(f"{name:30s} {df.shape}")

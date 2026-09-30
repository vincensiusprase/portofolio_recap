"""
Single entry point every ML module uses to get data. Set config.USE_BIGQUERY
to switch between querying the real consumption_fmcg views in BigQuery and
recomputing the equivalent tables locally from data/raw/*.csv.
"""
import os
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import config
from src.data import local_recompute as lr

_cache = {}


def _bq_query(sql: str):
    from google.cloud import bigquery
    client = bigquery.Client(project=config.BQ_PROJECT)
    return client.query(sql).to_dataframe()


def get_daily_demand():
    if config.USE_BIGQUERY:
        return _bq_query(f"""
            SELECT sku_id AS SKU_ID, warehouse_id AS Warehouse_ID, calendar_date, qty_shipped, is_weekend
            FROM `{config.BQ_PROJECT}.{config.BQ_MART_DATASET}.int_daily_demand`
        """)
    return _local()["daily_demand"]


def get_inventory_health():
    """== vw_inventory_health in BigQuery, == 'replenishment' merged w/ product locally."""
    if config.USE_BIGQUERY:
        return _bq_query(f"SELECT * FROM `{config.BQ_PROJECT}.{config.BQ_CONSUMPTION_DATASET}.vw_inventory_health`")
    data = _local()
    product_cols = ["SKU_ID", "SKU_Name", "Category", "Sub_Category", "Brand",
                    "Unit", "Unit_Cost", "Selling_Price", "Shelf_Life_Days"]
    df = data["replenishment"].merge(data["master_product"][product_cols], on="SKU_ID", how="left")
    df = df.merge(data["abc_analysis"][["SKU_ID", "abc_class"]], on="SKU_ID", how="left")
    df = df.rename(columns={"abc_class": "abc_class_recomputed"})
    return df


def get_rfm():
    if config.USE_BIGQUERY:
        return _bq_query(f"SELECT * FROM `{config.BQ_PROJECT}.{config.BQ_CONSUMPTION_DATASET}.vw_customer_value`")
    return _local()["rfm_analysis"]


def get_abc():
    if config.USE_BIGQUERY:
        return _bq_query(f"""
            SELECT sku_id AS SKU_ID, annual_consumption_value, cumulative_value_pct, abc_class
            FROM `{config.BQ_PROJECT}.{config.BQ_MART_DATASET}.mart_abc_analysis`
        """)
    return _local()["abc_analysis"]


def get_master_product():
    if config.USE_BIGQUERY:
        return _bq_query(f"SELECT * FROM `{config.BQ_PROJECT}.{config.BQ_MART_DATASET}.dim_product`")
    return _local()["master_product"]


def get_po_performance():
    if config.USE_BIGQUERY:
        return _bq_query(f"SELECT * FROM `{config.BQ_PROJECT}.{config.BQ_MART_DATASET}.int_po_performance`")
    return _local()["po_performance"]


def get_supplier_scorecard():
    if config.USE_BIGQUERY:
        return _bq_query(f"SELECT * FROM `{config.BQ_PROJECT}.{config.BQ_CONSUMPTION_DATASET}.vw_supplier_scorecard`")
    # lightweight local approximation
    data = _local()
    return data["po_performance"].merge(data["supplier_master"], on="Supplier_ID", how="right")


def _local():
    if "pipeline" not in _cache:
        _cache["pipeline"] = lr.get_full_pipeline()
    return _cache["pipeline"]

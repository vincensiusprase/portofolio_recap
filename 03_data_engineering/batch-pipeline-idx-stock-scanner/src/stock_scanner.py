import argparse
import json
import os
import warnings
from datetime import datetime

import numpy as np
import pandas as pd
import pytz
import yfinance as yf
from dotenv import load_dotenv
from google.api_core.exceptions import NotFound
from google.cloud import bigquery
from google.oauth2 import service_account

from src.sectors import SECTOR_CONFIG

# Load environment variables from .env file
load_dotenv()

warnings.filterwarnings("ignore")

GCP_PROJECT_ID = os.environ.get("GCP_PROJECT_ID")
BQ_DATASET_ID = os.environ.get("BQ_DATASET_ID")
BQ_TABLE_NAME = os.environ.get("BQ_TABLE_NAME")

OTT_PERIOD = 2
OTT_PERCENT = 1.4
WT_N1 = 10
WT_N2 = 21
INTERNAL_SWING_LENGTH = 5
SWING_LENGTH = 50
OB_FILTER_ATR_PERIOD = 200
ATR_PERIOD_TP = 14
ATR_MULTIPLIER_TP = 2.0
TL_LENGTH = 14
TL_MULT = 1.0
TL_CALC_METHOD = "Atr"

# Filter likuiditas pra-eksekusi (nilai transaksi dalam IDR, harga IDX dalam IDR).
# Naikkan MIN_MEDIAN_TURNOVER_20D ke 5_000_000_000 untuk ukuran posisi lebih besar.
LIQUIDITY_MIN_MEDIAN_TURNOVER_20D = 1_000_000_000.0
LIQUIDITY_MAX_ZERO_VOLUME_RATIO_60D = 0.05
LIQUIDITY_MIN_PRICE = 50.0
LIQUIDITY_MAX_STALE_DAYS = 5
LIQUIDITY_LIMIT_MOVE_PCT = 0.20
LIQUIDITY_MAX_LIMIT_MOVE_DAYS_20D = 3

BQ_SCHEMA = [
    {"name": "scan_date", "type": "DATE", "mode": "REQUIRED"},
    {"name": "created_at", "type": "TIMESTAMP", "mode": "REQUIRED"},
    {"name": "sector", "type": "STRING", "mode": "NULLABLE"},
    {"name": "ticker", "type": "STRING", "mode": "NULLABLE"},
    {"name": "trend_ott", "type": "STRING", "mode": "NULLABLE"},
    {"name": "wave_trend", "type": "STRING", "mode": "NULLABLE"},
    {"name": "structure_bias", "type": "STRING", "mode": "NULLABLE"},
    {"name": "price_today", "type": "FLOAT", "mode": "NULLABLE"},
    {"name": "var_mavg", "type": "FLOAT", "mode": "NULLABLE"},
    {"name": "ott_line", "type": "FLOAT", "mode": "NULLABLE"},
    {"name": "wt1", "type": "FLOAT", "mode": "NULLABLE"},
    {"name": "wt2", "type": "FLOAT", "mode": "NULLABLE"},
    {"name": "wt_delta", "type": "FLOAT", "mode": "NULLABLE"},
    {"name": "price_zone", "type": "STRING", "mode": "NULLABLE"},
    {"name": "swing_high_type", "type": "STRING", "mode": "NULLABLE"},
    {"name": "swing_high_price", "type": "FLOAT", "mode": "NULLABLE"},
    {"name": "swing_low_type", "type": "STRING", "mode": "NULLABLE"},
    {"name": "swing_low_price", "type": "FLOAT", "mode": "NULLABLE"},
    {"name": "premium_top", "type": "FLOAT", "mode": "NULLABLE"},
    {"name": "premium_bottom", "type": "FLOAT", "mode": "NULLABLE"},
    {"name": "equilibrium", "type": "FLOAT", "mode": "NULLABLE"},
    {"name": "discount_top", "type": "FLOAT", "mode": "NULLABLE"},
    {"name": "discount_bottom", "type": "FLOAT", "mode": "NULLABLE"},
    {"name": "smc_status", "type": "STRING", "mode": "NULLABLE"},
    {"name": "bullish_ob_active", "type": "BOOLEAN", "mode": "NULLABLE"},
    {"name": "bearish_ob_active", "type": "BOOLEAN", "mode": "NULLABLE"},
    {"name": "bullish_fvg_active", "type": "BOOLEAN", "mode": "NULLABLE"},
    {"name": "bearish_fvg_active", "type": "BOOLEAN", "mode": "NULLABLE"},
    {"name": "bullish_ob_count", "type": "INTEGER", "mode": "NULLABLE"},
    {"name": "bearish_ob_count", "type": "INTEGER", "mode": "NULLABLE"},
    {"name": "bullish_fvg_count", "type": "INTEGER", "mode": "NULLABLE"},
    {"name": "bearish_fvg_count", "type": "INTEGER", "mode": "NULLABLE"},
    {"name": "score", "type": "INTEGER", "mode": "NULLABLE"},
    {"name": "action", "type": "STRING", "mode": "NULLABLE"},
    {"name": "confidence", "type": "STRING", "mode": "NULLABLE"},
]


def get_bq_client():
    """Return BigQuery client using env var or ADC."""
    creds_json = os.environ.get("GCP_SA_KEY")
    if creds_json:
        credentials = service_account.Credentials.from_service_account_info(json.loads(creds_json))
        return bigquery.Client(credentials=credentials, project=GCP_PROJECT_ID)
    return bigquery.Client(project=GCP_PROJECT_ID)


def ensure_bq_table(client, dataset_id, table_name):
    dataset_ref = client.dataset(dataset_id)
    table_ref = dataset_ref.table(table_name)
    try:
        client.get_table(table_ref)
        return
    except NotFound:
        schema = [bigquery.SchemaField(field["name"], field["type"], mode=field["mode"]) for field in BQ_SCHEMA]
        table = bigquery.Table(table_ref, schema=schema)
        client.create_table(table, exists_ok=True)
        print(f"✅ Tabel baru dibuat: {GCP_PROJECT_ID}.{dataset_id}.{table_name}")


def normalize_column_names(df_data):
    if df_data.empty:
        return df_data
    normalized = df_data.copy()
    normalized.columns = (
        normalized.columns.str.strip()
        .str.replace(" ", "_")
        .str.replace("(", "")
        .str.replace(")", "")
        .str.replace("/", "_")
        .str.replace("-", "_")
        .str.lower()
    )
    return normalized


def remove_duplicate_rows_for_date(client, df_data, dataset_id, table_name):
    if df_data.empty or "scan_date" not in df_data.columns or "ticker" not in df_data.columns:
        return df_data

    df_data = df_data.copy()
    df_data["scan_date"] = pd.to_datetime(df_data["scan_date"], errors="coerce").dt.date
    target_date = df_data["scan_date"].dropna().min()
    if pd.isna(target_date):
        return df_data

    table_id = f"{GCP_PROJECT_ID}.{dataset_id}.{table_name}"
    query = (
        f"SELECT DISTINCT scan_date, ticker FROM `{table_id}` "
        "WHERE scan_date = @scan_date"
    )
    job_config = bigquery.QueryJobConfig(
        query_parameters=[bigquery.ScalarQueryParameter("scan_date", "DATE", target_date)]
    )

    rows = client.query(query, job_config=job_config).result()
    existing_keys = {(row.scan_date.isoformat(), row.ticker) for row in rows}

    def is_duplicate(row):
        return (row["scan_date"].isoformat(), row["ticker"]) in existing_keys

    filtered = df_data[~df_data.apply(is_duplicate, axis=1)]
    if filtered.empty:
        print(f"ℹ️ Tidak ada row baru untuk tanggal {target_date.isoformat()} di {table_id}")
    return filtered


def save_to_bigquery(df_data, dataset_id, table_name):
    if df_data.empty:
        print("⚠️ Tidak ada data untuk diunggah ke BigQuery.")
        return

    client = get_bq_client()
    ensure_bq_table(client, dataset_id, table_name)
    table_id = f"{GCP_PROJECT_ID}.{dataset_id}.{table_name}"

    df_data = normalize_column_names(df_data)
    schema_columns = [field["name"] for field in BQ_SCHEMA]
    existing_cols = [col for col in schema_columns if col in df_data.columns]
    df_data = df_data[existing_cols].copy()

    if "scan_date" in df_data.columns:
        df_data["scan_date"] = pd.to_datetime(df_data["scan_date"], errors="coerce").dt.date
    if "created_at" in df_data.columns:
        df_data["created_at"] = pd.to_datetime(df_data["created_at"], errors="coerce")

    df_data = remove_duplicate_rows_for_date(client, df_data, dataset_id, table_name)
    if df_data.empty:
        return

    job_config = bigquery.LoadJobConfig(
        write_disposition=bigquery.WriteDisposition.WRITE_APPEND,
        schema=[bigquery.SchemaField(field["name"], field["type"], mode=field["mode"]) for field in BQ_SCHEMA],
    )

    try:
        job = client.load_table_from_dataframe(df_data, table_id, job_config=job_config)
        job.result()
        print(f"✅ Sukses menambahkan {len(df_data)} baris data ke BigQuery: {table_id}")
    except Exception as exc:
        print(f"❌ Gagal mengunggah data ke BigQuery: {exc}")
        raise


def calculate_ott(df, length=2, percent=1.4):
    src = df["Close"].values
    n = len(src)

    valpha = 2 / (length + 1)
    change = np.diff(src, prepend=src[0])
    vud1 = np.where(change > 0, change, 0)
    vdd1 = np.where(change < 0, -change, 0)

    vUD = pd.Series(vud1).rolling(window=9, min_periods=1).sum().values
    vDD = pd.Series(vdd1).rolling(window=9, min_periods=1).sum().values

    denominator = vUD + vDD
    vCMO = np.where(denominator != 0, (vUD - vDD) / denominator, 0)

    VAR = np.zeros(n)
    VAR[0] = src[0]
    for i in range(1, n):
        VAR[i] = (valpha * abs(vCMO[i]) * src[i]) + (1 - valpha * abs(vCMO[i])) * VAR[i - 1]

    longStop = np.zeros(n)
    shortStop = np.zeros(n)
    direction = np.ones(n)
    MT = np.zeros(n)

    for i in range(1, n):
        fark = VAR[i] * percent * 0.01
        ls = VAR[i] - fark
        ss = VAR[i] + fark

        longStop[i] = max(ls, longStop[i - 1]) if VAR[i] > longStop[i - 1] else ls
        shortStop[i] = min(ss, shortStop[i - 1]) if VAR[i] < shortStop[i - 1] else ss

        prev_dir = direction[i - 1]
        if prev_dir == -1 and VAR[i] > shortStop[i - 1]:
            curr_dir = 1
        elif prev_dir == 1 and VAR[i] < longStop[i - 1]:
            curr_dir = -1
        else:
            curr_dir = prev_dir

        direction[i] = curr_dir
        MT[i] = longStop[i] if curr_dir == 1 else shortStop[i]

    OTT_base = np.where(VAR > MT, MT * (200 + percent) / 200, MT * (200 - percent) / 200)

    df["VAR"] = VAR
    df["OTT"] = pd.Series(OTT_base).shift(2).values

    cross_signal = np.zeros(n)
    for i in range(1, n):
        if VAR[i - 1] <= df["OTT"].iloc[i - 1] and VAR[i] > df["OTT"].iloc[i]:
            cross_signal[i] = 1
        elif VAR[i - 1] >= df["OTT"].iloc[i - 1] and VAR[i] < df["OTT"].iloc[i]:
            cross_signal[i] = -1

    df["OTT_Cross"] = cross_signal
    return df


def calculate_wavetrend(df, n1=10, n2=21):
    ap = (df["High"] + df["Low"] + df["Close"]) / 3
    esa = ap.ewm(span=n1, adjust=False).mean()
    d = (ap - esa).abs().ewm(span=n1, adjust=False).mean()
    ci = np.where(d != 0, (ap - esa) / (0.015 * d), 0)
    ci_series = pd.Series(ci, index=df.index)

    wt1 = ci_series.ewm(span=n2, adjust=False).mean()
    wt2 = wt1.rolling(window=4).mean()

    df["WT1"] = wt1
    df["WT2"] = wt2

    n = len(df)
    wt_cross_signal = np.zeros(n)
    wt1_arr = wt1.values
    wt2_arr = wt2.values

    for i in range(1, n):
        if wt1_arr[i - 1] <= wt2_arr[i - 1] and wt1_arr[i] > wt2_arr[i]:
            wt_cross_signal[i] = 1
        elif wt1_arr[i - 1] >= wt2_arr[i - 1] and wt1_arr[i] < wt2_arr[i]:
            wt_cross_signal[i] = -1

    df["WT_Cross_Signal"] = wt_cross_signal
    return df


def calc_atr(df, period):
    hl = df["High"] - df["Low"]
    hc = (df["High"] - df["Close"].shift(1)).abs()
    lc = (df["Low"] - df["Close"].shift(1)).abs()
    tr = pd.concat([hl, hc, lc], axis=1).max(axis=1)
    return tr.rolling(window=period, min_periods=1).mean()


def get_parsed_hl(df, atr_200):
    high_vol = (df["High"] - df["Low"]) >= (2.0 * atr_200)
    parsed_high = np.where(high_vol, df["Low"], df["High"])
    parsed_low = np.where(high_vol, df["High"], df["Low"])
    return pd.Series(parsed_high, index=df.index), pd.Series(parsed_low, index=df.index)


def calculate_leg(df, size):
    high = df["High"].to_numpy()
    low = df["Low"].to_numpy()
    leg = np.zeros(len(df), dtype=int)

    for i in range(size, len(df)):
        prev_high_window = high[max(0, i - size): i]
        prev_low_window = low[max(0, i - size): i]

        if len(prev_high_window) > 0 and high[i] > np.max(prev_high_window):
            leg[i] = 0
        elif len(prev_low_window) > 0 and low[i] < np.min(prev_low_window):
            leg[i] = 1

    return pd.Series(leg, index=df.index)


def get_swing_points(df, length):
    leg = calculate_leg(df, length)
    swing_high = pd.Series(False, index=df.index)
    swing_low = pd.Series(False, index=df.index)

    for i in range(1, len(df)):
        prev_leg = leg.iloc[i - 1]
        curr_leg = leg.iloc[i]
        if prev_leg != curr_leg:
            if curr_leg == 1:
                swing_low.iloc[i] = True
            else:
                swing_high.iloc[i] = True

    return swing_high, swing_low


def calculate_swing_strength(df, length=SWING_LENGTH):
    highs = df["High"].to_numpy(dtype=float)
    lows = df["Low"].to_numpy(dtype=float)
    closes = df["Close"].to_numpy(dtype=float)

    leg = 0
    swing_high = None
    swing_low = None
    high_crossed = False
    low_crossed = False
    swing_bias = 0
    trailing_top = None
    trailing_bottom = None

    for i in range(len(df)):
        if trailing_top is not None and np.isfinite(highs[i]):
            trailing_top = max(trailing_top, highs[i])
        if trailing_bottom is not None and np.isfinite(lows[i]):
            trailing_bottom = min(trailing_bottom, lows[i])

        if i >= length:
            pivot_idx = i - length
            window_high = highs[pivot_idx + 1:i + 1]
            window_low = lows[pivot_idx + 1:i + 1]
            next_leg = leg

            if (
                np.isfinite(highs[pivot_idx])
                and np.isfinite(window_high).all()
                and highs[pivot_idx] > np.max(window_high)
            ):
                next_leg = 0
            elif (
                np.isfinite(lows[pivot_idx])
                and np.isfinite(window_low).all()
                and lows[pivot_idx] < np.min(window_low)
            ):
                next_leg = 1

            if next_leg != leg:
                leg = next_leg
                if leg == 1:
                    swing_low = lows[pivot_idx]
                    low_crossed = False
                    trailing_bottom = swing_low
                else:
                    swing_high = highs[pivot_idx]
                    high_crossed = False
                    trailing_top = swing_high

        if i == 0 or not np.isfinite(closes[i - 1]) or not np.isfinite(closes[i]):
            continue

        if swing_high is not None and not high_crossed:
            if closes[i - 1] <= swing_high and closes[i] > swing_high:
                high_crossed = True
                swing_bias = 1

        if swing_low is not None and not low_crossed:
            if closes[i - 1] >= swing_low and closes[i] < swing_low:
                low_crossed = True
                swing_bias = -1

    return {
        "swing_high_type": "Strong High" if swing_bias == -1 else "Weak High",
        "swing_high_price": trailing_top if trailing_top is not None else np.nan,
        "swing_low_type": "Strong Low" if swing_bias == 1 else "Weak Low",
        "swing_low_price": trailing_bottom if trailing_bottom is not None else np.nan,
    }


def detect_structure_and_ob(df, parsed_high, parsed_low, swing_high, swing_low):
    closes, highs, lows = df["Close"].to_numpy(), df["High"].to_numpy(), df["Low"].to_numpy()
    ph_arr, pl_arr = parsed_high.to_numpy(), parsed_low.to_numpy()
    n = len(df)

    last_sh_price, last_sh_idx = np.nan, -1
    last_sl_price, last_sl_idx = np.nan, -1
    sh_crossed, sl_crossed = False, False
    order_blocks = []

    for i in range(1, n):
        if swing_high.iloc[i]:
            last_sh_price, last_sh_idx, sh_crossed = highs[i], i, False
        if swing_low.iloc[i]:
            last_sl_price, last_sl_idx, sl_crossed = lows[i], i, False

        if not np.isnan(last_sh_price) and closes[i] > last_sh_price and not sh_crossed and last_sh_idx >= 0 and i > last_sh_idx:
            sh_crossed = True
            segment = pl_arr[last_sh_idx:i + 1]
            if segment.size > 0:
                ob_idx = last_sh_idx + int(np.argmin(segment))
                order_blocks.append({
                    "type": "Bullish",
                    "ob_high": float(ph_arr[ob_idx]),
                    "ob_low": float(pl_arr[ob_idx]),
                    "ob_idx": int(ob_idx),
                    "active": True,
                })

        if not np.isnan(last_sl_price) and closes[i] < last_sl_price and not sl_crossed and last_sl_idx >= 0 and i > last_sl_idx:
            sl_crossed = True
            segment = ph_arr[last_sl_idx:i + 1]
            if segment.size > 0:
                ob_idx = last_sl_idx + int(np.argmax(segment))
                order_blocks.append({
                    "type": "Bearish",
                    "ob_high": float(ph_arr[ob_idx]),
                    "ob_low": float(pl_arr[ob_idx]),
                    "ob_idx": int(ob_idx),
                    "active": True,
                })

    for ob in order_blocks:
        start = ob["ob_idx"] + 1
        for j in range(start, n):
            if ob["type"] == "Bullish" and lows[j] < ob["ob_low"]:
                ob["active"] = False
                break
            if ob["type"] == "Bearish" and highs[j] > ob["ob_high"]:
                ob["active"] = False
                break

    return order_blocks


def detect_fvg(df):
    closes, opens, highs, lows = (
        df["Close"].to_numpy(),
        df["Open"].to_numpy(),
        df["High"].to_numpy(),
        df["Low"].to_numpy(),
    )
    n = len(df)
    fvg_list = []

    for i in range(2, n):
        if not np.isfinite(opens[i - 1]) or abs(opens[i - 1]) < 1e-9:
            continue

        bar_delta_percent = (closes[i - 1] - opens[i - 1]) / (opens[i - 1] * 100.0)
        recent_delta = np.abs(np.diff(closes[max(0, i - 20):i + 1]))
        threshold = float(np.mean(recent_delta) / 100.0) if len(recent_delta) > 0 else 0.0

        if lows[i] > highs[i - 2] and closes[i - 1] > highs[i - 2] and bar_delta_percent > threshold:
            fvg_list.append({
                "type": "Bullish",
                "top": float(max(lows[i], highs[i - 2])),
                "bottom": float(min(lows[i], highs[i - 2])),
                "idx": i,
                "active": True,
            })
        if highs[i] < lows[i - 2] and closes[i - 1] < lows[i - 2] and -bar_delta_percent > threshold:
            fvg_list.append({
                "type": "Bearish",
                "top": float(max(highs[i], lows[i - 2])),
                "bottom": float(min(highs[i], lows[i - 2])),
                "idx": i,
                "active": True,
            })

    for fvg in fvg_list:
        start = fvg["idx"] + 1
        for j in range(start, n):
            if fvg["type"] == "Bullish" and lows[j] < fvg["bottom"]:
                fvg["active"] = False
                break
            if fvg["type"] == "Bearish" and highs[j] > fvg["top"]:
                fvg["active"] = False
                break

    return fvg_list


def calculate_premium_discount_zones(df):
    trailing_top = float(df["High"].cummax().iloc[-1])
    trailing_bottom = float(df["Low"].cummin().iloc[-1])

    return {
        "trailing_top": trailing_top,
        "trailing_bottom": trailing_bottom,
        "premium_top": trailing_top,
        "premium_bottom": 0.95 * trailing_top + 0.05 * trailing_bottom,
        "eq_top": 0.525 * trailing_top + 0.475 * trailing_bottom,
        "eq_bottom": 0.525 * trailing_bottom + 0.475 * trailing_top,
        "equilibrium": (trailing_top + trailing_bottom) / 2,
        "discount_top": 0.95 * trailing_bottom + 0.05 * trailing_top,
        "discount_bottom": trailing_bottom,
    }


def get_price_zone(price, zones):
    if price >= zones["premium_bottom"]:
        return "🔴 Premium"
    elif price <= zones["discount_top"]:
        return "🟢 Discount"
    elif zones["eq_bottom"] <= price <= zones["eq_top"]:
        return "⚪ Equilibrium"
    elif price > zones["eq_top"]:
        return "🟠 Menuju Premium"
    return "🟡 Menuju Discount"


def calculate_trendlines(df, length=14, mult=1.0, calc_method="Atr"):
    n = len(df)
    closes = df["Close"].values
    highs = df["High"].values
    lows = df["Low"].values

    ph_arr = np.full(n, np.nan)
    pl_arr = np.full(n, np.nan)
    for i in range(length, n - length):
        window_high = highs[i - length: i + length + 1]
        window_low = lows[i - length: i + length + 1]
        if highs[i] == np.max(window_high):
            ph_arr[i + length] = highs[i]
        if lows[i] == np.min(window_low):
            pl_arr[i + length] = lows[i]

    if calc_method == "Atr":
        atr_series = calc_atr(df, length).values
        slope_arr = atr_series / length * mult
    else:
        slope_arr = pd.Series(closes).rolling(window=length, min_periods=1).std().values / length * mult

    upper, lower = 0.0, 0.0
    slope_ph, slope_pl = 0.0, 0.0
    upos, dnos = 0, 0

    tl_upper = np.zeros(n)
    tl_lower = np.zeros(n)
    tl_upos = np.zeros(n)
    tl_dnos = np.zeros(n)
    tl_breakout = np.zeros(n)

    for i in range(n):
        sl = slope_arr[i]
        if not np.isnan(ph_arr[i]):
            slope_ph = sl
        if not np.isnan(pl_arr[i]):
            slope_pl = sl

        upper = ph_arr[i] if not np.isnan(ph_arr[i]) else upper - slope_ph
        lower = pl_arr[i] if not np.isnan(pl_arr[i]) else lower + slope_pl

        tl_upper[i] = upper - slope_ph * length
        tl_lower[i] = lower + slope_pl * length

        prev_upos, prev_dnos = upos, dnos

        if not np.isnan(ph_arr[i]):
            upos = 0
        elif closes[i] > tl_upper[i]:
            upos = 1

        if not np.isnan(pl_arr[i]):
            dnos = 0
        elif closes[i] < tl_lower[i]:
            dnos = 1

        tl_upos[i], tl_dnos[i] = upos, dnos

        if upos > prev_upos:
            tl_breakout[i] = 1
        elif dnos > prev_dnos:
            tl_breakout[i] = -1

    df["TL_Upper"] = tl_upper
    df["TL_Lower"] = tl_lower
    df["TL_UPos"] = tl_upos
    df["TL_DNos"] = tl_dnos
    df["TL_Breakout"] = tl_breakout
    return df

def passes_liquidity_filter(df, execution_time):
    """Filter pra-eksekusi: tolak saham tidak liquid. Return (lolos, alasan)."""
    if "Volume" not in df.columns:
        return False, "tanpa kolom Volume"
    if df["Close"].isna().all() or df["Volume"].isna().all():
        return False, "Close/Volume kosong"

    price_today = float(df["Close"].iloc[-1])
    if pd.isna(price_today) or price_today < LIQUIDITY_MIN_PRICE:
        return False, f"harga {price_today} < min {LIQUIDITY_MIN_PRICE}"

    turnover_20d = (df["Close"] * df["Volume"]).tail(20)
    median_turnover = float(turnover_20d.median())
    if pd.isna(median_turnover) or median_turnover < LIQUIDITY_MIN_MEDIAN_TURNOVER_20D:
        return False, f"median turnover 20d {median_turnover:,.0f} < min"

    vol_60d = df["Volume"].tail(60)
    zero_ratio = float((vol_60d.fillna(0) == 0).mean())
    if pd.isna(zero_ratio) or zero_ratio > LIQUIDITY_MAX_ZERO_VOLUME_RATIO_60D:
        return False, f"zero-volume 60d {zero_ratio:.1%} > maks"

    date_col = "Date" if "Date" in df.columns else ("date" if "date" in df.columns else None)
    if date_col is None:
        return False, "tanpa kolom tanggal"
    last_bar_date = pd.to_datetime(df[date_col].iloc[-1], errors="coerce")
    if pd.isna(last_bar_date):
        return False, "tanggal terakhir invalid"
    stale_days = (execution_time.date() - last_bar_date.date()).days
    if stale_days < 0 or stale_days > LIQUIDITY_MAX_STALE_DAYS:
        return False, f"data basi {stale_days} hari"

    prev_close = df["Close"].shift(1).tail(20)
    daily_move = (df["Close"].tail(20) / prev_close - 1).abs()
    limit_days = int((daily_move >= LIQUIDITY_LIMIT_MOVE_PCT).sum())
    if limit_days > LIQUIDITY_MAX_LIMIT_MOVE_DAYS_20D:
        return False, f"{limit_days} limit-move 20d > maks"

    return True, "lolos"

def build_smc_summary_row(ticker, sector_name, df, execution_time, active_obs=None, active_fvg=None):
    if active_obs is None:
        active_obs = []
    if active_fvg is None:
        active_fvg = []

    price_today = float(df["Close"].iloc[-1])
    var_today = float(df["VAR"].iloc[-1])
    ott_today = float(df["OTT"].iloc[-1])
    wt1_today = float(df["WT1"].iloc[-1])
    wt2_today = float(df["WT2"].iloc[-1])
    wt1_prev = float(df["WT1"].iloc[-2])
    wt2_prev = float(df["WT2"].iloc[-2])
    trend = "UPTREND" if var_today > ott_today else "DOWNTREND"

    zones = calculate_premium_discount_zones(df)
    swing_strength = calculate_swing_strength(df)
    price_zone = get_price_zone(price_today, zones)
    is_discount = price_today <= zones["discount_top"]
    is_premium = price_today >= zones["premium_bottom"]

    bullish_ob = [ob for ob in active_obs if ob["type"] == "Bullish"]
    bearish_ob = [ob for ob in active_obs if ob["type"] == "Bearish"]
    bullish_fvg = [fvg for fvg in active_fvg if fvg["type"] == "Bullish"]
    bearish_fvg = [fvg for fvg in active_fvg if fvg["type"] == "Bearish"]

    bull_ob_active = len(bullish_ob) > 0 and any(ob["ob_low"] <= price_today <= ob["ob_high"] for ob in bullish_ob)
    bear_ob_active = len(bearish_ob) > 0 and any(ob["ob_low"] <= price_today <= ob["ob_high"] for ob in bearish_ob)
    bull_fvg_active = len(bullish_fvg) > 0 and any(fvg["bottom"] <= price_today <= fvg["top"] for fvg in bullish_fvg)
    bear_fvg_active = len(bearish_fvg) > 0 and any(fvg["bottom"] <= price_today <= fvg["top"] for fvg in bearish_fvg)

    tl_breakout_today = int(df["TL_Breakout"].iloc[-1])
    tl_breakout_score = 30 if tl_breakout_today == 1 else (-30 if tl_breakout_today == -1 else 0)

    smc_status = "⚪ Outside SMC Confluence"
    smc_score = 0
    if bull_ob_active:
        smc_status = "🟢 Bullish OB Active"
        smc_score += 40
    elif bull_fvg_active:
        smc_status = "🟢 Bullish FVG Active"
        smc_score += 30
    elif bear_ob_active:
        smc_status = "🔴 Bearish OB Active"
        smc_score -= 40
    elif bear_fvg_active:
        smc_status = "🔴 Bearish FVG Active"
        smc_score -= 30

    if is_discount and trend == "UPTREND":
        smc_score += 15
    if is_premium and trend == "DOWNTREND":
        smc_score -= 15

    score = smc_score + (50 if trend == "UPTREND" else -50) + tl_breakout_score
    if is_discount:
        score += 25
    elif is_premium:
        score -= 25

    if score >= 60:
        action = "🔥 SNIPER BUY"
    elif score >= 20:
        action = "🟢 BUY"
    elif score <= -60:
        action = "🔥 SNIPER SELL"
    elif score <= -20:
        action = "🔴 SELL"
    else:
        action = "⏳ WAIT"

    return {
        "scan_date": execution_time.date(),
        "created_at": execution_time,
        "sector": sector_name,
        "ticker": ticker,
        "trend_ott": trend,
        "wave_trend": "Bullish" if wt1_today > wt2_today else "Bearish",
        "structure_bias": "Bullish" if (var_today > ott_today and (wt1_today > wt2_today or tl_breakout_today == 1)) else "Bearish" if (var_today < ott_today and (wt1_today < wt2_today or tl_breakout_today == -1)) else "Neutral",
        "price_today": float(price_today),
        "var_mavg": round(var_today, 2),
        "ott_line": round(ott_today, 2),
        "wt1": round(wt1_today, 2),
        "wt2": round(wt2_today, 2),
        "wt_delta": round(wt1_today - wt2_today, 2),
        "price_zone": price_zone,
        **swing_strength,
        "premium_top": round(zones["premium_top"], 2),
        "premium_bottom": round(zones["premium_bottom"], 2),
        "equilibrium": round(zones["equilibrium"], 2),
        "discount_top": round(zones["discount_top"], 2),
        "discount_bottom": round(zones["discount_bottom"], 2),
        "smc_status": smc_status,
        "bullish_ob_active": bull_ob_active,
        "bearish_ob_active": bear_ob_active,
        "bullish_fvg_active": bull_fvg_active,
        "bearish_fvg_active": bear_fvg_active,
        "bullish_ob_count": len(bullish_ob),
        "bearish_ob_count": len(bearish_ob),
        "bullish_fvg_count": len(bullish_fvg),
        "bearish_fvg_count": len(bearish_fvg),
        "score": int(score),
        "action": action,
        "confidence": "High" if abs(score) >= 60 else "Medium" if abs(score) >= 20 else "Low",
    }


def summarize_sector_results(df_sector_results):
    if df_sector_results.empty:
        return pd.DataFrame(columns=["sector", "stocks_scanned", "avg_score", "bullish_count", "bearish_count", "neutral_count", "leader_ticker", "leader_score"])

    summary = df_sector_results.groupby("sector", as_index=False).agg(
        stocks_scanned=("ticker", "count"),
        avg_score=("score", "mean"),
        bullish_count=("action", lambda s: int((s.str.contains("BUY|SNIPER", regex=True)).sum())),
        bearish_count=("action", lambda s: int((s.str.contains("SELL", regex=False)).sum())),
        neutral_count=("action", lambda s: int((s == "⏳ WAIT").sum())),
    )

    leader = df_sector_results.sort_values("score", ascending=False).drop_duplicates("sector")
    leader = leader[["sector", "ticker", "score"]].rename(columns={"ticker": "leader_ticker", "score": "leader_score"})
    summary = summary.merge(leader, on="sector", how="left")
    summary["avg_score"] = summary["avg_score"].round(2)
    return summary.sort_values("avg_score", ascending=False)


def summarize_swing_strength(df_results):
    labels = ["Strong High", "Weak High", "Strong Low", "Weak Low"]
    counts = pd.concat(
        [df_results["swing_high_type"], df_results["swing_low_type"]],
        ignore_index=True,
    ).value_counts()
    return pd.DataFrame({"level_type": labels, "count": [int(counts.get(label, 0)) for label in labels]})


def analyze_sector(sector_name, ticker_list, execution_time=None):
    if execution_time is None:
        tz_jkt = pytz.timezone("Asia/Jakarta")
        execution_time = datetime.now(tz_jkt)
    results = []
    print(f"\n🚀 Scanning Sektor: {sector_name} | Total: {len(ticker_list)} emiten")

    for ticker in ticker_list:
        try:
            df = yf.download(ticker, period="1y", interval="1d", progress=False, auto_adjust=True, threads=False)

            if isinstance(df.columns, pd.MultiIndex):
                df.columns = [str(c[0]).capitalize() for c in df.columns]
            else:
                df.columns = [str(c).capitalize() for c in df.columns]

            if df.empty or len(df) < 100 or "Close" not in df.columns:
                continue

            df.reset_index(inplace=True)

            liquid, liquid_reason = passes_liquidity_filter(df, execution_time)
            if not liquid:
                continue

            df["ATR_14"] = calc_atr(df, ATR_PERIOD_TP)
            df = calculate_ott(df, length=OTT_PERIOD, percent=OTT_PERCENT)
            df = calculate_wavetrend(df, n1=WT_N1, n2=WT_N2)

            atr_200 = calc_atr(df, OB_FILTER_ATR_PERIOD)
            parsed_high, parsed_low = get_parsed_hl(df, atr_200)
            sh_int, sl_int = get_swing_points(df, INTERNAL_SWING_LENGTH)
            sh_sw, sl_sw = get_swing_points(df, SWING_LENGTH)
            obs_int = detect_structure_and_ob(df, parsed_high, parsed_low, sh_int, sl_int)
            obs_sw = detect_structure_and_ob(df, parsed_high, parsed_low, sh_sw, sl_sw)
            all_obs = obs_int + obs_sw
            active_obs = [o for o in all_obs if o["active"]]
            active_fvg = [f for f in detect_fvg(df) if f["active"]]

            df = calculate_trendlines(df, length=TL_LENGTH, mult=TL_MULT, calc_method=TL_CALC_METHOD)
            row = build_smc_summary_row(ticker, sector_name, df, execution_time, active_obs=active_obs, active_fvg=active_fvg)
            results.append(row)

        except Exception as exc:
            print(f" -> ❌ Error pada {ticker}: {exc}")

    return pd.DataFrame(results)


def positive_int(value):
    parsed = int(value)
    if parsed < 1:
        raise argparse.ArgumentTypeError("limit harus lebih besar dari 0")
    return parsed


def parse_args(argv=None):
    parser = argparse.ArgumentParser(description="Scan saham IDX dan simpan hasil ke BigQuery.")
    parser.add_argument(
        "--sector",
        default="ALL",
        type=str.upper,
        choices=["ALL", *SECTOR_CONFIG.keys()],
        help="sektor yang dipindai (default: ALL)",
    )
    parser.add_argument(
        "--limit",
        type=positive_int,
        help="jumlah maksimum ticker per sektor",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="hitung dan tampilkan hasil tanpa upload ke BigQuery",
    )
    return parser.parse_args(argv)


def resolve_sector_selection(selected_sector="ALL", limit=None):
    sectors = (
        SECTOR_CONFIG.items()
        if selected_sector == "ALL"
        else [(selected_sector, SECTOR_CONFIG[selected_sector])]
    )
    return {
        sector: tickers[:limit] if limit is not None else tickers
        for sector, tickers in sectors
    }


def main(argv=None):
    args = parse_args(argv)
    target_sectors = resolve_sector_selection(args.sector, args.limit)
    print("🤖 MEMULAI MARKET SCANNER (GITHUB ACTIONS / CLI)")
    all_results = []
    execution_time = datetime.now(pytz.timezone("Asia/Jakarta"))

    for sector, tickers in target_sectors.items():
        df_sector = analyze_sector(sector, tickers, execution_time=execution_time)
        if not df_sector.empty:
            all_results.append(df_sector)

    if all_results:
        df_final = pd.concat(all_results, ignore_index=True)
        sector_summary = summarize_sector_results(df_final)
        print("\n📊 SECTOR SUMMARY")
        print(sector_summary.to_string(index=False))
        print("\n📍 STRONG/WEAK HIGH-LOW SUMMARY")
        print(summarize_swing_strength(df_final).to_string(index=False))
        print("\n📈 STOCK SIGNALS")
        print(df_final.sort_values("score", ascending=False).to_string(index=False))
        if args.dry_run:
            print("🧪 Dry run: hasil tidak diunggah ke BigQuery.")
        else:
            missing_config = [
                name
                for name, value in (
                    ("GCP_PROJECT_ID", GCP_PROJECT_ID),
                    ("BQ_DATASET_ID", BQ_DATASET_ID),
                    ("BQ_TABLE_NAME", BQ_TABLE_NAME),
                )
                if not value
            ]
            if missing_config:
                raise RuntimeError(
                    "Konfigurasi BigQuery belum lengkap: " + ", ".join(missing_config)
                )
            save_to_bigquery(df_final, BQ_DATASET_ID, BQ_TABLE_NAME)
    else:
        print("⚠️ Tidak ada data hasil pemindaian yang valid.")

    print("🏁 PROSES SCANNING & INGGESTION SELESAI 🏁")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

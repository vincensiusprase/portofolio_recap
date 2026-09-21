# ==========================================
# MARKET SCANNER - ULTIMATE PRO MAX (BIGQUERY APPEND VERSION)
# OTT + WaveTrend + SMC (OB/FVG) + Dynamic ATR TP + LuxAlgo Trendlines
# Output: BigQuery (Append Only)
# ==========================================

import os
import json
import warnings
import numpy as np
import pandas as pd
import yfinance as yf
import pytz
from sectors import SECTOR_CONFIG
from datetime import datetime
from google.cloud import bigquery
from google.oauth2 import service_account

warnings.filterwarnings('ignore')

# ==========================================
# CONFIG & PARAMETERS
# ==========================================
# BigQuery Settings
# Silakan sesuaikan ID Project & Dataset Anda di sini
GCP_PROJECT_ID = os.environ.get("GCP_PROJECT_ID", "project-1-474502")
BQ_DATASET_ID  = os.environ.get("BQ_DATASET_ID", "saham_analytics")
BQ_TABLE_NAME  = "fact_ott_scanner_daily"

# OTT Parameters
OTT_PERIOD  = 2
OTT_PERCENT = 1.4

# WaveTrend Parameters
WT_N1 = 10
WT_N2 = 21

# SMC Parameters
INTERNAL_SWING_LENGTH = 5    
SWING_LENGTH          = 50   
OB_FILTER_ATR_PERIOD  = 200  

# Dynamic TP Parameters
ATR_PERIOD_TP     = 14
ATR_MULTIPLIER_TP = 2.0

# Trendlines Parameters
TL_LENGTH      = 14       
TL_MULT        = 1.0      
TL_CALC_METHOD = 'Atr'    

# ==========================================
# BIGQUERY CONNECTION & APPEND FUNCTION
# ==========================================
def get_bq_client():
    """Mendapatkan BigQuery Client (Support Environment Var & Default Auth)."""
    creds_json = os.environ.get("GCP_SA_KEY")
    if creds_json:
        creds_dict = json.loads(creds_json)
        credentials = service_account.Credentials.from_service_account_info(creds_dict)
        return bigquery.Client(credentials=credentials, project=GCP_PROJECT_ID)
    else:
        # Menggunakan ADC (Application Default Credentials) saat running di Cloud Run
        return bigquery.Client(project=GCP_PROJECT_ID)

def save_to_bigquery(df_data, dataset_id, table_name):
    """
    Menyimpan DataFrame ke BigQuery dengan mode WRITE_APPEND (Data Harian Ditambahkan).
    """
    if df_data.empty:
        print("⚠️ Tidak ada data untuk diunggah ke BigQuery.")
        return

    client = get_bq_client()
    table_id = f"{GCP_PROJECT_ID}.{dataset_id}.{table_name}"

    # Sanitasi nama kolom agar sesuai standar BigQuery (Huruf kecil & Underscore)
    df_data.columns = (
        df_data.columns.str.strip()
        .str.replace(" ", "_")
        .str.replace("(", "")
        .str.replace(")", "")
        .str.replace("/", "_")
        .str.replace("-", "_")
        .str.lower()
    )

    job_config = bigquery.LoadJobConfig(
        # MODE APPEND: Menambahkan data harian tanpa menimpa data lama
        write_disposition=bigquery.WriteDisposition.WRITE_APPEND,
        autodetect=True  # Otomatis menyesuaikan skema tabel jika belum ada
    )

    try:
        job = client.load_table_from_dataframe(df_data, table_id, job_config=job_config)
        job.result()  # Menunggu job selesai
        print(f"✅ Sukses menambahkan {len(df_data)} baris data ke BigQuery: {table_id}")
    except Exception as e:
        print(f"❌ Gagal mengunggah data ke BigQuery: {e}")

# ==========================================
# INDICATOR FUNCTIONS (OTT & WT)
# ==========================================
def calculate_ott(df, length=2, percent=1.4):
    src = df['Close'].values
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
        VAR[i] = (valpha * abs(vCMO[i]) * src[i]) + (1 - valpha * abs(vCMO[i])) * VAR[i-1]
        
    longStop = np.zeros(n)
    shortStop = np.zeros(n)
    direction = np.ones(n)
    MT = np.zeros(n)
    
    for i in range(1, n):
        fark = VAR[i] * percent * 0.01
        ls = VAR[i] - fark
        ss = VAR[i] + fark
        
        longStop[i]  = max(ls, longStop[i-1]) if VAR[i] > longStop[i-1] else ls
        shortStop[i] = min(ss, shortStop[i-1]) if VAR[i] < shortStop[i-1] else ss
        
        prev_dir = direction[i-1]
        if prev_dir == -1 and VAR[i] > shortStop[i-1]:
            curr_dir = 1
        elif prev_dir == 1 and VAR[i] < longStop[i-1]:
            curr_dir = -1
        else:
            curr_dir = prev_dir
            
        direction[i] = curr_dir
        MT[i] = longStop[i] if curr_dir == 1 else shortStop[i]
        
    OTT_base = np.where(VAR > MT, MT * (200 + percent) / 200, MT * (200 - percent) / 200)
    
    df['VAR'] = VAR
    df['OTT'] = pd.Series(OTT_base).shift(2).values 
    
    cross_signal = np.zeros(n)
    for i in range(1, n):
        if VAR[i-1] <= df['OTT'].iloc[i-1] and VAR[i] > df['OTT'].iloc[i]:
            cross_signal[i] = 1 
        elif VAR[i-1] >= df['OTT'].iloc[i-1] and VAR[i] < df['OTT'].iloc[i]:
            cross_signal[i] = -1 
            
    df['OTT_Cross'] = cross_signal
    return df

def calculate_wavetrend(df, n1=10, n2=21):
    ap = (df['High'] + df['Low'] + df['Close']) / 3
    esa = ap.ewm(span=n1, adjust=False).mean()
    d = (ap - esa).abs().ewm(span=n1, adjust=False).mean()
    ci = np.where(d != 0, (ap - esa) / (0.015 * d), 0)
    ci_series = pd.Series(ci, index=df.index)
    
    wt1 = ci_series.ewm(span=n2, adjust=False).mean()
    wt2 = wt1.rolling(window=4).mean()
    
    df['WT1'] = wt1
    df['WT2'] = wt2
    
    n = len(df)
    wt_cross_signal = np.zeros(n)
    wt1_arr = wt1.values
    wt2_arr = wt2.values
    
    for i in range(1, n):
        if wt1_arr[i-1] <= wt2_arr[i-1] and wt1_arr[i] > wt2_arr[i]:
            wt_cross_signal[i] = 1 
        elif wt1_arr[i-1] >= wt2_arr[i-1] and wt1_arr[i] < wt2_arr[i]:
            wt_cross_signal[i] = -1 
            
    df['WT_Cross_Signal'] = wt_cross_signal
    return df

# ==========================================
# SMC & TRENDLINE FUNCTIONS
# ==========================================
def calc_atr(df, period):
    hl = df['High'] - df['Low']
    hc = (df['High'] - df['Close'].shift(1)).abs()
    lc = (df['Low'] - df['Close'].shift(1)).abs()
    tr = pd.concat([hl, hc, lc], axis=1).max(axis=1)
    return tr.rolling(window=period, min_periods=1).mean()

def get_parsed_hl(df, atr_200):
    high_vol = (df['High'] - df['Low']) >= (2.0 * atr_200)
    parsed_high = np.where(high_vol, df['Low'], df['High'])
    parsed_low  = np.where(high_vol, df['High'], df['Low'])
    return pd.Series(parsed_high, index=df.index), pd.Series(parsed_low, index=df.index)

def get_swing_points(df, length):
    win = 2 * length + 1
    roll_max = df['High'].rolling(window=win, center=True).max()
    roll_min = df['Low'].rolling(window=win, center=True).min()
    return (df['High'] == roll_max), (df['Low'] == roll_min)

def detect_structure_and_ob(df, parsed_high, parsed_low, swing_high, swing_low):
    closes, highs, lows = df['Close'].values, df['High'].values, df['Low'].values
    ph_arr, pl_arr = parsed_high.values, parsed_low.values
    sh_arr, sl_arr = swing_high.values, swing_low.values
    n = len(df)

    last_sh_price, last_sh_idx = np.nan, -1
    last_sl_price, last_sl_idx = np.nan, -1
    sh_crossed, sl_crossed = False, False
    order_blocks = []

    for i in range(n):
        if sh_arr[i]:
            last_sh_price, last_sh_idx, sh_crossed = highs[i], i, False
        if sl_arr[i]:
            last_sl_price, last_sl_idx, sl_crossed = lows[i], i, False

        if not np.isnan(last_sh_price) and closes[i] > last_sh_price and not sh_crossed and last_sh_idx >= 0:
            sh_crossed = True
            if i > last_sh_idx:
                segment = pl_arr[last_sh_idx:i]
                local_idx = int(np.argmin(segment))
                ob_idx = last_sh_idx + local_idx
                order_blocks.append({
                    'type': 'Bullish', 'ob_high': ph_arr[ob_idx], 'ob_low': pl_arr[ob_idx], 
                    'ob_idx': ob_idx, 'active': True
                })

        if not np.isnan(last_sl_price) and closes[i] < last_sl_price and not sl_crossed and last_sl_idx >= 0:
            sl_crossed = True
            if i > last_sl_idx:
                segment = ph_arr[last_sl_idx:i]
                local_idx = int(np.argmax(segment))
                ob_idx = last_sl_idx + local_idx
                order_blocks.append({
                    'type': 'Bearish', 'ob_high': ph_arr[ob_idx], 'ob_low': pl_arr[ob_idx], 
                    'ob_idx': ob_idx, 'active': True
                })

    for ob in order_blocks:
        start = ob['ob_idx'] + 1
        for j in range(start, n):
            if ob['type'] == 'Bullish' and lows[j] < ob['ob_low']:
                ob['active'] = False; break
            if ob['type'] == 'Bearish' and highs[j] > ob['ob_high']:
                ob['active'] = False; break

    return order_blocks

def detect_fvg(df):
    closes, highs, lows = df['Close'].values, df['High'].values, df['Low'].values
    n = len(df)
    fvg_list = []

    for i in range(2, n):
        if lows[i] > highs[i-2] and closes[i-1] > highs[i-2]:
            fvg_list.append({'type': 'Bullish', 'top': lows[i], 'bottom': highs[i-2], 'idx': i, 'active': True})
        if highs[i] < lows[i-2] and closes[i-1] < lows[i-2]:
            fvg_list.append({'type': 'Bearish', 'top': lows[i-2], 'bottom': highs[i], 'idx': i, 'active': True})

    for fvg in fvg_list:
        start = fvg['idx'] + 1
        for j in range(start, n):
            if fvg['type'] == 'Bullish' and lows[j] < fvg['bottom']:
                fvg['active'] = False; break
            if fvg['type'] == 'Bearish' and highs[j] > fvg['top']:
                fvg['active'] = False; break

    return fvg_list

def calculate_premium_discount_zones(df):
    trailing_top    = float(df['High'].max())
    trailing_bottom = float(df['Low'].min())

    return {
        'trailing_top'    : trailing_top,
        'trailing_bottom' : trailing_bottom,
        'premium_top'     : trailing_top,
        'premium_bottom'  : 0.95 * trailing_top    + 0.05 * trailing_bottom,
        'eq_top'          : 0.525 * trailing_top   + 0.475 * trailing_bottom,
        'eq_bottom'       : 0.525 * trailing_bottom + 0.475 * trailing_top,
        'equilibrium'     : (trailing_top + trailing_bottom) / 2,
        'discount_top'    : 0.95 * trailing_bottom + 0.05 * trailing_top,
        'discount_bottom' : trailing_bottom,
    }

def get_price_zone(price, zones):
    if price >= zones['premium_bottom']:
        return "🔴 Premium"
    elif price <= zones['discount_top']:
        return "🟢 Discount"
    elif zones['eq_bottom'] <= price <= zones['eq_top']:
        return "⚪ Equilibrium"
    elif price > zones['eq_top']:
        return "🟠 Menuju Premium"
    else:
        return "🟡 Menuju Discount"

def calculate_trendlines(df, length=14, mult=1.0, calc_method='Atr'):
    n      = len(df)
    closes = df['Close'].values
    highs  = df['High'].values
    lows   = df['Low'].values

    ph_arr = np.full(n, np.nan)
    pl_arr = np.full(n, np.nan)
    for i in range(length, n - length):
        window_high = highs[i - length: i + length + 1]
        window_low  = lows[i - length: i + length + 1]
        if highs[i] == np.max(window_high):
            ph_arr[i + length] = highs[i]
        if lows[i] == np.min(window_low):
            pl_arr[i + length] = lows[i]

    if calc_method == 'Atr':
        atr_series = calc_atr(df, length).values
        slope_arr  = atr_series / length * mult
    else:
        slope_arr  = pd.Series(closes).rolling(window=length, min_periods=1).std().values / length * mult

    upper, lower = 0.0, 0.0
    slope_ph, slope_pl = 0.0, 0.0
    upos, dnos = 0, 0

    tl_upper    = np.zeros(n)
    tl_lower    = np.zeros(n)
    tl_upos     = np.zeros(n)
    tl_dnos     = np.zeros(n)
    tl_breakout = np.zeros(n)

    for i in range(n):
        sl = slope_arr[i]
        if not np.isnan(ph_arr[i]): slope_ph = sl
        if not np.isnan(pl_arr[i]): slope_pl = sl

        upper = ph_arr[i] if not np.isnan(ph_arr[i]) else upper - slope_ph
        lower = pl_arr[i] if not np.isnan(pl_arr[i]) else lower + slope_pl

        tl_upper[i] = upper - slope_ph * length
        tl_lower[i] = lower + slope_pl * length

        prev_upos, prev_dnos = upos, dnos

        if not np.isnan(ph_arr[i]): upos = 0
        elif closes[i] > tl_upper[i]: upos = 1

        if not np.isnan(pl_arr[i]): dnos = 0
        elif closes[i] < tl_lower[i]: dnos = 1

        tl_upos[i], tl_dnos[i] = upos, dnos

        if upos > prev_upos: tl_breakout[i] = 1
        elif dnos > prev_dnos: tl_breakout[i] = -1

    df['TL_Upper']    = tl_upper
    df['TL_Lower']    = tl_lower
    df['TL_UPos']     = tl_upos
    df['TL_DNos']     = tl_dnos
    df['TL_Breakout'] = tl_breakout
    return df

def analyze_sector(sector_name, ticker_list):
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
                
            if df.empty or len(df) < 100 or 'Close' not in df.columns:
                continue

            df.reset_index(inplace=True)

            df['ATR_14'] = calc_atr(df, ATR_PERIOD_TP)
            atr_today = float(df['ATR_14'].iloc[-1])

            df = calculate_ott(df, length=OTT_PERIOD, percent=OTT_PERCENT)
            df = calculate_wavetrend(df, n1=WT_N1, n2=WT_N2)

            atr_200 = calc_atr(df, OB_FILTER_ATR_PERIOD)
            parsed_high, parsed_low = get_parsed_hl(df, atr_200)
            sh_int, sl_int = get_swing_points(df, INTERNAL_SWING_LENGTH)
            sh_sw,  sl_sw  = get_swing_points(df, SWING_LENGTH)
            obs_int = detect_structure_and_ob(df, parsed_high, parsed_low, sh_int, sl_int)
            obs_sw  = detect_structure_and_ob(df, parsed_high, parsed_low, sh_sw,  sl_sw)
            all_obs    = obs_int + obs_sw
            active_obs = [o for o in all_obs if o['active']]
            active_fvg = [f for f in detect_fvg(df) if f['active']]

            df = calculate_trendlines(df, length=TL_LENGTH, mult=TL_MULT, calc_method=TL_CALC_METHOD)

            price_today = float(df["Close"].iloc[-1])
            var_today   = float(df['VAR'].iloc[-1])
            ott_today   = float(df['OTT'].iloc[-1])
            wt1_today, wt2_today = float(df['WT1'].iloc[-1]), float(df['WT2'].iloc[-1])
            wt1_prev,  wt2_prev  = float(df['WT1'].iloc[-2]), float(df['WT2'].iloc[-2])

            zones = calculate_premium_discount_zones(df)
            price_zone  = get_price_zone(price_today, zones)
            is_discount = price_today <= zones['discount_top']
            is_premium  = price_today >= zones['premium_bottom']

            tl_breakout_today = int(df['TL_Breakout'].iloc[-1])
            tl_breakout_score = 30 if tl_breakout_today == 1 else (-30 if tl_breakout_today == -1 else 0)

            smc_status, smc_score = "⚪ Di Luar Zona", 0
            for ob in active_obs:
                if ob['type'] == 'Bullish' and ob['ob_low'] <= price_today <= ob['ob_high']:
                    smc_status = "🟢 Di Dalam Bullish OB"; smc_score += 40; break
            if smc_score == 0:
                for fvg in active_fvg:
                    if fvg['type'] == 'Bullish' and fvg['bottom'] <= price_today <= fvg['top']:
                        smc_status = "🟢 Di Dalam Bullish FVG"; smc_score += 30; break

            # Score & Action Calculation
            score = smc_score
            trend = "UPTREND" if var_today > ott_today else "DOWNTREND"
            score += (50 if trend == "UPTREND" else -50)
            score += tl_breakout_score
            score += (30 if is_discount else (-30 if is_premium else 0))

            action = "WAIT"
            if is_discount and trend == "UPTREND" and smc_score > 0:
                action = "🔥 SNIPER BUY"
            elif is_discount and trend == "UPTREND":
                action = "🟢 BUY"
            elif is_premium or trend == "DOWNTREND":
                action = "🔴 HINDARI"

            results.append({
                "scan_date": execution_time.date(),        # Kolom Kunci Partitioning
                "created_at": execution_time,              # Timestamp Waktu Running
                "sector": sector_name,
                "ticker": ticker,
                "action": action,
                "score": int(score),
                "trend_ott": trend,
                "price_today": float(price_today),
                "price_zone": price_zone,
                "smc_status": smc_status,
                "var_mavg": round(var_today, 2),
                "ott_line": round(ott_today, 2)
            })

        except Exception as e:
            print(f" -> ❌ Error pada {ticker}: {e}")

    return pd.DataFrame(results)

# ==========================================
# MAIN EXECUTION
# ==========================================
if __name__ == "__main__":
    print("🤖 MEMULAI MARKET SCANNER (TARGET OUTPUT: BIGQUERY APPEND)")
    
    all_results = []
    for sector, tickers in SECTOR_CONFIG.items():
        df_sector = analyze_sector(sector, tickers)
        if not df_sector.empty:
            all_results.append(df_sector)

    if all_results:
        df_final = pd.concat(all_results, ignore_index=True)
        # Upload gabungan seluruh sektor ke BigQuery
        save_to_bigquery(df_final, BQ_DATASET_ID, BQ_TABLE_NAME)
    else:
        print("⚠️ Tidak ada data hasil pemindaian yang valid.")

    print("🏁 PROSES SCANNING & INGGESTION SELESAI 🏁")
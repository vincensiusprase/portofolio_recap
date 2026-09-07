# FMCG Real-Time Production & Anomaly Streaming Pipeline

![Python](https://img.shields.io/badge/Python-3.10%2B-blue?style=for-the-badge&logo=python)
![GCP Pub/Sub](https://img.shields.io/badge/Google_Cloud_Pub%2FSub-4285F4?style=for-the-badge&logo=googlecloud&logoColor=white)
![Google BigQuery](https://img.shields.io/badge/Google_BigQuery-669DF6?style=for-the-badge&logo=googlebigquery&logoColor=white)

## 📌 Business Case & Overview
Perusahaan manufaktur FMCG (*Fast-Moving Consumer Goods*) yang memproduksi minuman botol mengoperasikan lini produksi secara 24/7. Sebelumnya, pencatatan performa efisiensi mesin (*Overall Equipment Effectiveness* / OEE) dan *downtime* dilakukan secara manual di akhir shift.

Pendekatan manual tersebut menimbulkan kerugian bisnis:
* **Response Time Lambat:** *Micro-stoppages* (< 5 menit) tidak terdeteksi cepat hingga output produksi harian turun signifikan.
* **Loss Tracking Tidak Akurat:** *Downtime* yang terlewat membuat tim *maintenance* kesulitan menemukan *root cause* utama.
* **Potensi Kegagalan Produk:** Kegagalan kontrol suhu (*temperature threshold*) pada mesin dapat merusak ribuan botol sebelum disadari teknisi.

**Solusi:**
Membangun *real-time streaming pipeline* dari IoT sensor mesin langsung ke BigQuery via Pub/Sub BigQuery Subscription untuk melakukan pemantauan OEE dan deteksi anomali suhu/vibrasi mesin secara *near-real-time*.

---

## 🏗️ System Architecture

    ```mermaid
    flowchart LR
        A[IoT Telemetry Simulator\nPython Script] -->|Publish JSON Event| B(Google Cloud Pub/Sub\nTopic: fmcg-telemetry-stream)
        B -->|BigQuery Direct Subscription\nNo Dataflow Required| C[(Google BigQuery\nDataset: fmcg_analytics)]
        C -->|Real-Time SQL Analytics| D[Dashboard OEE & Anomaly Alerting\nLooker Studio / SQL]
    ```

---

## 🛠️ Tech Stack & Tools
* **Programming Language**: Python 3.x
* **Message Broker**: Google Cloud Pub/Sub
* **Data Warehouse**: Google BigQuery
* **IDE & Tools**: VS Code, Google Cloud SDK (gcloud CLI)

---

## 📂 Project Structure

    ```text
    streaming-pipeline-manufacture/
    │
    ├── venv/                       # Virtual environment
    ├── gcp-key.json                # Service Account Key GCP (Di-ignore dari Git)
    ├── main.py                     # Python script IoT telemetry simulator
    └── README.md                   # Project documentation
    ```

---

### 🗄️ Database Schema & DDL

Tabel di BigQuery didesain menggunakan skema terstruktur dengan fungsionalitas **Partitioning** berdasarkan tanggal dan **Clustering** berdasarkan ID Lini & Mesin untuk optimasi biaya serta performa query.

    ```sql
    CREATE TABLE IF NOT EXISTS `[YOUR_PROJECT_ID].fmcg_analytics.fact_machine_telemetry` (
        timestamp TIMESTAMP,
        line_id STRING,
        machine_id STRING,
        machine_type STRING,
        status STRING,
        units_produced INT64,
        defects INT64,
        temperature_celsius FLOAT64,
        vibration_rms FLOAT64
    )
    PARTITION BY DATE(timestamp)
    CLUSTER BY line_id, machine_id;
    ```

### 🚀 Setup & Installation Guide

#### 1. Prasyarat & Lingkungan Lokal
* Clone repository ini dan navigasikan ke folder project.
* Buat dan aktifkan Python Virtual Environment:
    ```bash
    python -m venv venv
    # Activate di Windows PowerShell:
    .\venv\Scripts\activate
    ```
* Install dependensi library:
    ```bash
    pip install google-cloud-pubsub
    ```
#### 2. Konfigurasi Google Cloud Platform
* Buat Pub/Sub Topic bernama fmcg-telemetry-stream.
* Buat Dataset fmcg_analytics dan jalankan script DDL untuk membuat tabel fact_machine_telemetry di BigQuery.
* Buat Pub/Sub BigQuery Subscription menggunakan gcloud CLI di Cloud Shell:
    ```bash
    gcloud pubsub subscriptions create fmcg-telemetry-bq-sub \
        --topic=fmcg-telemetry-stream \
        --bigquery-table=project-1-474502:fmcg_analytics.fact_machine_telemetry \
        --use-table-schema
    ```
#### 3. Menjalankan Pipeline
* Simpan file Service Account Key GCP berformat JSON di folder project.
* Jalankan script simulator:
    ```bash
    python main.py
    ```
* Tekan Ctrl + C untuk menghentikan pengiriman data.

### 📊 Sample Analytical SQL Query
Query berikut digunakan untuk menghitung Availability, Quality Rate, dan mendeteksi anomali vibrasi/suhu pada jendela waktu 15 menit terakhir:
    ```sql
    WITH RawData AS (
    SELECT
        line_id,
        machine_id,
        status,
        units_produced,
        defects,
        temperature_celsius,
        vibration_rms,
        timestamp
    FROM
        `[YOUR_PROJECT_ID].fmcg_analytics.fact_machine_telemetry`
    WHERE
        timestamp >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 15 MINUTE)
    )
    SELECT
    line_id,
    machine_id,
    COUNT(1) AS total_events_15m,
    SUM(units_produced) AS total_units,
    SUM(defects) AS total_defects,
    ROUND(SAFE_DIVIDE(SUM(units_produced) - SUM(defects), SUM(units_produced)) * 100, 2) AS quality_rate_pct,
    ROUND(COUNTIF(status = 'RUNNING') / COUNT(1) * 100, 2) AS availability_rate_pct,
    MAX(temperature_celsius) AS max_temp_celsius,
    COUNTIF(vibration_rms > 4.0) AS high_vibration_alerts
    FROM
    RawData
    GROUP BY
    line_id,
    machine_id
    ORDER BY
    line_id,
    machine_id;
    ```






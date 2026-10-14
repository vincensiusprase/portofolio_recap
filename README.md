# Data, Analytics & Automation Portfolio

A collection of selected projects across workflow automation, business intelligence, data engineering, data science, and AI. Each project folder contains its own assets and, where available, a README with project-specific setup and implementation details.

## 📌 Featured Projects Summary

| Area | Project | Tech Stack | Key Impact & Metrics |
| :--- | :--- | :--- | :--- |
| Workflow automation | [B2B Lead Generation Web App](./01_workflow_automation/gmaps-lead-scraper/) | Google Apps Script, Google Places API, Bootstrap 5, Select2 | Reduced Google Cloud API costs by up to **60%** with field masking and deduplication |
| Business intelligence | [Employee Performance Analytics](./02_business_intelligence/employee-performance-analytics/README.md) | Power BI, DAX, Power Query | Analyzes **6,009** active employees, compensation, 9-box performance, and store operations |
| Business intelligence | [Procurement Analytics](./02_business_intelligence/procurement-analytics/README.md) | Power BI, DAX | Tracks **$979.4M** spend, **$104.3M** savings, supplier performance, and delivery compliance |
| Data engineering | [IDX Stock Scanner](./03_data_engineering/batch-pipeline-idx-stock-scanner/README.md) | Python, Yahoo Finance, BigQuery, GitHub Actions | Computes **5** technical indicators (OTT, WaveTrend, SMC, ATR, trendline) per ticker and scans any sector or all sectors with duplicate-safe BigQuery uploads |
| Data engineering | [FMCG Streaming Pipeline](./03_data_engineering/streaming-pipeline-manufacture/README.md) | Python, Google Cloud Pub/Sub, BigQuery | Streams machine telemetry via a **Dataflow-free** Pub/Sub–BigQuery subscription for near-real-time OEE and temperature/vibration anomaly detection, partitioned by day and clustered by line/machine |
| Data engineering | [FMCG End-to-End Data Architecture](./03_data_engineering/fmcg_end_to_end_data_architecture/README.md) | Dataform, SQLX, Google Cloud Storage, BigQuery | Loads **7** CSV extracts and transforms them through **5** layers (raw→staging→intermediate→mart→consumption), publishing **5** reporting views plus ABC, RFM, safety-stock, and reorder-point models at a 95% service level |
| Data science | [Heating Oil Consumption Forecast](./04_data_science/heating-oil-prediction/README.md) | KNIME Analytics Platform, Linear Regression | Achieved **R² = 0.802** and **MAPE = 8.3%** for supply chain planning |
| AI engineering | [RAG FMEA Maintenance Bot](./05_ai_engineer/rag_fmea/README.md) | Python, Vertex AI Discovery Engine, NVIDIA NIM, Firestore, Discord | **98.21%** pass rate across **56** evaluation cases |
| Web application | [Inventory Management - Super Glass](./06_web_app/IM%20SG/README.md) | Google Apps Script, Google Sheets, Bootstrap, jQuery, DataTables, Chart.js | Runs on **12** structured sheets with **5** role-based access levels, covering lot/expiry tracking, pallet tracking, delivery-note reconciliation, and stock-opname results |

## Highlights

- The lead-generation app uses Places API field masks and deduplication to reduce API costs; its project documentation reports savings of up to **60%**.
- The heating-oil forecasting workflow reports **R² = 0.802** and **MAPE = 8.3%** on its test set.
- The IDX scanner supports dry runs, sector-based scans, optional BigQuery uploads, and scheduled/manual GitHub Actions runs.
- The FMCG data projects demonstrate both streaming ingestion and a warehouse transformation workflow.
- The FMEA bot combines retrieval, generated answers, session history, channel restrictions, and an evaluation runner.

## Technology Areas

- **Languages:** Python, JavaScript / Google Apps Script, SQL, DAX
- **Analytics and BI:** Power BI, KNIME, BigQuery
- **Cloud and data platforms:** Google Cloud Storage, Pub/Sub, Vertex AI Discovery Engine, Firestore, Google Sheets
- **Web technologies:** HTML, CSS, Bootstrap, jQuery, Select2, DataTables, Chart.js
- **Practices:** Data modeling, ETL/ELT, forecasting, dashboard design, API integration, workflow automation, and model evaluation

## Getting Started

This repository is a portfolio of independent projects rather than a single application. Start with the featured projects summary above and follow that project's README for prerequisites, configuration, and run or deployment instructions. Some projects require Google Cloud resources, API credentials, or desktop software.

For a checkout that includes the Dataform project submodule, clone with:

```bash
git clone --recurse-submodules https://github.com/vincensiusprase/portofolio_recap.git
```

Never commit API keys, bot tokens, service-account credentials, or local environment files. Use the configuration method documented by the relevant project, such as Script Properties, environment variables, or Google Cloud authentication.

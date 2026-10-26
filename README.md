# Data, Analytics & Automation Portfolio

A collection of portfolio projects spanning workflow automation, business intelligence, data engineering, data science, AI engineering, and web applications. Each project includes its own README with visuals, architecture, setup instructions, and repository structure.

## Project Catalog

| Area | Project | Technology | Summary |
| --- | --- | --- | --- |
| Workflow automation | [B2B Lead Generation Web App](./01_workflow_automation/gmaps-lead-scraper/) | Google Apps Script, Google Places API, Bootstrap, Select2 | Configurable lead-generation web app with field masking, deduplication, address normalization, and multi-layer business filtering. |
| Workflow automation | [Recruitment Automation](./01_workflow_automation/recruitment-automation/README.md) | Google Apps Script, Sheets, Drive, Gmail, Calendar, Python | End-to-end recruitment workflow covering CV upload, parsing, scoring, screening, project tasks, interviews, offer letters, and onboarding emails. |
| Business intelligence | [Employee Performance Analytics](./02_business_intelligence/employee-performance-analytics/README.md) | Power BI, DAX, Power Query | Analyzes 6,009 active employees, compensation, performance, and store operations through an interactive dashboard. |
| Business intelligence | [Procurement Analytics](./02_business_intelligence/procurement-analytics/README.md) | Power BI, DAX, Power Query | Tracks $979.4M spend, $104.3M savings, supplier performance, delivery reliability, and compliance risk. |
| Data engineering | [IDX Stock Scanner](./03_data_engineering/batch-pipeline-idx-stock-scanner/README.md) | Python, Yahoo Finance, BigQuery, GitHub Actions | Scans IDX stocks using OTT, WaveTrend, SMC, ATR, and trendline indicators with duplicate-safe BigQuery uploads. |
| Data engineering | [FMCG Streaming Pipeline](./03_data_engineering/streaming-pipeline-manufacture/README.md) | Python, Google Cloud Pub/Sub, BigQuery | Streams production telemetry for near-real-time OEE, temperature, vibration, and anomaly monitoring. |
| Data engineering | [FMCG End-to-End Data Architecture](./03_data_engineering/fmcg_end_to_end_data_architecture/README.md) | Dataform, SQLX, GCS, BigQuery | Transforms FMCG source extracts through raw, staging, intermediate, mart, and consumption layers. |
| Data science | [FMCG Commercial Intelligence & Predictive Analytics](./04_data_science/fmcg_commercial_intelligence_and_predictive_analytics/README.md) | Python, Pandas, statistical analysis, machine learning | Combines sales, inventory, outlet, promotion, customer, and distributor data for commercial insights and predictive use cases. |
| Data science | [Heating Oil Consumption Forecast](./04_data_science/heating-oil-prediction/README.md) | KNIME Analytics Platform, Linear Regression | Forecasts residential heating-oil consumption with reported R² = 0.802 and MAPE = 8.3%. |
| AI engineering | [RAG FMEA Maintenance Bot](./05_ai_engineer/rag_fmea/README.md) | Python, Vertex AI Discovery Engine, NVIDIA NIM, Firestore, Discord | Searches FMEA knowledge, generates maintenance answers, stores session history, and evaluates retrieval quality. |
| Web application | [Inventory Management - Super Glass](./06_web_app/IM%20SG/README.md) | Google Apps Script, Sheets, Bootstrap, jQuery, DataTables, Chart.js | Inventory web app covering lot and expiry tracking, pallet management, delivery-note reconciliation, and stock opname. |

## Featured Capabilities

- **Workflow automation:** Automated candidate lifecycle, email notifications, document generation, scheduling, and operational data updates.
- **Business intelligence:** Interactive dashboards for HR performance, procurement spend, supplier management, and compliance.
- **Data engineering:** Batch and streaming pipelines with BigQuery, Pub/Sub, Dataform, SQLX, and GitHub Actions.
- **Data science:** Forecasting, commercial analytics, promotion analysis, and predictive modeling foundations.
- **AI engineering:** Retrieval-augmented generation, multi-agent orchestration, tool use, conversation memory, and evaluation.
- **Web applications:** Role-based operational interfaces built with Google Apps Script and Google Sheets.

## Technology Areas

- **Languages:** Python, JavaScript / Google Apps Script, SQL, SQLX, DAX
- **Analytics:** Power BI, KNIME, Pandas, BigQuery
- **Cloud platforms:** Google Cloud Storage, Pub/Sub, Vertex AI Discovery Engine, Firestore, Google Sheets
- **Web technologies:** HTML, CSS, Bootstrap, jQuery, Select2, DataTables, Chart.js
- **Practices:** Data modeling, ETL/ELT, forecasting, dashboard design, API integration, workflow automation, RAG, and model evaluation

## Getting Started

This repository contains independent projects rather than one single application. Open the relevant project README for prerequisites, visuals, architecture, configuration, and deployment instructions.

For a checkout that includes the Dataform project submodule:

```bash
git clone --recurse-submodules https://github.com/vincensiusprase/portofolio_recap.git
```

Some projects require Google Cloud resources, API credentials, desktop software, or local environment variables. Never commit API keys, bot tokens, service-account credentials, `.env` files, or confidential source data.

## Repository Organization

```text
├── 01_workflow_automation/     # Apps Script and business workflow automation
├── 02_business_intelligence/   # Power BI dashboards and analytics
├── 03_data_engineering/        # Batch, streaming, and warehouse pipelines
├── 04_data_science/            # Forecasting and commercial analytics
├── 05_ai_engineer/             # Multi-agent and RAG applications
├── 06_web_app/                 # Operational web applications
└── README.md                   # Portfolio index and project catalog
```

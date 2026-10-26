# RAG FMEA Maintenance Bot

A Discord bot for searching and analyzing **Failure Mode and Effects Analysis (FMEA)** data. The bot retrieves FMEA records and corrective steps from Vertex AI Discovery Engine, uses Nemotron through an NVIDIA NIM OpenAI-compatible endpoint to generate responses, and stores per-session conversation history in Google Cloud Firestore. The RAG evaluation runner continues to use DeepSeek as its judge model.

## Features

- Answers questions about assets, FMEA records, failure modes, effects, RPN, prevention, and corrective steps.
- Supports follow-up questions using conversation context.
- Restricts usage by Discord channel name or channel ID.
- Stores conversation history in Firestore and provides a command to clear it.
- Includes automated RAG evaluation with LLM-as-a-Judge scoring and confusion-matrix metrics.
- **Monitoring**: structured logging (JSON/text) plus in-process metrics (latency p50–p99, throughput, error rate, token usage) and a health check for Firestore.
- **Feedback system**: 👍/👎 buttons on every bot answer, stored in Firestore (`bot_maintenance_feedback`) so weak answers can drive prompt/dataset improvements.
- **Stress testing**: concurrent load runner (`stress_test.py`) that measures latency percentiles, throughput, and error rate under parallel load, with a Locust-style ramp mode.

## High-level architecture

```text
Discord User
    |
    v
Discord Bot (src/backend/main.py)
    |-- Vertex AI Discovery Engine -> retrieves FMEA data
    |-- NVIDIA NIM (Nemotron)       -> generates the response
    |-- Firestore                   -> stores session history
    |-- Feedback store              -> stores 👍/👎 ratings (Firestore)
    `-- Monitoring                  -> structured logs + latency/error metrics
```

Important files:

| Path | Description |
| --- | --- |
| `src/backend/main.py` | Discord bot entry point and retrieval/generation logic |
| `src/backend/config.py` | Runtime configuration shared by bot, monitoring, feedback, and stress test |
| `src/backend/monitoring.py` | Structured logging, metrics collector, health check |
| `src/backend/feedback.py` | Feedback storage and aggregation (Firestore + local fallback) |
| `src/backend/stress_test.py` | Concurrent load / stress test runner |
| `src/backend/eval_rag.py` | Automated evaluation runner |
| `src/backend/requirement.txt` | Python dependencies |
| `src/backend/test_dataset.json` | Evaluation test dataset |
| `public/data/` | FMEA and corrective-step reference data |
| `public/` | CSV and JSON evaluation + stress-test outputs |

## Prerequisites

Install or prepare the following:

- Windows 10/11
- Python 3.10 or newer
- Git
- Google Cloud CLI (`gcloud`)
- A Google Cloud project with these APIs enabled:
  - Discovery Engine API
  - Firestore API
- A Discord application and bot token
- An NVIDIA NIM endpoint, API key, and Nemotron model ID for the Discord bot
- A DeepSeek API key if running the RAG evaluation

Google Cloud, NVIDIA NIM, and DeepSeek services may incur costs or quota limits. Check billing and quotas before running the bot or large evaluations.

## Setup using Windows PowerShell

### 1. Open the project directory

```powershell
Set-Location "D:\VS Code\portfolio_recap\05_ai_engineer\rag_fmea"
```

### 2. Create and activate a virtual environment

```powershell
py -3 -m venv .venv
.\.venv\Scripts\Activate.ps1
```

If PowerShell blocks the activation script, run this once in the appropriate PowerShell terminal:

```powershell
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
```

Then activate the environment again:

```powershell
.\.venv\Scripts\Activate.ps1
```

### 3. Install dependencies

```powershell
python -m pip install --upgrade pip
python -m pip install -r ".\src\backend\requirement.txt"
```

### 4. Configure Google Cloud credentials

Log in with Application Default Credentials:

```powershell
gcloud auth application-default login
gcloud config set project "YOUR_GCP_PROJECT_ID"
```

The account should have permission to:

- read data from the Discovery Engine data store;
- read, write, and delete documents in the `bot_maintenance_sessions` Firestore collection.

For servers or CI, use a service account through `GOOGLE_APPLICATION_CREDENTIALS`. Never commit a service-account JSON file to the repository.

### 5. Create the `.env` file

Create `src/backend/.env` locally. Do not upload it to Git because it contains tokens and API keys.

```powershell
@"
DISCORD_BOT_TOKEN=your_discord_bot_token
# NVIDIA NIM OpenAI-compatible endpoint; include /v1 in the base URL
NVIDIA_NIM_API_KEY=your_nvidia_nim_api_key
NVIDIA_NIM_BASE_URL=https://your-nim-endpoint/v1
NVIDIA_NIM_MODEL=your-nemotron-model-id
# Used only by src/backend/eval_rag.py
DEEPSEEK_API_KEY=your_deepseek_api_key
GCP_PROJECT_ID=your-gcp-project-id
GCP_LOCATION=global
DATA_STORE_ID=fmea-data_1789894369425
ALLOWED_CHANNEL_NAME=maintenance
# ALLOWED_CHANNEL_ID=123456789012345678
# EVAL_OUTPUT_DIR=D:\VS Code\portfolio_recap\05_ai_engineer\rag_fmea\public
# --- Monitoring & feedback (opsional) ---
LOG_LEVEL=INFO
LOG_FORMAT=text
ENABLE_FEEDBACK_BUTTONS=true
# ENABLE_ADMIN_COMMANDS=true
# ENABLE_FEEDBACK_FILTER=false
"@ | Set-Content -Encoding utf8 ".\src\backend\.env"
```

Environment variables:

| Variable | Required | Description |
| --- | --- | --- |
| `DISCORD_BOT_TOKEN` | Yes for the bot | Token from the Discord Developer Portal |
| `NVIDIA_NIM_API_KEY` | Yes for the bot | API key for the NVIDIA NIM endpoint |
| `NVIDIA_NIM_BASE_URL` | Yes for the bot | OpenAI-compatible NIM API base URL, including `/v1` |
| `NVIDIA_NIM_MODEL` | Yes for the bot | Model ID served by the NIM endpoint |
| `DEEPSEEK_API_KEY` | Yes for evaluation only | API key for the DeepSeek evaluation judge |
| `GCP_PROJECT_ID` | Yes | Google Cloud project ID |
| `GCP_LOCATION` | No | Discovery Engine location; defaults to `global` |
| `DATA_STORE_ID` | Yes | One or more comma-separated data-store IDs |
| `ALLOWED_CHANNEL_NAME` | No | Only process messages in a channel with this name |
| `ALLOWED_CHANNEL_ID` | No | Additional filter based on the channel ID |
| `EVAL_OUTPUT_DIR` | No | Evaluation output directory |
| `LOG_LEVEL` | No | Log level (`DEBUG`/`INFO`/`WARNING`/`ERROR`); default `INFO` |
| `LOG_FORMAT` | No | `text` (human) or `json` (Cloud Logging friendly); default `text` |
| `METRICS_WINDOW` | No | In-process metric ring-buffer size; default `500` |
| `ENABLE_ADMIN_COMMANDS` | No | Expose `/health`, `/metrics`, `/feedback-stats` on Discord; default `false` |
| `ENABLE_FEEDBACK_BUTTONS` | No | Attach 👍/👎 buttons to bot answers; default `true` |
| `ENABLE_FEEDBACK_FILTER` | No | Skip RAG for feedback-like messages (e.g. "makasih"); default `false` |

If both channel filters are empty, no channel restriction is applied. For production deployments, prefer `ALLOWED_CHANNEL_ID` because channel names may change or may not be unique.

### 6. Configure the Discord bot

In the Discord Developer Portal:

1. Create an application and bot.
2. Copy the bot token to `DISCORD_BOT_TOKEN`.
3. Enable **Message Content Intent** on the Bot page.
4. Invite the bot to the server with permission to read and send messages.
5. Make sure the bot can access the configured channel, such as `maintenance`.

## Run the bot

Run the bot from `src/backend` so the default dataset and configuration paths work as expected:

```powershell
Set-Location "D:\VS Code\portfolio_recap\05_ai_engineer\rag_fmea\src\backend"
..\..\.venv\Scripts\Activate.ps1
python .\main.py
```

If the path-based activation command causes issues, activate from the project root:

```powershell
Set-Location "D:\VS Code\portfolio_recap\05_ai_engineer\rag_fmea"
.\.venv\Scripts\Activate.ps1
Set-Location ".\src\backend"
python .\main.py
```

The bot is connected when the console reports that it is ready. Stop the process with `Ctrl+C`.

### Bot commands and behavior

- The bot processes direct messages immediately.
- In a server, the bot processes messages when mentioned and when the channel filters match.
- To clear the current session history, send one of: `!reset`, `!clear`, `reset`, `clear memory`, or `hapus memori`.
- When `ENABLE_ADMIN_COMMANDS=true`, these commands are also available: `/health`, `/metrics`, and `/feedback-stats`.

## Monitoring

`monitoring.py` replaces `print()` with structured logging and keeps lightweight in-process metrics:

- **Logging** — one line per event with `timestamp`, `level`, `service`, `request_id`, `session_id`, and any structured fields. Set `LOG_FORMAT=json` to emit Cloud Logging–friendly JSON, or `text` for readable console output.
- **Metrics** — latency (`min`/`p50`/`p90`/`p95`/`p99`/`max`), throughput (req/s), error rate, token usage, and per-source breakdown. Stored in a ring buffer of `METRICS_WINDOW` requests.
- **Health check** — `monitoring.health_snapshot()` pings Firestore (cached for `HEALTHCHECK_TTL_SECONDS`) and reports `ok` / `degraded` plus a metrics summary.

Inspect metrics programmatically:

```python
import monitoring
print(monitoring.METRICS.snapshot())
print(monitoring.health_snapshot(db=None, force=True))
```

Or from Discord (when `ENABLE_ADMIN_COMMANDS=true`): `/metrics` and `/health`.

## Feedback system

Each bot answer can be rated with 👍 / 👎 buttons (enabled by default via `ENABLE_FEEDBACK_BUTTONS`). Ratings are stored in the Firestore collection `bot_maintenance_feedback` together with the question, the answer, the session, the user, and a UTC timestamp.

- If Firestore is unavailable, feedback is appended to `feedback_fallback.ndjson` next to the backend so nothing is lost offline.
- Aggregate stats via `/feedback-stats` (Discord) or:

```python
import feedback
print(feedback.get_feedback_stats(db))
```

The result includes total ratings, 👍/👎 counts, satisfaction rate, and the sessions with the most negative feedback — a useful signal for prompt or dataset fixes. Review `feedback_fallback.ndjson` when operating offline.

## Stress testing

`stress_test.py` runs the real RAG pipeline (`generate_maintenance_response`) concurrently to measure behaviour under load. Run it from `src/backend`:

```powershell
Set-Location "d:\VS Code\portfolio_recap\05_ai_engineer\rag_fmea"
.\.venv\Scripts\Activate.ps1
Set-Location ".\src\backend"

# 4 worker paralel, 12 request
python .\stress_test.py --concurrency 4 --requests 12

# Beban lebih besar pada satu kategori
python .\stress_test.py -c 8 -n 56 --categories direct_master

# Smoke test tanpa Firestore (lewati pre-check & reset sesi)
python .\stress_test.py -c 2 -n 10 --no-reset --skip-precheck

# Simulasi ramp bergaya Locust (8 user, spawn 2/detik, 30 detik)
python .\stress_test.py --locust --users 8 --spawn-rate 2 --run-time 30
```

Outputs (in `public/`, or `--output-dir`):

- `stress_results_<tag>.csv`: per-request detail (latency, success, error, answer preview);
- `stress_summary_<tag>.json`: latency percentiles, throughput, error rate, per-category results.

> **Cost warning:** every stress-test request calls Discovery Engine **and** the Nemotron endpoint. Start with small numbers and use `--limit` / `--categories` to bound the run. The runner performs a pre-check of Firestore and configuration and fails fast on misconfiguration.

### Interpretation guide

| Metric | Meaning |
| --- | --- |
| `latency_ms.p50` | Typical response time (half of requests are faster) |
| `latency_ms.p95` / `p99` | Tail latency — worst-case experience under load |
| `throughput_rps` | Completed requests per second |
| `error_rate_pct` | Share of requests that raised an exception |

A healthy run has a low, flat `p99` as concurrency rises. If `p99` grows sharply with `--concurrency`, the bottleneck is usually the upstream NIM/Discovery Engine endpoint or Firestore latency.


## Run the RAG evaluation

The evaluation uses `src/backend/test_dataset.json`, runs the bot pipeline, and asks DeepSeek to judge the responses. Run it from the backend directory:

```powershell
Set-Location "D:\VS Code\portfolio_recap\05_ai_engineer\rag_fmea"
.\.venv\Scripts\Activate.ps1
Set-Location ".\src\backend"
python .\eval_rag.py
```

Examples:

```powershell
# Add a data-store configuration label
python .\eval_rag.py --tag bq_flattened

# Run selected categories only
python .\eval_rag.py --categories sequential_steps,single_step

# Limit the number of test cases
python .\eval_rag.py --limit 5

# Select the dataset and output directory
python .\eval_rag.py --dataset .\test_dataset.json --output-dir "..\..\public"
```

Evaluation output:

- `public/eval_results_<tag>.csv`: detailed results for each test case;
- `public/eval_summary_<tag>.json`: summary metrics.

Without `--tag`, the output files are `eval_results.csv` and `eval_summary.json`.

## Evaluation results

The latest evaluation executed **56 of 56 test cases** and produced the following results:

| Metric | Result |
| --- | ---: |
| Overall pass rate | **98.21%** |
| Average score | **4.93 / 5.0** |
| True positives (TP) | 43 |
| False negatives (FN) | 0 |
| True negatives (TN) | 6 |
| False positives (FP) | 0 |
| Accuracy | **100.00%** |
| Precision | **100.00%** |
| Recall | **100.00%** |
| Specificity | **100.00%** |
| F1 score | **100.00%** |

Per-category results:

| Category | Test cases | Pass rate | Average score |
| --- | ---: | ---: | ---: |
| `alias_typo` | 4 | 75.0% | 4.00 |
| `asset_overview` | 4 | 100.0% | 5.00 |
| `contextual_followup` | 8 | 100.0% | 5.00 |
| `direct_master` | 15 | 100.0% | 5.00 |
| `greeting` | 3 | 100.0% | 5.00 |
| `out_of_domain` | 6 | 100.0% | 5.00 |
| `sequential_steps` | 8 | 100.0% | 5.00 |
| `single_step` | 8 | 100.0% | 5.00 |

The evaluation flagged a manual review for judge-versus-keyword signal conflicts in test cases **2, 7, 12, 13, and 47**. These flags do not change the reported confusion-matrix result, but should be checked when interpreting the evaluation.

## Troubleshooting

### `DISCORD_BOT_TOKEN` is not set

Make sure `.env` is located exactly at `src/backend/.env`, the variable name is correct, and the process is restarted after creating or changing the file.

### Google Cloud credentials or `401/403` errors

```powershell
gcloud auth application-default login
gcloud auth application-default set-quota-project "YOUR_GCP_PROJECT_ID"
gcloud config set project "YOUR_GCP_PROJECT_ID"
```

Check the account's IAM roles, `GCP_PROJECT_ID`, data-store location, and `DATA_STORE_ID`.

### The bot does not respond in a server

Check Message Content Intent, channel permissions, whether the bot was mentioned, and whether `ALLOWED_CHANNEL_NAME` or `ALLOWED_CHANNEL_ID` matches the channel.

### `ModuleNotFoundError`

Make sure the virtual environment is active (the prompt should show `(.venv)`) and reinstall the dependencies:

```powershell
python -m pip install -r ".\src\backend\requirement.txt"
```

### Logs are too noisy or not JSON

Set `LOG_LEVEL=WARNING` to reduce verbosity, or `LOG_FORMAT=json` for structured output. Logs go to stdout; use `LOG_TO_FILE` to also write them to a file.

### Feedback is not appearing in Firestore

Check the Firestore write permission for `bot_maintenance_feedback`. If the write fails, feedback is stored locally in `feedback_fallback.ndjson`; inspect that file and re-run `/feedback-stats` once Firestore recovers.

### Stress test fails at pre-check

The pre-check verifies Firestore connectivity and that `DATA_STORE_ID` is set. Fix credentials and `DATA_STORE_ID`, or run with `--skip-precheck` to bypass Firestore verification (the test still needs Discovery Engine + NVIDIA NIM to produce meaningful results).

### A secret has been exposed

Immediately revoke and regenerate the Discord bot token and DeepSeek API key, then create a new `.env` file. Never copy secrets into the README, commits, issues, or logs.

## Security and Git

- Do not commit `.env`, virtual environments, caches, or credential files.
- Never add a service-account JSON file to the repository.
- Use a secret manager or environment variables in deployment.
- Apply least-privilege access to Firestore and Discovery Engine.
- Do not commit `feedback_fallback.ndjson` or `*.log`; both may contain user questions and answers.

## Data collected

- **Firestore `bot_maintenance_sessions`** — recent conversation turns per Discord user/channel (the last `MAX_HISTORY_MESSAGES` messages).
- **Firestore `bot_maintenance_feedback`** — 👍/👎 ratings with the related question, answer, user ID, and timestamp.
- **Structured logs** — request IDs, session IDs, latency, error messages, and token counts. Debug-level logs may include query text and answer previews; keep `LOG_LEVEL=INFO` or higher in production and redact logs before sharing.
- **Stress-test outputs** — `public/stress_results_*.csv` / `stress_summary_*.json` contain questions, latency, and short answer previews.

Clear a user's session memory with `!reset` / `hapus memori`. Feedback entries are retained for quality improvement; delete them from Firestore if a user requests removal.

## Repository Structure

```text
├── src/backend/                # Discord bot, retrieval, generation, and evaluation
├── public/data/                # FMEA reference datasets
├── public/                     # Evaluation outputs and reports
├── requirements.txt            # Python dependencies
├── .env.example                # Environment variable template
└── README.md                   # Project documentation
```

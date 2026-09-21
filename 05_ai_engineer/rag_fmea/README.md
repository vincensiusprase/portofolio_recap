# RAG FMEA Maintenance Bot

A Discord bot for searching and analyzing **Failure Mode and Effects Analysis (FMEA)** data. The bot retrieves FMEA records and corrective steps from Vertex AI Discovery Engine, uses DeepSeek to generate responses, and stores per-session conversation history in Google Cloud Firestore.

## Features

- Answers questions about assets, FMEA records, failure modes, effects, RPN, prevention, and corrective steps.
- Supports follow-up questions using conversation context.
- Restricts usage by Discord channel name or channel ID.
- Stores conversation history in Firestore and provides a command to clear it.
- Includes automated RAG evaluation with LLM-as-a-Judge scoring and confusion-matrix metrics.

## High-level architecture

```text
Discord User
    |
    v
Discord Bot (src/backend/main.py)
    |-- Vertex AI Discovery Engine -> retrieves FMEA data
    |-- DeepSeek API                -> generates the response
    `-- Firestore                   -> stores session history
```

Important files:

| Path | Description |
| --- | --- |
| `src/backend/main.py` | Discord bot entry point and retrieval/generation logic |
| `src/backend/eval_rag.py` | Automated evaluation runner |
| `src/backend/requirement.txt` | Python dependencies |
| `src/backend/test_dataset.json` | Evaluation test dataset |
| `public/data/` | FMEA and corrective-step reference data |
| `public/` | CSV and JSON evaluation outputs |

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
- A DeepSeek API key

Google Cloud and DeepSeek services may incur costs or quota limits. Check billing and quotas before running large evaluations.

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
DEEPSEEK_API_KEY=your_deepseek_api_key
GCP_PROJECT_ID=your-gcp-project-id
GCP_LOCATION=global
DATA_STORE_ID=fmea-data_1789894369425
ALLOWED_CHANNEL_NAME=maintenance
# ALLOWED_CHANNEL_ID=123456789012345678
# EVAL_OUTPUT_DIR=D:\VS Code\portfolio_recap\05_ai_engineer\rag_fmea\public
"@ | Set-Content -Encoding utf8 ".\src\backend\.env"
```

Environment variables:

| Variable | Required | Description |
| --- | --- | --- |
| `DISCORD_BOT_TOKEN` | Yes for the bot | Token from the Discord Developer Portal |
| `DEEPSEEK_API_KEY` | Yes | API key for the DeepSeek model |
| `GCP_PROJECT_ID` | Yes | Google Cloud project ID |
| `GCP_LOCATION` | No | Discovery Engine location; defaults to `global` |
| `DATA_STORE_ID` | Yes | One or more comma-separated data-store IDs |
| `ALLOWED_CHANNEL_NAME` | No | Only process messages in a channel with this name |
| `ALLOWED_CHANNEL_ID` | No | Additional filter based on the channel ID |
| `EVAL_OUTPUT_DIR` | No | Evaluation output directory |

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

### A secret has been exposed

Immediately revoke and regenerate the Discord bot token and DeepSeek API key, then create a new `.env` file. Never copy secrets into the README, commits, issues, or logs.

## Security and Git

- Do not commit `.env`, virtual environments, caches, or credential files.
- Never add a service-account JSON file to the repository.
- Use a secret manager or environment variables in deployment.
- Apply least-privilege access to Firestore and Discovery Engine.

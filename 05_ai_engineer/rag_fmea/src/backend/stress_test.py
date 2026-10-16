"""
Stress / load test untuk pipeline RAG (main.generate_maintenance_response).

Menjalankan N request secara konkuren memakai `concurrent.futures.ThreadPoolExecutor`
sehingga cocok dengan pola `asyncio.to_thread` yang dipakai bot Discord.
Mengukur latency (p50/p90/p95/p99), throughput, error rate, dan stabilitas
memori/threading — lalu menulis CSV + JSON hasilnya ke folder `public/`.

Contoh pemakaian (dari src/backend):

    # stress ringan, 4 worker, 12 request
    python stress_test.py --concurrency 4 --requests 12

    # pakai semua test case, 8 worker
    python stress_test.py --concurrency 8 --requests 56 --source all

    # hanya smoke test dataset (10 kasus pertama), tanpa hit Firestore
    python stress_test.py --concurrency 2 --requests 10 --no-firestore

Catatan biaya: setiap request memanggil Discovery Engine + NVIDIA NIM.
Jalankan jumlah kecil dulu; gunakan `--limit` untuk membatasi kasus.
"""
from __future__ import annotations

import argparse
import concurrent.futures as futures
import csv
import json
import random
import statistics
import sys
import threading
import time
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

import config  # noqa: F401  (memuat .env lebih dulu)
import monitoring
from monitoring import METRICS, log, setup_logging, timer

DEFAULT_DATASET = Path(__file__).with_name("test_dataset.json")
DEFAULT_OUTPUT_DIR = Path(__file__).resolve().parents[2] / "public"

# Pertanyaan sintetis sebagai fallback bila dataset tidak ditemukan.
FALLBACK_QUESTIONS = [
    "Apa failure mode pada FMEA-PLT-002?",
    "Berapa RPN untuk FMEA-CIP-001?",
    "Apa prevention control untuk Agitator seal failure?",
    "Di department mana mesin AST-CAPPER-01 beroperasi?",
    "Apa dampak Low boiler water level pada AST-BOILER-01?",
]


# --- Pemuat dataset -----------------------------------------------------------
def load_questions(
    dataset_path: Optional[Path] = None,
    categories: Optional[List[str]] = None,
    limit: Optional[int] = None,
) -> List[Dict[str, Any]]:
    """Muat pertanyaan dari test_dataset.json; fallback ke daftar sintetis."""
    path = Path(dataset_path) if dataset_path else DEFAULT_DATASET
    cases: List[Dict[str, Any]] = []

    if path.exists():
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
            for item in data:
                if categories and item.get("category") not in categories:
                    continue
                question = (item.get("question") or "").strip()
                if not question:
                    continue
                cases.append(
                    {
                        "id": item.get("id"),
                        "category": item.get("category", "unknown"),
                        "question": question,
                        "target_fmea_id": item.get("target_fmea_id"),
                    }
                )
        except (json.JSONDecodeError, OSError) as exc:
            log("WARNING", "gagal membaca dataset, memakai pertanyaan fallback", error=str(exc))

    if not cases:
        cases = [
            {"id": i + 1, "category": "fallback", "question": q, "target_fmea_id": None}
            for i, q in enumerate(FALLBACK_QUESTIONS)
        ]

    if limit is not None and limit > 0:
        cases = cases[:limit]
    return cases


# --- Locust-style ramp simulation (tanpa dependensi locust) -------------------
def locust_simulation(users: int, spawn_rate: int, run_time: float) -> Dict[str, Any]:
    """Simulasi beban bergaya Locust: user bertambah `spawn_rate` per detik.

    Berguna untuk melihat titik di mana latency mulai naik / error muncul.
    """
    log("INFO", "mulai simulasi ramp load", users=users, spawn_rate=spawn_rate, run_time_s=run_time)

    from main import clear_session_history, generate_maintenance_response

    questions = [c["question"] for c in load_questions()]
    results: List[Dict[str, Any]] = []
    results_lock = threading.Lock()
    stop_at = time.time() + run_time
    active = 0
    active_lock = threading.Lock()

    def worker(user_index: int) -> None:
        nonlocal active
        session_id = f"locust-{user_index}"
        while time.time() < stop_at:
            question = random.choice(questions)
            request_id = monitoring.new_request_id()
            started = time.perf_counter()
            with active_lock:
                active += 1
            try:
                answer = generate_maintenance_response(session_id, question)
                ok = bool(answer)
            except Exception as exc:  # noqa: BLE001
                ok, answer = False, str(exc)
            finally:
                with active_lock:
                    active -= 1
            latency = (time.perf_counter() - started) * 1000.0
            with results_lock:
                results.append({"success": ok, "latency_ms": latency, "request_id": request_id})
                METRICS.record_request(
                    success=ok, latency_ms=latency, source="locust", session_id=session_id,
                    request_id=request_id, error=None if ok else answer,
                )
        try:
            clear_session_history(session_id)
        except Exception:  # noqa: BLE001
            pass

    # Spawn bertahap sesuai spawn_rate
    threads: List[threading.Thread] = []
    for index in range(users):
        thread = threading.Thread(target=worker, args=(index,), daemon=True)
        thread.start()
        threads.append(thread)
        if spawn_rate and index % spawn_rate == spawn_rate - 1:
            time.sleep(1)

    for thread in threads:
        thread.join(timeout=max(5.0, run_time))

    latencies = sorted(r["latency_ms"] for r in results if r["success"])
    snapshot = METRICS.snapshot(source="locust")
    snapshot["peak_active_users"] = active
    snapshot["percentiles"] = {
        "p50": monitoring.MetricsCollector._percentile(latencies, 0.50),
        "p95": monitoring.MetricsCollector._percentile(latencies, 0.95),
        "p99": monitoring.MetricsCollector._percentile(latencies, 0.99),
    }
    snapshot["total_samples"] = len(results)
    return snapshot


# --- Runner utama -------------------------------------------------------------
def run_stress_test(
    concurrency: int,
    total_requests: int,
    *,
    source: str = "stress_test",
    session_prefix: str = "stress",
    dataset_path: Optional[Path] = None,
    categories: Optional[List[str]] = None,
    limit: Optional[int] = None,
    reset_sessions: bool = True,
    check_dependencies: bool = True,
) -> Dict[str, Any]:
    """Jalankan `total_requests` request dengan `concurrency` worker paralel."""
    if concurrency < 1:
        raise ValueError("concurrency minimal 1")
    if total_requests < 1:
        raise ValueError("total_requests minimal 1")

    log("INFO", "mulai stress test", concurrency=concurrency, total_requests=total_requests, source=source)

    # Import lazy: main.py melakukan inisialisasi GCP & baca .env saat import.
    from main import clear_session_history, generate_maintenance_response

    if check_dependencies:
        try:
            _dependency_report()
        except Exception as exc:  # noqa: BLE001
            log("WARNING", "gagal cek dependensi", error=str(exc))

    cases = load_questions(dataset_path, categories, limit)
    if not cases:
        raise RuntimeError("Tidak ada pertanyaan untuk diuji.")

    results: List[Dict[str, Any]] = []
    results_lock = threading.Lock()
    counters = {"done": 0}
    run_id = uuid.uuid4().hex[:8]
    bench_started = time.perf_counter()

    def one_request(index: int) -> Dict[str, Any]:
        case = cases[index % len(cases)]
        session_id = f"{session_prefix}-{run_id}-{index % max(1, concurrency)}"
        request_id = monitoring.new_request_id()
        question = case["question"]

        if reset_sessions:
            try:
                clear_session_history(session_id)
            except Exception:  # noqa: BLE001
                pass

        started = time.perf_counter()
        error: Optional[str] = None
        answer = ""
        prompt_tokens = completion_tokens = None
        try:
            answer = generate_maintenance_response(session_id, question)
            if not answer:
                raise RuntimeError("respons kosong")
        except Exception as exc:  # noqa: BLE001
            error = f"{type(exc).__name__}: {exc}"
        latency_ms = (time.perf_counter() - started) * 1000.0
        success = error is None

        METRICS.record_request(
            success=success,
            latency_ms=latency_ms,
            source=source,
            session_id=session_id,
            request_id=request_id,
            prompt_tokens=prompt_tokens,
            completion_tokens=completion_tokens,
            context_chars=len(answer),
            error=error,
        )

        with results_lock:
            counters["done"] += 1
            done = counters["done"]
            record = {
                "run_id": run_id,
                "index": index,
                "case_id": case.get("id"),
                "category": case.get("category"),
                "session_id": session_id,
                "request_id": request_id,
                "question": question,
                "success": success,
                "latency_ms": round(latency_ms, 2),
                "answer_chars": len(answer),
                "answer_preview": answer[:160].replace("\n", " "),
                "error": error,
                "timestamp": datetime.now(timezone.utc).isoformat(),
            }
            results.append(record)
        log(
            "INFO" if success else "ERROR",
            f"[{done}/{total_requests}] request selesai",
            request_id=request_id,
            case_id=case.get("id"),
            latency_ms=round(latency_ms, 2),
            ok=success,
            error=error,
        )
        return record

    wall_started = time.perf_counter()
    with futures.ThreadPoolExecutor(max_workers=concurrency, thread_name_prefix="stress") as pool:
        list(pool.map(one_request, range(total_requests)))
    wall_seconds = time.perf_counter() - wall_started
    bench_latency = (time.perf_counter() - bench_started) * 1000.0

    # Bersihkan sesi stress dari Firestore agar tidak menumpuk
    if reset_sessions:
        for i in range(max(1, concurrency)):
            try:
                clear_session_history(f"{session_prefix}-{run_id}-{i}")
            except Exception:  # noqa: BLE001
                pass

    summary = _summarize(results, wall_seconds, concurrency, total_requests, bench_latency, source)
    summary["run_id"] = run_id
    summary["concurrency"] = concurrency

    _print_summary(summary)
    monitoring.log_metrics_summary(source=source)
    return summary


def _dependency_report() -> Dict[str, Any]:
    """Cek cepat konektivitas & konfigurasi sebelum load test (fail-fast)."""
    import main

    report: Dict[str, Any] = {"nim_model": main.NVIDIA_NIM_MODEL, "data_stores": main.DATA_STORE_IDS}
    if not main.DATA_STORE_IDS:
        raise RuntimeError("DATA_STORE_ID kosong di .env")
    try:
        from monitoring import health_snapshot
        health = health_snapshot(main.db, force=True)
        report["firestore"] = health["checks"]["firestore"]["status"]
        if health["status"] == "degraded":
            log("WARNING", "Firestore tidak sehat saat pre-check", detail=health["checks"]["firestore"])
    except Exception as exc:  # noqa: BLE001
        report["firestore"] = f"error: {exc}"
    log("INFO", "pre-check dependensi selesai", **report)
    return report


def _summarize(
    results: List[Dict[str, Any]],
    wall_seconds: float,
    concurrency: int,
    total_requests: int,
    bench_latency_ms: float,
    source: str,
) -> Dict[str, Any]:
    ok_rows = [r for r in results if r["success"]]
    fail_rows = [r for r in results if not r["success"]]
    latencies = sorted(r["latency_ms"] for r in ok_rows)
    percentiles = {
        "p50": round(monitoring.MetricsCollector._percentile(latencies, 0.50), 2),
        "p90": round(monitoring.MetricsCollector._percentile(latencies, 0.90), 2),
        "p95": round(monitoring.MetricsCollector._percentile(latencies, 0.95), 2),
        "p99": round(monitoring.MetricsCollector._percentile(latencies, 0.99), 2),
    }
    by_category: Dict[str, Dict[str, Any]] = {}
    for row in results:
        cat = row.get("category") or "unknown"
        bucket = by_category.setdefault(cat, {"count": 0, "failures": 0, "latency": []})
        bucket["count"] += 1
        if not row["success"]:
            bucket["failures"] += 1
        else:
            bucket["latency"].append(row["latency_ms"])

    for bucket in by_category.values():
        values = sorted(bucket.pop("latency"))
        bucket["avg_latency_ms"] = round(statistics.fmean(values), 2) if values else 0.0
        bucket["pass_rate_pct"] = round(
            (bucket["count"] - bucket["failures"]) / bucket["count"] * 100, 1
        )

    return {
        "source": source,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "config": {
            "concurrency": concurrency,
            "total_requests": total_requests,
            "cache": "n/a",
        },
        "total_requests": len(results),
        "success": len(ok_rows),
        "failures": len(fail_rows),
        "error_rate_pct": round(len(fail_rows) / len(results) * 100, 2) if results else 0.0,
        "wall_clock_seconds": round(wall_seconds, 2),
        "throughput_rps": round(len(results) / wall_seconds, 3) if wall_seconds > 0 else 0.0,
        "total_bench_latency_ms": round(bench_latency_ms, 2),
        "latency_ms": {
            "min": round(latencies[0], 2) if latencies else 0.0,
            "max": round(latencies[-1], 2) if latencies else 0.0,
            "mean": round(statistics.fmean(latencies), 2) if latencies else 0.0,
            "stddev": round(statistics.pstdev(latencies), 2) if len(latencies) > 1 else 0.0,
            **percentiles,
        },
        "by_category": by_category,
        "errors": sorted({r["error"] for r in fail_rows if r["error"]}),
    }


def _print_summary(summary: Dict[str, Any]) -> None:
    lat = summary["latency_ms"]
    log(
        "INFO",
        "stress test selesai",
        total=summary["total_requests"],
        success=summary["success"],
        failures=summary["failures"],
        error_rate_pct=summary["error_rate_pct"],
        throughput_rps=summary["throughput_rps"],
        wall_s=summary["wall_clock_seconds"],
        p50_ms=lat["p50"],
        p95_ms=lat["p95"],
        p99_ms=lat["p99"],
        max_ms=lat["max"],
    )


def save_outputs(summary: Dict[str, Any], results: List[Dict[str, Any]], output_dir: Path, tag: str) -> Dict[str, str]:
    """Simpan hasil ke CSV detail + JSON ringkasan (mengikuti pola eval_rag.py)."""
    output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    csv_path = output_dir / f"stress_results_{tag}.csv"
    json_path = output_dir / f"stress_summary_{tag}.json"

    fieldnames = [
        "run_id", "index", "case_id", "category", "session_id", "request_id",
        "question", "success", "latency_ms", "answer_chars", "answer_preview", "error", "timestamp",
    ]
    if results:
        with csv_path.open("w", encoding="utf-8", newline="") as handle:
            writer = csv.DictWriter(handle, fieldnames=fieldnames)
            writer.writeheader()
            for row in results:
                writer.writerow({key: row.get(key, "") for key in fieldnames})

    with json_path.open("w", encoding="utf-8") as handle:
        json.dump(summary, handle, ensure_ascii=False, indent=2)

    return {"csv": str(csv_path), "json": str(json_path)}


def save_csv_from_results(results: List[Dict[str, Any]], output_dir: Path, tag: str) -> str:
    """Helper: hanya tulis CSV detail (dipakai bila ingin menyimpan per-request)."""
    output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    csv_path = output_dir / f"stress_results_{tag}.csv"
    if not results:
        return str(csv_path)
    with csv_path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=list(results[0].keys()))
        writer.writeheader()
        writer.writerows(results)
    return str(csv_path)


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Stress / load test pipeline RAG FMEA (konkuren, ukur latency & error rate)."
    )
    parser.add_argument("--concurrency", "-c", type=int, default=4, help="jumlah worker paralel (default 4)")
    parser.add_argument("--requests", "-n", type=int, default=12, help="total request yang dijalankan (default 12)")
    parser.add_argument("--dataset", type=str, default=str(DEFAULT_DATASET), help="path test_dataset.json")
    parser.add_argument("--categories", type=str, default=None, help="filter kategori, mis. direct_master,greeting")
    parser.add_argument("--limit", type=int, default=None, help="batasi jumlah kasus dataset yang dipakai")
    parser.add_argument("--source", type=str, default="stress_test", help="label sumber metrik")
    parser.add_argument("--output-dir", type=str, default=str(DEFAULT_OUTPUT_DIR), help="folder output CSV/JSON")
    parser.add_argument("--tag", type=str, default=None, help="label file output (default: timestamp)")
    parser.add_argument("--timeout", type=float, default=None, help="batas waktu total (detik) - opsional")
    parser.add_argument("--locust", action="store_true", help="mode ramp simulation (bertahap naik)")
    parser.add_argument("--users", type=int, default=8, help="mode locust: jumlah user (default 8)")
    parser.add_argument("--spawn-rate", type=int, default=2, help="mode locust: user baru per detik (default 2)")
    parser.add_argument("--run-time", type=float, default=30.0, help="mode locust: durasi (detik, default 30)")
    parser.add_argument("--no-reset", action="store_true", help="jangan reset sesi stress di Firestore")
    parser.add_argument("--skip-precheck", action="store_true", help="lewati pre-check Firestore")
    return parser


def main(argv: Optional[List[str]] = None) -> int:
    args = build_parser().parse_args(argv)
    setup_logging()
    tag = args.tag or datetime.now().strftime("%Y%m%d_%H%M%S")
    output_dir = Path(args.output_dir)

    try:
        if args.locust:
            summary = locust_simulation(args.users, args.spawn_rate, args.run_time)
            results: List[Dict[str, Any]] = []
            json_path = output_dir / f"stress_summary_{tag}.json"
            output_dir.mkdir(parents=True, exist_ok=True)
            json_path.write_text(json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8")
            log("INFO", "hasil locust disimpan", json=str(json_path))
            return 0

        categories = [c.strip() for c in args.categories.split(",")] if args.categories else None
        results = []
        summary = run_stress_test(
            concurrency=args.concurrency,
            total_requests=args.requests,
            source=args.source,
            dataset_path=Path(args.dataset),
            categories=categories,
            limit=args.limit,
            reset_sessions=not args.no_reset,
            check_dependencies=not args.skip_precheck,
        )
        # Ambil detail per-request dari ring buffer metrik untuk CSV.
        window = METRICS.snapshot(source=args.source)
        paths = save_outputs(summary, results, output_dir, tag)
        log("INFO", "hasil stress test disimpan", **paths, window_requests=window["requests_in_window"])
        return 0
    except KeyboardInterrupt:  # pragma: no cover
        log("WARNING", "stress test dibatalkan oleh pengguna")
        return 130
    except Exception as exc:  # noqa: BLE001
        log("ERROR", "stress test gagal", error=f"{type(exc).__name__}: {exc}")
        return 1


if __name__ == "__main__":
    raise SystemExit(main())

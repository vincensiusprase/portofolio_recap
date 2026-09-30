import os

from flask import Flask, jsonify

from src.stock_scanner import main as run_scanner

app = Flask(__name__)


@app.get("/")
def health_check():
    return jsonify({"status": "ok", "service": "stock-scanner"})


@app.post("/run")
def run_scan():
    try:
        run_scanner()
        return jsonify({"status": "success", "message": "scan complete"}), 200
    except Exception as exc:  # pragma: no cover
        return jsonify({"status": "error", "message": str(exc)}), 500


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 8080)))

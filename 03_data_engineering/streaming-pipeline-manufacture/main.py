import json
import time
import random
from datetime import datetime, timezone
from google.cloud import pubsub_v1

# Konfigurasi GCP
PROJECT_ID = "project-1-474502"
TOPIC_ID = "fmcg-telemetry-stream"

publisher = pubsub_v1.PublisherClient()
topic_path = publisher.topic_path(PROJECT_ID, TOPIC_ID)

LINES = ["LINE_01", "LINE_02", "LINE_03"]
MACHINES = [
    {"id": "FIL-01", "type": "Filler", "ideal_speed": 100},  # 100 botol/menit
    {"id": "CAP-01", "type": "Capper", "ideal_speed": 100},
    {"id": "LBL-01", "type": "Labeler", "ideal_speed": 100}
]

def generate_sensor_data():
    line = random.choice(LINES)
    machine = random.choice(MACHINES)
    
    # Simulasi Status Mesin: 85% Running, 10% Micro-stoppage, 5% Breakdown
    status_weights = ["RUNNING", "MICRO_STOP", "BREAKDOWN"]
    status = random.choices(status_weights, weights=[85, 10, 5])[0]
    
    if status == "RUNNING":
        units_produced = random.randint(15, 20)
        defects = random.choices([0, 1, 2], weights=[95, 4, 1])[0]
        temperature = round(random.uniform(65.0, 75.0), 2)  # Suhu normal
        vibration = round(random.uniform(0.5, 2.0), 2)
    elif status == "MICRO_STOP":
        units_produced = random.randint(1, 5)
        defects = random.randint(0, 1)
        temperature = round(random.uniform(75.1, 85.0), 2)  # Sedikit memanas
        vibration = round(random.uniform(2.1, 4.0), 2)
    else:  # BREAKDOWN
        units_produced = 0
        defects = 0
        temperature = round(random.uniform(85.1, 95.0), 2)  # Overheat
        vibration = round(random.uniform(4.1, 8.0), 2)       # Anomali getaran tinggi

    payload = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "line_id": line,
        "machine_id": machine["id"],
        "machine_type": machine["type"],
        "status": status,
        "units_produced": units_produced,
        "defects": defects,
        "temperature_celsius": temperature,
        "vibration_rms": vibration
    }
    return payload

def main():
    print(f"Mulai mengirimkan streaming data ke {topic_path}...")
    try:
        while True:
            data = generate_sensor_data()
            data_str = json.dumps(data)
            
            # Publish ke Pub/Sub
            future = publisher.publish(topic_path, data_str.encode("utf-8"))
            print(f"[SENT] {data['timestamp']} | {data['line_id']} | {data['machine_id']} | Status: {data['status']}")
            
            # Interval pengiriman per detik
            time.sleep(1)
    except KeyboardInterrupt:
        print("\nStreaming dihentikan oleh user.")

if __name__ == "__main__":
    main()
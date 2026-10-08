# IDX Stock Scanner

Batch scanner saham IDX. Data harga diambil dari Yahoo Finance, dianalisis dengan indikator OTT, WaveTrend, SMC, ATR, dan trendline, lalu hasilnya ditambahkan ke BigQuery.

## Jalankan lokal

```powershell
py -3 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
Copy-Item .env.example .env
```

Isi `.env` dengan `GCP_PROJECT_ID`, `BQ_DATASET_ID`, dan `BQ_TABLE_NAME`. Autentikasi lokal dapat memakai ADC melalui `gcloud auth application-default login` atau `GCP_SA_KEY`.

Contoh scan lima ticker dari satu sektor tanpa upload:

```powershell
python main.py --sector IDXENERGY --limit 5 --dry-run
```

Scan satu sektor dan upload ke BigQuery:

```powershell
python main.py --sector IDXENERGY --limit 5
```

Hilangkan `--limit` untuk memindai semua ticker di sektor itu. Gunakan `--sector ALL` untuk seluruh sektor. Upload adalah perilaku default; `--dry-run` mencegah upload. Tambahkan `--only-buy` untuk hanya menampilkan/mengunggah kandidat `BUY` dan `SNIPER BUY`.

## Migrasi skema BigQuery

Bila `BQ_SCHEMA` di `src/stock_scanner.py` berubah dan tabel BigQuery sudah terlanjur dibuat, jalankan migrasi untuk menyelaraskan kolom tanpa menghapus data:

```powershell
python -m scripts.migrate_bq_schema --dry-run   # tampilkan DDL saja
python -m scripts.migrate_bq_schema             # eksekusi migrasi
python -m scripts.migrate_bq_schema --skip-drop # hanya tambah kolom baru
```

Skrip menambahkan kolom baru (`IF NOT EXISTS`) dan menghapus kolom lama (`IF EXISTS`), serta melaporkan kolom yang sudah sesuai.

## GitHub Actions

Workflow `.github/workflows/stock-scan.yml` dapat dijalankan manual dari tab **Actions** atau otomatis setiap hari kerja pukul 17:00 WIB. Run manual secara default memakai dry-run; jadwal otomatis melakukan upload.

Atur repository variables berikut di **Settings > Secrets and variables > Actions > Variables**:

- `GCP_PROJECT_ID`
- `BQ_DATASET_ID`
- `BQ_TABLE_NAME`

Tambahkan repository secret `GCP_SA_KEY` berisi JSON service account. Service account perlu izin BigQuery Job User dan BigQuery Data Editor. Jangan commit `.env` atau file kredensial.

Saat menjalankan workflow manual, pilih sektor, batas ticker per sektor, dan apakah upload BigQuery dilewati.

## BigQuery

Data memakai `WRITE_APPEND` dan scanner memeriksa duplikasi berdasarkan `scan_date` dan `ticker` sebelum load. Kolom tabel ditetapkan oleh schema di `src/stock_scanner.py`.
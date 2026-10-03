# Inventory Management - Super Glass (SG)

Aplikasi web inventory kaca & pallet berbasis Google Apps Script + Google Sheets.

## Fitur Utama
- **Dashboard Kaca & Pallet** — ringkasan stok, grafik, filter tanggal
- **Inventory History** — riwayat inbound/outbound dengan filter
- **Lot Management** — tracking lot number, expired, stok per lot
- **Tracking Pallet** — status pallet (Ada/Kosong), history in/out
- **Kontrol SJ** — pencocokan Surat Jalan Supplier vs KIK
- **Hasil Stock Opname** — perbandingan sistem vs fisik
- **Form In/Out** — input transaksi dengan validasi stok

## Teknologi
- **Backend**: Google Apps Script (V8 runtime)
- **Database**: Google Sheets (12 sheet terstruktur)
- **Frontend**: HTML5 + Bootstrap 5.3 + jQuery + DataTables + Chart.js
- **Auth**: Session-based (CacheService), role-based access

## Struktur Sheet (SCHEMA)
| Sheet | Deskripsi |
|-------|-----------|
| Users | Login & role |
| Masterdata | Data master SKU kaca |
| In-Out Kaca | Transaksi kaca inbound/outbound |
| In-Out Pallet | Transaksi pallet inbound/outbound |
| In-Out Pallet All | Arsip lengkap pallet |
| Expired Product | Tracking lot & expired |
| Tracking Nomer Pallet | Status pallet real-time |
| Summary Kaca | Ringkasan stok per SKU |
| Summary Pallet | Ringkasan stok per tipe pallet |
| Kontrol SJ Kaca | Pencocokan SJ Supplier-KIK |
| Kontrol SJ Pallet | Pencocokan SJ Pallet |
| Hasil SO | Hasil stock opname |

## Setup & Deploy

### Prasyarat
- Google Account
- `clasp` CLI: `npm i -g @google/clasp`
- Project Google Cloud dengan Apps Script API aktif

### Clone & Login
```bash
git clone <repo-url>
cd IM-ISG
clasp login
clasp clone <SCRIPT_ID>  # atau clasp create --type webapp
```

### Konfigurasi
1. Buka `Code.js` → sesuaikan `CONFIG`:
   - `SPREADSHEET_ID` — ID Google Spreadsheet
   - `LOGO_FILE_ID` — File ID logo di Google Drive (sharing: Anyone with link → Viewer)
2. Jalankan `setupDatabase()` sekali di Apps Script editor untuk membuat header sheet.

### Deploy
```bash
clasp push
clasp deploy --versionNumber 1 --description "Release v1"
```

### Akses Web App
URL format: `https://script.google.com/macros/s/<DEPLOYMENT_ID>/exec`

## Data Dummy (Testing)
```javascript
// Di Apps Script editor:
seedDummyData(true)  // hapus lama + isi dummy
seedDummyData(false) // append ke baris kosong
```
Login default: `admin` / `admin123`

## Role & Akses
| Role | Akses |
|------|-------|
| Admin | Semua fitur + manajemen user |
| Management | Dashboard, Laporan, Kontrol SJ, Hasil SO |
| Warehouse | Form In/Out, Inventory, Tracking, Lot |
| Finance | Dashboard, Kontrol SJ, Hasil SO |
| PPIC | Dashboard, Inventory, Lot, Hasil SO |

## Branding
- **Nama Perusahaan**: Super Glass
- **Singkatan**: SG
- **App Name**: Inventory Management - SG
- **Warna**: Navy (`#1B2A4A`), Accent (`#D4A843`)

## File Penting
- `Code.js` — Backend logic, schema, API
- `Index.html` — Frontend (login, sidebar, semua halaman)
- `appsscript.json` — Manifest Apps Script
- `SeedDummy.js` — Generator data dummy (di-ignore clasp)
- `.claspignore` — File yang tidak di-push ke Apps Script

## Lisensi
Internal — PT Super Glass Indonesia
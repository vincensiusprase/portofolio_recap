/**
 * =============================================================================
 * SeedDummy.js — DATA DUMMY Super Glass (Inventory Management - SG)
 * =============================================================================
 * Cara pakai:
 *  1. clasp push
 *  2. Di Apps Script editor: pilih fungsi seedDummyData > Run
 *  3. Atau dari editor: seedDummyData(true) = hapus isi lama + tulis dummy.
 *     seedDummyData(false) = hanya tulis ke baris kosong (append).
 *
 * Catatan:
 *  - Menulis sesuai urutan kolom SCHEMA di Code.js (jangan ubah urutan).
 *  - Lot Number di In-Out Kaca (outbound) selalu ada di Expired Product
 *    agar validasi stok lot lolos.
 *  - Kombinasi Pallet/Merk/Nomor outbound selalu ada di Tracking Nomer
 *    Pallet dengan Status "Ada" agar validasi pallet lolos.
 *  - Satu baris FROSTED dibuat Current 0 untuk demo "List Stock Out".
 * =============================================================================
 */

function seedDummyData(clearFirst) {
  if (clearFirst !== false) clearFirst = true;
  setupDatabase();

  seedUsers_();
  seedMasterdata_(clearFirst);
  seedInOutKaca_(clearFirst);
  seedExpired_(clearFirst);
  seedInOutPallet_(clearFirst);
  seedTracking_(clearFirst);
  seedSummary_(clearFirst);
  seedKontrol_(clearFirst);
  seedHasilSO_(clearFirst);

  var msg = 'Seed dummy selesai. Login: admin / admin123';
  if (typeof Logger !== 'undefined') Logger.log(msg);
  return msg;
}

/* ================= HELPER TULIS ================= */

function seedClear_(name) {
  var sheet = getSheet_(name);
  var lastRow = sheet.getLastRow();
  if (lastRow > 1) sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).clearContent();
}

function seedWrite_(name, rows, clearFirst) {
  if (!rows || !rows.length) return;
  var sheet = getSheet_(name);
  if (clearFirst) seedClear_(name);
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(String);
  // Susun ulang baris mengikuti urutan header aktual (tahan terhadap kolom legacy ISG).
  var colIndex = headers.map(function (h) { return SCHEMA[name].indexOf(h); });
  var ordered = rows.map(function (r) {
    return colIndex.map(function (si, ci) { return si === -1 ? '' : r[si]; });
  });
  var startRow = clearFirst ? 2 : Math.max(sheet.getLastRow() + 1, 2);
  sheet.getRange(startRow, 1, ordered.length, headers.length).setValues(ordered);
  // Nomor Pallet selalu teks (jaga "0040").
  var np = headers.indexOf('Nomor Pallet') + 1;
  if (np >= 1) sheet.getRange(startRow, np, ordered.length, 1).setNumberFormat('@');
}

function D(y, m, d) { return new Date(y, m - 1, d); }

/* ================= USERS ================= */

function seedUsers_() {
  var sheet = getSheet_('Users');
  seedClear_('Users');
  sheet.getRange(2, 1, 5, 3).setValues([
    ['admin', 'admin123', 'Admin'],
    ['management', 'mgmt123', 'Management'],
    ['gudang', 'gudang123', 'Warehouse'],
    ['finance', 'finance123', 'Finance'],
    ['ppic', 'ppic123', 'PPIC']
  ]);
}

/* ================= MASTERDATA (22 kolom) ================= */

function seedMasterdata_(clearFirst) {
  var R = function (sku, item, kat, ss, abc, jenis, tebal, ukuran, kual, merk, sup, cust, lot, pallet, skuPallet) {
    return [sku, item, kat, ss, abc, jenis, tebal, ukuran, kual, merk,
      kual + ' - ' + sup, 12, 6, 3, sup, cust, lot, pallet,
      'PLT-IN', 'Surat Jalan', skuPallet, 'Surat Jalan'];
  };
  seedWrite_('Masterdata', [
    R('CLEAR 5x1830x2440', 'Kaca Clear 5mm 1830x2440', 'Clear', 60, 'A', 'Clear', '5', '1830x2440', 'A', 'MULIA', 'PT Kaca Mulia', 'PT Windo Abadi', 'LOT-2026-001', 'P3', 'P3/MULIA/0040'),
    R('CLEAR 8x1830x2440', 'Kaca Clear 8mm 1830x2440', 'Clear', 40, 'A', 'Clear', '8', '1830x2440', 'A', 'MULIA', 'PT Kaca Mulia', 'PT Windo Abadi', 'LOT-2026-002', 'P3', 'P3/MULIA/0041'),
    R('BRONZE 5x1830x2440', 'Kaca Bronze 5mm 1830x2440', 'Bronze', 30, 'B', 'Bronze', '5', '1830x2440', 'A', 'ASAHIMAS', 'PT Asahimas', 'PT Kusuma Glass', 'LOT-2026-003', 'P5', 'P5/ASAHIMAS/0101'),
    R('GREEN 5x1830x2440', 'Kaca Green 5mm 1830x2440', 'Green', 30, 'B', 'Green', '5', '1830x2440', 'A', 'ASAHIMAS', 'PT Asahimas', 'PT Kusuma Glass', 'LOT-2026-004', 'P5', 'P5/ASAHIMAS/0102'),
    R('REFLECTIVE BLUE 6x1830x2440', 'Kaca Reflective Blue 6mm', 'Reflective', 20, 'C', 'Reflective', '6', '1830x2440', 'A', 'MULIA', 'PT Kaca Mulia', 'PT Cahaya Glass', 'LOT-2026-005', 'P7', 'P7/MULIA/0201'),
    R('CLEAR 5x1830x2440 (BS)', 'Kaca Clear 5mm (BS)', 'Clear', 10, 'C', 'Clear', '5', '1830x2440', 'BS', 'MULIA', 'PT Kaca Mulia', 'PT Windo Abadi', 'LOT-2026-006', 'P3', 'P3/MULIA/0042'),
    R('FROSTED 8x1220x2440', 'Kaca Frosted 8mm 1220x2440', 'Frosted', 15, 'C', 'Frosted', '8', '1220x2440', 'A', 'SAINT GOBAIN', 'PT Saint Gobain', 'PT Cahaya Glass', 'LOT-2026-007', 'P7', 'P7/SGOBAIN/0202'),
    R('CLEAR 12x1830x2440', 'Kaca Clear 12mm 1830x2440', 'Clear', 25, 'B', 'Clear', '12', '1830x2440', 'A', 'MULIA', 'PT Kaca Mulia', 'PT Windo Abadi', 'LOT-2026-008', 'P3', 'P3/MULIA/0043')
  ], clearFirst);
}

/* ================= IN-OUT KACA (17 kolom) =================
 * Inbound Date, Date, Status, Jenis, Tebal, Kualitas, SKU#, SKU,
 * Item Name, Qty In, Qty Out, Customer, Supplier, Merk Kaca,
 * No Dokumen, Lot Number, Dokumen */

function seedInOutKaca_(clearFirst) {
  var IN = function (ib, doc, sku, item, qty, sup, merk, nodok, lot, jenis, tebal, kual) {
    return [D.apply(null, ib), D.apply(null, doc), 'Inbound', jenis, tebal, kual, sku, sku,
      item, qty, '', '', sup, merk, nodok, lot, 'Surat Jalan'];
  };
  var OUT = function (doc, sku, item, qty, cust, sup, merk, nodok, lot, jenis, tebal, kual) {
    return ['', D.apply(null, doc), 'Outbound', jenis, tebal, kual, sku, sku,
      item, '', qty, cust, sup, merk, nodok, lot, 'Surat Jalan'];
  };
  seedWrite_('In-Out Kaca', [
    IN([2025, 6, 10], [2025, 6, 11], 'CLEAR 5x1830x2440', 'Kaca Clear 5mm 1830x2440', 100, 'PT Kaca Mulia', 'MULIA', 'SJ-2026-001', 'LOT-2026-001', 'Clear', '5', 'A'),
    IN([2025, 12, 15], [2025, 12, 16], 'CLEAR 8x1830x2440', 'Kaca Clear 8mm 1830x2440', 80, 'PT Kaca Mulia', 'MULIA', 'SJ-2026-002', 'LOT-2026-002', 'Clear', '8', 'A'),
    IN([2026, 2, 3], [2026, 2, 4], 'BRONZE 5x1830x2440', 'Kaca Bronze 5mm 1830x2440', 60, 'PT Asahimas', 'ASAHIMAS', 'SJ-2026-003', 'LOT-2026-003', 'Bronze', '5', 'A'),
    OUT([2026, 2, 10], 'CLEAR 5x1830x2440', 'Kaca Clear 5mm 1830x2440', 30, 'PT Windo Abadi', 'PT Kaca Mulia', 'MULIA', 'SJ-2026-004', 'LOT-2026-001', 'Clear', '5', 'A'),
    IN([2026, 2, 18], [2026, 2, 19], 'GREEN 5x1830x2440', 'Kaca Green 5mm 1830x2440', 70, 'PT Asahimas', 'ASAHIMAS', 'SJ-2026-005', 'LOT-2026-004', 'Green', '5', 'A'),
    OUT([2026, 3, 2], 'CLEAR 8x1830x2440', 'Kaca Clear 8mm 1830x2440', 20, 'PT Windo Abadi', 'PT Kaca Mulia', 'MULIA', 'SJ-2026-006', 'LOT-2026-002', 'Clear', '8', 'A'),
    IN([2026, 3, 10], [2026, 3, 11], 'REFLECTIVE BLUE 6x1830x2440', 'Kaca Reflective Blue 6mm', 40, 'PT Kaca Mulia', 'MULIA', 'SJ-2026-007', 'LOT-2026-005', 'Reflective', '6', 'A'),
    OUT([2026, 3, 15], 'BRONZE 5x1830x2440', 'Kaca Bronze 5mm 1830x2440', 10, 'PT Kusuma Glass', 'PT Asahimas', 'ASAHIMAS', 'SJ-2026-008', 'LOT-2026-003', 'Bronze', '5', 'A'),
    IN([2026, 4, 1], [2026, 4, 2], 'CLEAR 5x1830x2440 (BS)', 'Kaca Clear 5mm (BS)', 25, 'PT Kaca Mulia', 'MULIA', 'SJ-2026-009', 'LOT-2026-006', 'Clear', '5', 'BS'),
    OUT([2026, 4, 8], 'GREEN 5x1830x2440', 'Kaca Green 5mm 1830x2440', 15, 'PT Kusuma Glass', 'PT Asahimas', 'ASAHIMAS', 'SJ-2026-010', 'LOT-2026-004', 'Green', '5', 'A'),
    IN([2026, 5, 5], [2026, 5, 6], 'FROSTED 8x1220x2440', 'Kaca Frosted 8mm 1220x2440', 30, 'PT Saint Gobain', 'SAINT GOBAIN', 'SJ-2026-011', 'LOT-2026-007', 'Frosted', '8', 'A'),
    IN([2026, 6, 1], [2026, 6, 2], 'CLEAR 12x1830x2440', 'Kaca Clear 12mm 1830x2440', 50, 'PT Kaca Mulia', 'MULIA', 'SJ-2026-012', 'LOT-2026-008', 'Clear', '12', 'A'),
    OUT([2026, 7, 10], 'CLEAR 5x1830x2440', 'Kaca Clear 5mm 1830x2440', 20, 'PT Cahaya Glass', 'PT Kaca Mulia', 'MULIA', 'SJ-2026-013', 'LOT-2026-001', 'Clear', '5', 'A'),
    OUT([2026, 8, 20], 'REFLECTIVE BLUE 6x1830x2440', 'Kaca Reflective Blue 6mm', 5, 'PT Cahaya Glass', 'PT Kaca Mulia', 'MULIA', 'SJ-2026-014', 'LOT-2026-005', 'Reflective', '6', 'A'),
    OUT([2026, 8, 25], 'FROSTED 8x1220x2440', 'Kaca Frosted 8mm 1220x2440', 30, 'PT Cahaya Glass', 'PT Saint Gobain', 'SAINT GOBAIN', 'SJ-2026-015', 'LOT-2026-007', 'Frosted', '8', 'A')
  ], clearFirst);
}

/* ================= EXPIRED PRODUCT (13 kolom) ================= */

function seedExpired_(clearFirst) {
  var R = function (ib, jenis, kual, sku, sup, merk, lot, umur, expQty, qty, code, status, days) {
    return [D.apply(null, ib), jenis, kual, sku, sup, merk, lot, umur, expQty, qty, code, status, days];
  };
  seedWrite_('Expired Product', [
    R([2025, 6, 10], 'Clear', 'A', 'CLEAR 5x1830x2440', 'PT Kaca Mulia', 'MULIA', 'LOT-2026-001', 15, 8, 100, 'EXP-001', 'Merah', 450),
    R([2025, 12, 15], 'Clear', 'A', 'CLEAR 8x1830x2440', 'PT Kaca Mulia', 'MULIA', 'LOT-2026-002', 9, 5, 80, 'EXP-002', 'Kuning', 270),
    R([2026, 2, 3], 'Bronze', 'A', 'BRONZE 5x1830x2440', 'PT Asahimas', 'ASAHIMAS', 'LOT-2026-003', 7, 0, 60, 'EXP-003', 'Kuning', 210),
    R([2026, 2, 18], 'Green', 'A', 'GREEN 5x1830x2440', 'PT Asahimas', 'ASAHIMAS', 'LOT-2026-004', 7, 0, 70, 'EXP-004', 'Kuning', 195),
    R([2026, 3, 10], 'Reflective', 'A', 'REFLECTIVE BLUE 6x1830x2440', 'PT Kaca Mulia', 'MULIA', 'LOT-2026-005', 6, 0, 40, 'EXP-005', 'Kuning', 170),
    R([2026, 4, 1], 'Clear', 'BS', 'CLEAR 5x1830x2440 (BS)', 'PT Kaca Mulia', 'MULIA', 'LOT-2026-006', 5, 0, 25, 'EXP-006', 'Hijau', 150),
    R([2026, 5, 5], 'Frosted', 'A', 'FROSTED 8x1220x2440', 'PT Saint Gobain', 'SAINT GOBAIN', 'LOT-2026-007', 4, 0, 30, 'EXP-007', 'Hijau', 120),
    R([2026, 6, 1], 'Clear', 'A', 'CLEAR 12x1830x2440', 'PT Kaca Mulia', 'MULIA', 'LOT-2026-008', 3, 0, 50, 'EXP-008', 'Hijau', 90)
  ], clearFirst);
}

/* ================= IN-OUT PALLET (15 kolom) ================= */

function seedInOutPallet_(clearFirst) {
  var IN = function (dt, pallet, sup, jenis, merk, nomor, qty, dok, nodok, sku) {
    return [D.apply(null, dt), 'Inbound', pallet, sup, jenis, merk, String(nomor), qty, dok, nodok, '', sku, 'IN-' + nodok, '', 'IN-' + nodok];
  };
  var OUT = function (dt, pallet, sup, jenis, merk, nomor, qty, dok, nodok, cust, sku) {
    return [D.apply(null, dt), 'Outbound', pallet, sup, jenis, merk, String(nomor), qty, dok, nodok, cust, sku, '', 'OUT-' + nodok, 'OUT-' + nodok];
  };
  var rows = [
    IN([2026, 1, 8], 'P3', 'PT Kaca Mulia', 'Kayu', 'MULIA', '0040', 1, 'Surat Jalan', 'PLT-001', 'P3/MULIA/0040'),
    IN([2026, 1, 20], 'P3', 'PT Kaca Mulia', 'Kayu', 'MULIA', '0041', 1, 'Surat Jalan', 'PLT-002', 'P3/MULIA/0041'),
    IN([2026, 2, 5], 'P5', 'PT Asahimas', 'Kayu', 'ASAHIMAS', '0101', 1, 'Surat Jalan', 'PLT-003', 'P5/ASAHIMAS/0101'),
    IN([2026, 2, 20], 'P5', 'PT Asahimas', 'Kayu', 'ASAHIMAS', '0102', 1, 'Surat Jalan', 'PLT-004', 'P5/ASAHIMAS/0102'),
    IN([2026, 3, 12], 'P7', 'PT Kaca Mulia', 'Plastik', 'MULIA', '0201', 1, 'Surat Jalan', 'PLT-005', 'P7/MULIA/0201'),
    IN([2026, 4, 3], 'P3', 'PT Kaca Mulia', 'Kayu', 'MULIA', '0042', 1, 'Surat Jalan', 'PLT-006', 'P3/MULIA/0042'),
    OUT([2026, 4, 10], 'P3', 'PT Kaca Mulia', 'Kayu', 'MULIA', '0040', 1, 'Surat Jalan', 'PLT-007', 'PT Windo Abadi', 'P3/MULIA/0040'),
    OUT([2026, 5, 15], 'P5', 'PT Asahimas', 'Kayu', 'ASAHIMAS', '0101', 1, 'Surat Jalan', 'PLT-008', 'PT Kusuma Glass', 'P5/ASAHIMAS/0101'),
    IN([2026, 6, 5], 'P7', 'PT Saint Gobain', 'Plastik', 'SGOBAIN', '0202', 1, 'Surat Jalan', 'PLT-009', 'P7/SGOBAIN/0202'),
    OUT([2026, 7, 20], 'P7', 'PT Kaca Mulia', 'Plastik', 'MULIA', '0201', 1, 'Surat Jalan', 'PLT-010', 'PT Cahaya Glass', 'P7/MULIA/0201')
  ];
  seedWrite_('In-Out Pallet', rows, clearFirst);
  // Arsip "All": salinan + 2 riwayat lama agar filter tanggal terlihat.
  var extra = [
    IN([2025, 11, 5], 'P3', 'PT Kaca Mulia', 'Kayu', 'MULIA', '0039', 1, 'Surat Jalan', 'PLT-000', 'P3/MULIA/0039'),
    OUT([2025, 12, 1], 'P3', 'PT Kaca Mulia', 'Kayu', 'MULIA', '0039', 1, 'Surat Jalan', 'PLT-000B', 'PT Windo Abadi', 'P3/MULIA/0039')
  ];
  seedWrite_('In-Out Pallet All', extra.concat(rows), clearFirst);
}

/* ================= TRACKING NOMER PALLET ================= */

function seedTracking_(clearFirst) {
  var R = function (sku, kembali, keluar, status, kembaliDari, keluarKe) {
    return [sku,
      kembali ? D.apply(null, kembali) : '',
      keluar ? D.apply(null, keluar) : '',
      status, kembaliDari, keluarKe];
  };
  seedWrite_('Tracking Nomer Pallet', [
    R('P3/MULIA/0040', [2026, 2, 1], [2026, 4, 10], 'Ada', 'PT Kaca Mulia', 'PT Windo Abadi'),
    R('P3/MULIA/0041', [2026, 1, 25], '', 'Ada', 'PT Kaca Mulia', ''),
    R('P5/ASAHIMAS/0101', [2026, 3, 1], [2026, 5, 15], 'Ada', 'PT Asahimas', 'PT Kusuma Glass'),
    R('P5/ASAHIMAS/0102', [2026, 2, 25], '', 'Kosong', 'PT Asahimas', ''),
    R('P7/MULIA/0201', [2026, 4, 1], [2026, 7, 20], 'Ada', 'PT Kaca Mulia', 'PT Cahaya Glass'),
    R('P3/MULIA/0042', [2026, 4, 5], '', 'Ada', 'PT Kaca Mulia', ''),
    R('P7/SGOBAIN/0202', [2026, 6, 6], '', 'Ada', 'PT Saint Gobain', '')
  ], clearFirst);
}

/* ================= SUMMARY ================= */

function seedSummary_(clearFirst) {
  seedWrite_('Summary Kaca', [
    ['Clear', 'CLEAR 5x1830x2440', 'Kaca Clear 5mm 1830x2440', 100, 50, 50, 0.5, 8, 0.08, 60, 'A'],
    ['Clear', 'CLEAR 8x1830x2440', 'Kaca Clear 8mm 1830x2440', 80, 20, 60, 0.75, 5, 0.0625, 40, 'A'],
    ['Bronze', 'BRONZE 5x1830x2440', 'Kaca Bronze 5mm 1830x2440', 60, 10, 50, 0.8333, 0, 0, 30, 'B'],
    ['Green', 'GREEN 5x1830x2440', 'Kaca Green 5mm 1830x2440', 70, 15, 55, 0.7857, 0, 0, 30, 'B'],
    ['Reflective', 'REFLECTIVE BLUE 6x1830x2440', 'Kaca Reflective Blue 6mm', 40, 5, 35, 0.875, 0, 0, 20, 'C'],
    ['Clear', 'CLEAR 5x1830x2440 (BS)', 'Kaca Clear 5mm (BS)', 25, 0, 25, 1, 0, 0, 10, 'C'],
    ['Frosted', 'FROSTED 8x1220x2440', 'Kaca Frosted 8mm 1220x2440', 30, 30, 0, 0, 0, 0, 15, 'C'],
    ['Clear', 'CLEAR 12x1830x2440', 'Kaca Clear 12mm 1830x2440', 50, 0, 50, 1, 0, 0, 25, 'B']
  ], clearFirst);

  seedWrite_('Summary Pallet', [
    ['Kayu', 6, 2, 4],
    ['Plastik', 3, 1, 2],
    ['Besi', 2, 0, 2]
  ], clearFirst);
}

/* ================= KONTROL SJ ================= */

function seedKontrol_(clearFirst) {
  seedWrite_('Kontrol SJ Kaca', [
    [D(2026, 2, 4), 'SJ-2026-003', 'PT Asahimas', 60, 'LOT-2026-003', D(2026, 2, 5), 'SJ-KIK-001', 'PT KIK Glass', 60, 'LOT-2026-003', 'Cocok', D(2026, 3, 15), 'SJ-2026-008', 'PT Kusuma Glass', 10, 'LOT-2026-003', D(2026, 3, 16), 'SJ-KIK-002', 'PT KIK Glass', 10, 'LOT-2026-003', 'Cocok'],
    [D(2026, 3, 11), 'SJ-2026-007', 'PT Kaca Mulia', 40, 'LOT-2026-005', D(2026, 3, 12), 'SJ-KIK-003', 'PT KIK Glass', 40, 'LOT-2026-005', 'Cocok', D(2026, 8, 20), 'SJ-2026-014', 'PT Cahaya Glass', 5, 'LOT-2026-005', D(2026, 8, 21), 'SJ-KIK-004', 'PT KIK Glass', 5, 'LOT-2026-005', 'Cocok'],
    [D(2026, 5, 6), 'SJ-2026-011', 'PT Saint Gobain', 30, 'LOT-2026-007', D(2026, 5, 7), 'SJ-KIK-005', 'PT KIK Glass', 28, 'LOT-2026-007', 'Tidak Cocok', D(2026, 8, 25), 'SJ-2026-015', 'PT Cahaya Glass', 30, 'LOT-2026-007', D(2026, 8, 26), 'SJ-KIK-006', 'PT KIK Glass', 30, 'LOT-2026-007', 'Cocok'],
    [D(2025, 6, 11), 'SJ-2026-001', 'PT Kaca Mulia', 100, 'LOT-2026-001', D(2025, 6, 12), 'SJ-KIK-007', 'PT KIK Glass', 100, 'LOT-2026-001', 'Cocok', D(2026, 2, 10), 'SJ-2026-004', 'PT Windo Abadi', 30, 'LOT-2026-001', D(2026, 2, 11), 'SJ-KIK-008', 'PT KIK Glass', 30, 'LOT-2026-001', 'Cocok'],
    [D(2026, 6, 2), 'SJ-2026-012', 'PT Kaca Mulia', 50, 'LOT-2026-008', '', '', '', '', '', 'Belum Ada SJ KIK', '', '', '', '', '', '', '', '', '', '', 'Belum Ada SJ KIK']
  ], clearFirst);

  seedWrite_('Kontrol SJ Pallet', [
    [D(2026, 1, 8), 'PLT-001', 'PT Kaca Mulia', 1, 'P3/MULIA/0040', D(2026, 1, 9), 'KIK-001', 'PT KIK Glass', 1, 'P3/MULIA/0040', 'Cocok', D(2026, 4, 10), 'PLT-007', 'PT Windo Abadi', 1, 'P3/MULIA/0040', D(2026, 4, 11), 'KIK-002', 'PT KIK Glass', 1, 'P3/MULIA/0040', 'Cocok'],
    [D(2026, 2, 5), 'PLT-003', 'PT Asahimas', 1, 'P5/ASAHIMAS/0101', D(2026, 2, 6), 'KIK-003', 'PT KIK Glass', 1, 'P5/ASAHIMAS/0101', 'Cocok', D(2026, 5, 15), 'PLT-008', 'PT Kusuma Glass', 1, 'P5/ASAHIMAS/0101', D(2026, 5, 16), 'KIK-004', 'PT KIK Glass', 1, 'P5/ASAHIMAS/0101', 'Cocok'],
    [D(2026, 3, 12), 'PLT-005', 'PT Kaca Mulia', 1, 'P7/MULIA/0201', D(2026, 3, 13), 'KIK-005', 'PT KIK Glass', 1, 'P7/MULIA/0201', 'Cocok', D(2026, 7, 20), 'PLT-010', 'PT Cahaya Glass', 1, 'P7/MULIA/0201', D(2026, 7, 21), 'KIK-006', 'PT KIK Glass', 1, 'P7/MULIA/0201', 'Cocok'],
    [D(2026, 2, 20), 'PLT-004', 'PT Asahimas', 1, 'P5/ASAHIMAS/0102', D(2026, 2, 21), 'KIK-007', 'PT KIK Glass', 1, 'P5/ASAHIMAS/0102', 'Tidak Cocok', '', '', '', '', '', '', '', '', '', '', 'Belum Ada SJ KIK'],
    [D(2026, 6, 5), 'PLT-009', 'PT Saint Gobain', 1, 'P7/SGOBAIN/0202', '', '', '', '', '', 'Belum Ada SJ KIK', '', '', '', '', '', '', '', '', '', '', 'Belum Ada SJ KIK']
  ], clearFirst);
}

/* ================= HASIL SO ================= */

function seedHasilSO_(clearFirst) {
  var R = function (periode, gudang, sku, item, sys, im, hitung, ket, perbaikan, lks) {
    return [D.apply(null, periode), gudang, sku, item, sys, im, hitung, hitung - im, ket, perbaikan, lks];
  };
  seedWrite_('Hasil SO', [
    R([2026, 9, 1], 'SG-01', 'CLEAR 5x1830x2440', 'Kaca Clear 5mm 1830x2440', 50, 50, 50, 'Cocok', '-', 'LKS-001'),
    R([2026, 9, 1], 'SG-01', 'CLEAR 8x1830x2440', 'Kaca Clear 8mm 1830x2440', 60, 60, 58, 'Selisih -2 (pecah)', 'Penyesuaian', 'LKS-002'),
    R([2026, 9, 1], 'SG-01', 'BRONZE 5x1830x2440', 'Kaca Bronze 5mm 1830x2440', 50, 50, 50, 'Cocok', '-', 'LKS-003'),
    R([2026, 9, 1], 'SG-02', 'GREEN 5x1830x2440', 'Kaca Green 5mm 1830x2440', 55, 55, 56, 'Selisih +1 (lebih catat)', 'Penyesuaian', 'LKS-004'),
    R([2026, 9, 1], 'SG-02', 'FROSTED 8x1220x2440', 'Kaca Frosted 8mm 1220x2440', 0, 0, 0, 'Cocok (kosong)', '-', 'LKS-005'),
    R([2026, 9, 1], 'SG-02', 'CLEAR 12x1830x2440', 'Kaca Clear 12mm 1830x2440', 50, 50, 49, 'Selisih -1 (retak)', 'Penyesuaian', 'LKS-006')
  ], clearFirst);
}

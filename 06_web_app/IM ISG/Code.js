/**
 * =============================================================================
 * Code.gs  —  KONSOLIDASI (Schema + Lapisan Data + Backend/API)
 * Inventory Management - SG | Super Glass
 * =============================================================================
 * File tunggal: berisi SCHEMA (single source of truth), setupDatabase,
 * helper data, autentikasi/role, dan seluruh endpoint yang dipanggil frontend.
 * =============================================================================
 */

// --- KONFIGURASI GLOBAL ------------------------------------------------------
const CONFIG = {
  SPREADSHEET_ID: '',                 // kosong = spreadsheet tempat skrip menempel
  SESSION_DURATION_MS: 8 * 60 * 60 * 1000,
  COMPANY_NAME: 'Super Glass',
  APP_NAME: 'Inventory Management - SG',
  LOGO_FILE_ID: '1RTWzb8DwoAXnbV6f4EtSnk_IpiVppjeu'
};

// --- ROLE --------------------------------------------------------------------
const ROLES = {
  ADMIN: 'Admin',
  MANAGEMENT: 'Management',
  GUDANG: 'Warehouse',
  FINANCE: 'Finance',
  PPIC: 'PPIC'
};
// Role yang boleh menulis transaksi (= akses semua menu). Finance & PPIC read-only terbatas.
const WRITE_ROLES = [ROLES.ADMIN, ROLES.MANAGEMENT, ROLES.GUDANG];

// --- SCHEMA (SINGLE SOURCE OF TRUTH) -----------------------------------------
const SCHEMA = {
  'Users': ['Username', 'Password', 'Role'],

  'Masterdata': [
    'SKU', 'Item Name', 'Kategori', 'SS', 'A-B-C', 'Jenis', 'Tebal', 'Ukuran',
    'Kualitas', 'Merk Kaca', 'Kualitas + Supplier', 'Red Expired', 'Yellow Expired',
    'Green Expired', 'Supplier', 'Customer', 'Lot Number', 'Pallet',
    'Kode Dokumen Pallet', 'Jenis Dokumen Pallet', 'SKU Pallet', 'Jenis Dokumen Kaca'
  ],

  'In-Out Kaca': [
    'Inbound Date', 'Date', 'Status', 'Jenis', 'Tebal', 'Kualitas', 'SKU#', 'SKU',
    'Item Name', 'Qty In', 'Qty Out', 'Customer', 'Supplier', 'Merk Kaca',
    'No Dokumen', 'Lot Number', 'Dokumen'
  ],

  'In-Out Pallet': [
    'Date', 'Status', 'Pallet', 'Supplier', 'Jenis Pallet', 'Merk', 'Nomor Pallet', 'Qty',
    'Dokumen', 'Nomor Dokumen', 'Customer', 'SKU', 'Code Masuk', 'Code Keluar', 'Code'
  ],

  'In-Out Pallet All': [
    'Date', 'Status', 'Pallet', 'Supplier', 'Jenis Pallet', 'Merk', 'Nomor Pallet', 'Qty',
    'Dokumen', 'Nomor Dokumen', 'Customer', 'SKU', 'Code Masuk', 'Code Keluar', 'Code'
  ],

  'Summary Kaca': [
    'Kategori', 'SKU', 'Item Name', 'Total In', 'Total Out', 'Current Inventory',
    '%Available', 'Expired Product', '% Expired Product', 'SS', 'A-B-C'
  ],

  'Summary Pallet': ['Jenis Pallet', 'Check In', 'Check Out', 'Inventory'],

  'Expired Product': [
    'Inbound Date', 'Jenis', 'Kualitas', 'SKU', 'Supplier', 'Merk Kaca', 'Lot Number',
    'Umur Kaca (Bulan)', 'Exp Qty', 'Qty', 'Code', 'Expired Status', 'Days in Inventory'
  ],

  'Tracking Nomer Pallet': [
    'SKU Pallet', 'Tanggal Kembali', 'Tanggal Keluar', 'Status',
    'Cust/Supplier Terakhir Kembali', 'Cust/Supplier Keluar Terakhir'
  ],

  'Kontrol SJ Pallet': [
    'Tanggal In SG', 'PG In SG', 'Supplier In SG', 'Qty In SG', 'SKU Pallet In SG',
    'Tanggal Out KIK', 'PG Out KIK', 'Customer Out KIK', 'Qty Out KIK', 'SKU Pallet Out KIK',
    'Kecocokan In SG', 'Tanggal Out SG', 'PG Out SG', 'Customer Out SG', 'Qty Out SG',
    'SKU Pallet Out SG', 'Tanggal In KIK', 'PG In KIK', 'Supplier In KIK', 'Qty In KIK',
    'SKU Pallet In KIK', 'Kecocokan Out SG'
  ],

  'Kontrol SJ Kaca': [
    'Tanggal In SG', 'PG In SG', 'Supplier In SG', 'Qty In SG', 'Lot In SG',
    'Tanggal Out KIK', 'PG Out KIK', 'Customer Out KIK', 'Qty Out KIK', 'Lot Out KIK',
    'Kecocokan In SG', 'Tanggal Out SG', 'PG Out SG', 'Customer Out SG', 'Qty Out SG',
    'Lot Out SG', 'Tanggal In KIK', 'PG In KIK', 'Supplier In KIK', 'Qty In KIK',
    'Lot In KIK', 'Kecocokan Out SG'
  ],

  'Hasil SO': [
    'Periode', 'Gudang', 'SKU', 'Item Name', 'Stok Sistem Keuangan',
    'Stok Inventory Management', 'Hitungan SO', 'Selisih', 'Keterangan Selisih',
    'Perbaikan', 'No LKS'
  ]
};

// =============================================================================
// SETUP DATABASE
// =============================================================================
function setupDatabase() {
  const ss = getSpreadsheet_();
  const report = [];

  Object.keys(SCHEMA).forEach(function (sheetName) {
    const headers = SCHEMA[sheetName];
    let sheet = ss.getSheetByName(sheetName);

    if (!sheet) { sheet = ss.insertSheet(sheetName); report.push('DIBUAT : ' + sheetName); }
    else { report.push('ADA    : ' + sheetName); }

    // Tulis header bila baris 1 kosong (jangan menimpa data formula Anda).
    const firstCell = sheet.getRange(1, 1).getValue();
    if (firstCell === '' || firstCell === null) {
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#1f3a5f').setFontColor('#ffffff');
      sheet.setFrozenRows(1);
    }

    // SINKRONISASI KOLOM: tambahkan header SCHEMA yang belum ada (di ujung kanan)
    // tanpa menyentuh data/kolom lama. Berguna saat skema bertambah.
    const lastCol = sheet.getLastColumn();
    if (lastCol > 0) {
      const existing = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(String);
      const missing = headers.filter(function (h) { return existing.indexOf(h) === -1; });
      if (missing.length) {
        sheet.getRange(1, lastCol + 1, 1, missing.length).setValues([missing]);
        sheet.getRange(1, lastCol + 1, 1, missing.length).setFontWeight('bold').setBackground('#1f3a5f').setFontColor('#ffffff');
        report.push('  +kolom (' + sheetName + '): ' + missing.join(', '));
      }
    }
  });

  const def = ss.getSheetByName('Sheet1');
  if (def && def.getLastRow() === 0 && ss.getSheets().length > 1) ss.deleteSheet(def);

  const users = ss.getSheetByName('Users');
  if (users && users.getLastRow() < 2) {
    users.appendRow(['admin', 'admin123', ROLES.ADMIN]);
    report.push('SEED   : akun admin default (admin / admin123)');
  }

  SpreadsheetApp.getUi
    ? SpreadsheetApp.getUi().alert('Setup selesai:\n\n' + report.join('\n'))
    : Logger.log(report.join('\n'));
  return report;
}

// =============================================================================
// HELPER LAPISAN DATA
// =============================================================================
function getSpreadsheet_() {
  return CONFIG.SPREADSHEET_ID ? SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID) : SpreadsheetApp.getActiveSpreadsheet();
}
function getSheet_(name) {
  const sheet = getSpreadsheet_().getSheetByName(name);
  if (!sheet) throw new Error('Sheet "' + name + '" tidak ditemukan. Jalankan setupDatabase() dulu.');
  return sheet;
}
/** Baca seluruh sheet SEKALI -> array of object berkunci header. Fondasi efisiensi. */
function getRows_(name) {
  const values = getSheet_(name).getDataRange().getValues();
  if (values.length < 1) return { headers: [], rows: [] };
  const headers = values[0].map(String);
  const rows = [];
  for (let i = 1; i < values.length; i++) {
    if (values[i].every(function (c) { return c === '' || c === null; })) continue;
    const obj = {};
    for (let c = 0; c < headers.length; c++) obj[headers[c]] = values[i][c];
    rows.push(obj);
  }
  return { headers: headers, rows: rows };
}
/**
 * Tambah baris ke BARIS KOSONG PERTAMA (berdasarkan kolom anchor yang selalu diisi
 * form, mis. "Status"). TIDAK pakai appendRow()/getLastRow() agar tidak loncat ke
 * baris 1001 karena kolom hasil ArrayFormula. Hanya menulis kolom milik form,
 * sehingga kolom formula tidak tertimpa.
 */
function appendRow_(name, dataObj, anchorHeader) {
  const sheet = getSheet_(name);
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(String);
  const anchor = (anchorHeader && headers.indexOf(anchorHeader) !== -1) ? anchorHeader : headers[0];
  const aCol = headers.indexOf(anchor) + 1;

  const maxRows = sheet.getMaxRows();
  const colVals = sheet.getRange(2, aCol, maxRows - 1, 1).getValues();
  let target = -1;
  for (let i = 0; i < colVals.length; i++) {
    if (colVals[i][0] === '' || colVals[i][0] === null) { target = i + 2; break; }
  }
  if (target === -1) { sheet.insertRowAfter(maxRows); target = maxRows + 1; }

  Object.keys(dataObj).forEach(function (h) {
    const c = headers.indexOf(h) + 1;
    if (c >= 1) sheet.getRange(target, c).setValue(dataObj[h]);
  });
  return target;
}
/** Tulis nilai ke satu sel sebagai TEKS (format '@'), menjaga angka nol depan
 *  seperti "0040" agar tidak berubah menjadi 40. */
function setCellText_(name, row, header, value) {
  const sheet = getSheet_(name);
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(String);
  const c = headers.indexOf(header) + 1;
  if (c < 1) return;
  const cell = sheet.getRange(row, c);
  cell.setNumberFormat('@');
  cell.setValue(String(value == null ? '' : value));
}
/** Normalisasi kunci untuk pencocokan komposit (abaikan huruf besar/kecil & pemisah). */
function normKey_(s) { return String(s == null ? '' : s).toUpperCase().replace(/[^A-Z0-9]/g, ''); }

// =============================================================================
// ENTRY POINT WEB APP
// =============================================================================
function doGet() {
  return HtmlService.createTemplateFromFile('Index')
    .evaluate()
    .setTitle(CONFIG.APP_NAME)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function include(filename) { return HtmlService.createHtmlOutputFromFile(filename).getContent(); }

function getAppConfig() {
  return {
    companyName: CONFIG.COMPANY_NAME,
    appName: CONFIG.APP_NAME,
    logoUrl: 'https://drive.google.com/thumbnail?id=' + CONFIG.LOGO_FILE_ID + '&sz=w320'
  };
}

// =============================================================================
// AUTENTIKASI & SESI
// =============================================================================
const SESSION_PREFIX_ = 'sg_session_';

function login(username, password) {
  try {
    if (!username || !password) return { ok: false, message: 'Username & password wajib diisi.' };
    const users = getRows_('Users').rows;
    const found = users.find(function (u) {
      return String(u['Username']).trim() === String(username).trim() && String(u['Password']) === String(password);
    });
    if (!found) return { ok: false, message: 'Username atau password salah.' };

    const token = Utilities.getUuid();
    const profile = { username: String(found['Username']).trim(), role: String(found['Role']).trim() };
    CacheService.getScriptCache().put(SESSION_PREFIX_ + token, JSON.stringify(profile), Math.floor(CONFIG.SESSION_DURATION_MS / 1000));
    return { ok: true, token: token, profile: profile };
  } catch (e) { return { ok: false, message: 'Error: ' + e.message }; }
}

function validateSession(token) {
  if (!token) return { ok: false };
  const raw = CacheService.getScriptCache().get(SESSION_PREFIX_ + token);
  if (!raw) return { ok: false };
  CacheService.getScriptCache().put(SESSION_PREFIX_ + token, raw, Math.floor(CONFIG.SESSION_DURATION_MS / 1000));
  return { ok: true, profile: JSON.parse(raw) };
}

function logout(token) {
  if (token) CacheService.getScriptCache().remove(SESSION_PREFIX_ + token);
  return { ok: true };
}

/** Gerbang otorisasi backend (lapis ke-2) untuk endpoint yang menulis data. */
function requireWriteAccess_(token) {
  const s = validateSession(token);
  if (!s.ok) throw new Error('Sesi tidak valid / kedaluwarsa. Silakan login ulang.');
  if (WRITE_ROLES.indexOf(s.profile.role) === -1) {
    throw new Error('Role "' + s.profile.role + '" tidak memiliki hak input data.');
  }
  return s.profile;
}

// =============================================================================
// PEMBACAAN DATA
// =============================================================================
/** Kembalikan {headers, rows} sebuah sheet sebagai JSON string (hindari null serialisasi). */
function getSheetData(token, sheetName) {
  try {
    if (!validateSession(token).ok) return JSON.stringify({ ok: false, message: 'Sesi tidak valid.' });
    if (!SCHEMA.hasOwnProperty(sheetName)) return JSON.stringify({ ok: false, message: 'Sheet tidak dikenal.' });
    const data = getRows_(sheetName);
    return JSON.stringify({ ok: true, headers: data.headers, rows: data.rows });
  } catch (e) { return JSON.stringify({ ok: false, message: e.message }); }
}

/** Masterdata ramping untuk mengisi dropdown form + auto-populate. JSON string. */
function getMasterdata(token) {
  try {
    if (!validateSession(token).ok) return JSON.stringify({ ok: false, message: 'Sesi tidak valid.' });
    const rows = getRows_('Masterdata').rows;
    const uniq = function (key) {
      const set = {};
      rows.forEach(function (r) { const v = String(r[key] || '').trim(); if (v) set[v] = true; });
      return Object.keys(set).sort();
    };
    const skuMap = {};
    rows.forEach(function (r) {
      const sku = String(r['SKU'] || '').trim();
      if (sku && !skuMap[sku]) skuMap[sku] = {
        itemName: r['Item Name'] || '', merk: r['Merk Kaca'] || '', kategori: r['Kategori'] || ''
      };
    });
    return JSON.stringify({
      ok: true, skuMap: skuMap, sku: Object.keys(skuMap).sort(),
      merk: uniq('Merk Kaca'), supplier: uniq('Supplier'), customer: uniq('Customer'),
      lotNumber: uniq('Lot Number'), pallet: uniq('Pallet'),
      jenisDokPallet: uniq('Jenis Dokumen Pallet'), jenisDokKaca: uniq('Jenis Dokumen Kaca'), kategori: uniq('Kategori')
    });
  } catch (e) { return JSON.stringify({ ok: false, message: e.message }); }
}

// =============================================================================
// HELPER VALIDASI STOK
// =============================================================================
/** Current inventory SKU kaca = ΣQty In − ΣQty Out dari In-Out Kaca (baca sekali). */
function getKacaInventoryForSku_(sku) {
  const rows = getRows_('In-Out Kaca').rows;
  let inSum = 0, outSum = 0; const target = String(sku).trim();
  for (let i = 0; i < rows.length; i++) {
    if (String(rows[i]['SKU']).trim() !== target) continue;
    inSum += Number(rows[i]['Qty In']) || 0;
    outSum += Number(rows[i]['Qty Out']) || 0;
  }
  return inSum - outSum;
}

/** Total Qty tersedia untuk sebuah Lot Number di sheet Expired Product. */
function getExpiredQtyForLot_(lot) {
  const rows = getRows_('Expired Product').rows;
  let total = 0, found = false; const target = String(lot).trim();
  rows.forEach(function (r) {
    if (String(r['Lot Number']).trim() === target) { found = true; total += Number(r['Qty']) || 0; }
  });
  return { found: found, total: total };
}

/** Cari status di Tracking Nomer Pallet untuk komposit Pallet/Merk/Nomor Pallet.
 *  Pencocokan dinormalisasi (abaikan huruf besar/kecil & pemisah seperti "/"),
 *  dibandingkan ke kolom "SKU Pallet" sheet Tracking (mis. "P3/MULIA/0040"),
 *  dan mengembalikan juga "key" versi terbaca untuk ditampilkan di alert. */
function getTrackingStatusForPalletSku_(pallet, merk, nomor) {
  const human = String(pallet) + '/' + String(merk) + '/' + String(nomor);
  const composite = normKey_(human);
  const rows = getRows_('Tracking Nomer Pallet').rows;
  for (let i = 0; i < rows.length; i++) {
    if (normKey_(rows[i]['SKU Pallet']) === composite) {
      return { found: true, status: String(rows[i]['Status'] || '').trim(), key: human };
    }
  }
  return { found: false, status: '', key: human };
}

// =============================================================================
// FORM SUBMIT — KACA
// =============================================================================
function submitKacaInbound(token, f) {
  try {
    requireWriteAccess_(token);
    if (!f.inboundDate) return { ok: false, message: 'Tanggal Masuk wajib diisi.' };
    if (!f.date) return { ok: false, message: 'Tanggal Dokumen wajib diisi.' };
    if (!f.sku) return { ok: false, message: 'SKU wajib dipilih.' };
    const qty = Number(f.qtyIn);
    if (!(qty > 0)) return { ok: false, message: 'Qty Masuk harus angka positif > 0.' };
    if (!f.noDokumen) return { ok: false, message: 'No Dokumen wajib diisi.' };
    if (!f.jenisDokumen) return { ok: false, message: 'Jenis Dokumen wajib dipilih.' };

    appendRow_('In-Out Kaca', {
      'Inbound Date': f.inboundDate, 'Date': f.date, 'Status': 'Inbound',
      'SKU': f.sku, 'Item Name': f.itemName || '', 'Qty In': qty, 'Qty Out': '',
      'Supplier': f.supplier || '', 'Merk Kaca': f.merk || '',
      'No Dokumen': f.noDokumen, 'Lot Number': f.lotNumber || '', 'Dokumen': f.jenisDokumen
    }, 'Status');
    return { ok: true, message: 'Barang masuk kaca berhasil dicatat.' };
  } catch (e) { return { ok: false, message: e.message }; }
}

function submitKacaOutbound(token, f) {
  try {
    requireWriteAccess_(token);
    if (!f.date) return { ok: false, message: 'Tanggal Dokumen wajib diisi.' };
    if (!f.sku) return { ok: false, message: 'SKU wajib dipilih.' };
    const qty = Number(f.qtyOut);
    if (!(qty > 0)) return { ok: false, message: 'Qty Keluar harus angka positif > 0.' };
    if (!f.noDokumen) return { ok: false, message: 'No Dokumen wajib diisi.' };
    if (!f.jenisDokumen) return { ok: false, message: 'Jenis Dokumen wajib dipilih.' };
    if (!f.lotNumber) return { ok: false, message: 'Lot Number wajib diisi untuk barang keluar.' };

    // Lapis 1: validasi stok per LOT dari sheet Expired Product.
    const lotInfo = getExpiredQtyForLot_(f.lotNumber);
    if (!lotInfo.found) return { ok: false, warning: true, message: 'Lot Number "' + f.lotNumber + '" tidak ditemukan di Expired Product.' };
    if (qty > lotInfo.total) return { ok: false, warning: true, message: 'Qty keluar (' + qty + ') melebihi stok lot "' + f.lotNumber + '" (tersedia ' + lotInfo.total + ').' };

    // Lapis 2: validasi current inventory SKU dari In-Out Kaca.
    const current = getKacaInventoryForSku_(f.sku);
    if (current < qty) {
      return { ok: false, warning: true, message: 'Stok SKU ' + f.sku + ' tidak mencukupi. Sisa: ' + current + ', diminta: ' + qty + '.' };
    }

    appendRow_('In-Out Kaca', {
      'Date': f.date, 'Status': 'Outbound', 'SKU': f.sku, 'Item Name': f.itemName || '',
      'Qty In': '', 'Qty Out': qty, 'Customer': f.customer || '', 'Supplier': f.supplier || '',
      'Merk Kaca': f.merk || '', 'No Dokumen': f.noDokumen, 'Lot Number': f.lotNumber || '', 'Dokumen': f.jenisDokumen
    }, 'Status');
    return { ok: true, message: 'Barang keluar kaca berhasil dicatat. Sisa stok SKU kini: ' + (current - qty) + '.' };
  } catch (e) { return { ok: false, message: e.message }; }
}

// =============================================================================
// FORM SUBMIT — PALLET
// =============================================================================
function submitPalletInbound(token, f) {
  try {
    requireWriteAccess_(token);
    if (!f.date) return { ok: false, message: 'Tanggal wajib diisi.' };
    if (!f.pallet) return { ok: false, message: 'Pallet wajib dipilih.' };
    if (!f.nomorPallet) return { ok: false, message: 'Nomor Pallet wajib diisi.' };
    const qty = Number(f.qty);
    if (!(qty > 0)) return { ok: false, message: 'Qty harus angka positif > 0.' };
    if (!f.jenisDokumen) return { ok: false, message: 'Jenis Dokumen wajib dipilih.' };
    if (!f.nomorDokumen) return { ok: false, message: 'Nomor Dokumen wajib diisi.' };

    const nomor = String(f.nomorPallet).trim();   // jaga sebagai string (mis. "0040")
    const row = appendRow_('In-Out Pallet', {
      'Date': f.date, 'Status': 'Inbound', 'Pallet': f.pallet, 'Merk': f.merk || '',
      'Nomor Pallet': nomor, 'Qty': qty, 'Dokumen': f.jenisDokumen,
      'Nomor Dokumen': f.nomorDokumen, 'Customer': f.customer || ''
    }, 'Status');
    setCellText_('In-Out Pallet', row, 'Nomor Pallet', nomor);   // pastikan tersimpan sebagai teks
    return { ok: true, message: 'Pallet masuk berhasil dicatat.' };
  } catch (e) { return { ok: false, message: e.message }; }
}

function submitPalletOutbound(token, f) {
  try {
    requireWriteAccess_(token);
    if (!f.date) return { ok: false, message: 'Tanggal wajib diisi.' };
    if (!f.pallet) return { ok: false, message: 'Pallet wajib dipilih.' };
    if (!f.nomorPallet) return { ok: false, message: 'Nomor Pallet wajib diisi.' };
    const qty = Number(f.qty);
    if (!(qty > 0)) return { ok: false, message: 'Qty harus angka positif > 0.' };
    if (!f.jenisDokumen) return { ok: false, message: 'Jenis Dokumen wajib dipilih.' };
    if (!f.nomorDokumen) return { ok: false, message: 'Nomor Dokumen wajib diisi.' };

    const nomor = String(f.nomorPallet).trim();   // jaga sebagai string (mis. "0040")

    // Validasi status di Tracking Nomer Pallet (komposit Pallet/Merk/Nomor Pallet).
    const trk = getTrackingStatusForPalletSku_(f.pallet, f.merk, nomor);
    if (!trk.found) return { ok: false, warning: true, message: 'SKU Pallet "' + trk.key + '" tidak terdaftar di Tracking Nomer Pallet — transaksi keluar tidak diizinkan. (Pastikan kombinasi ini ada di kolom SKU Pallet sheet Tracking.)' };
    if (String(trk.status).trim().toLowerCase() !== 'ada') {
      return { ok: false, warning: true, message: 'Status SKU Pallet "' + trk.key + '" di Tracking Nomer Pallet = "' + (trk.status || '(kosong)') + '". Transaksi keluar hanya diizinkan bila Status = "Ada".' };
    }

    const row = appendRow_('In-Out Pallet', {
      'Date': f.date, 'Status': 'Outbound', 'Pallet': f.pallet, 'Merk': f.merk || '',
      'Nomor Pallet': nomor, 'Qty': qty, 'Dokumen': f.jenisDokumen,
      'Nomor Dokumen': f.nomorDokumen, 'Customer': f.customer || ''
    }, 'Status');
    setCellText_('In-Out Pallet', row, 'Nomor Pallet', nomor);   // pastikan tersimpan sebagai teks
    return { ok: true, message: 'Pallet keluar berhasil dicatat.' };
  } catch (e) { return { ok: false, message: e.message }; }
}
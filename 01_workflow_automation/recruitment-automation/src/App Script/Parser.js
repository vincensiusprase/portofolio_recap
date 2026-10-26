// ==========================================================
// ===== BAGIAN 1: PARSING CV (DOCUMENT AI) =====
// ==========================================================

/**
 * Fungsi utama untuk memproses baris di sheet (Parsing CV).
 * Dipanggil oleh menu '1. Parse CV Baru'.
 */
function processSheet() {
  // Memeriksa properti yang diperlukan HANYA untuk parsing
  if (!checkScriptProperties(['GCP_PROJECT_ID', 'DOC_AI_LOCATION', 'DOC_AI_PROCESSOR_ID'])) return;
  
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME_RESPONSES);
  if (!sheet) {
    ss.toast(`Error: Sheet "${SHEET_NAME_RESPONSES}" tidak ditemukan.`, 'Gagal', 5);
    return;
  }
  
  const dataRange = sheet.getDataRange();
  const values = dataRange.getValues();

  // Toast awal saat memulai proses
  ss.toast('Mulai proses parsing CV... Mohon tunggu.', 'Processing', 10);

  let processedCount = 0;

  for (let i = 1; i < values.length; i++) {
    const row = values[i];
    const cvLink = row[CV_LINK_COLUMN_INDEX];
    const outputCell = row[OUTPUT_COLUMN_INDEX];
    
    if (outputCell || !cvLink) continue;

    try {
      // Indikator progres per baris di kanan bawah
      ss.toast(`Memproses CV baris ${i + 1}...`, 'Parsing CV', 3);

      const fileBlob = getDriveFileBlob(cvLink);
      if (!fileBlob) throw new Error("Link Google Drive tidak valid atau tidak dapat diakses.");
      
      const jsonResponse = parseCV(fileBlob);
      let formattedString = formatCvResponse(jsonResponse); 
      
      if (formattedString.length > MAX_CHAR_LIMIT) {
        formattedString = formattedString.substring(0, MAX_CHAR_LIMIT) + "\n... (Hasil dipotong)";
      }
      sheet.getRange(i + 1, OUTPUT_COLUMN_NUM).setValue(formattedString); 
      
      processedCount++;
      Utilities.sleep(1000);
    } catch (e) {
      Logger.log(`Error parsing di baris ${i + 1}: ${e.message}`);
      let errorMessage = `ERROR: ${e.message}`;
      if (errorMessage.length > MAX_CHAR_LIMIT) errorMessage = errorMessage.substring(0, MAX_CHAR_LIMIT);
      sheet.getRange(i + 1, OUTPUT_COLUMN_NUM).setValue(errorMessage);
    }
  }

  // Toast selesai (muncul 5 detik lalu hilang otomatis tanpa perlu klik OK)
  ss.toast(`Selesai! Total ${processedCount} CV berhasil diparse.`, 'Proses Selesai', 5);
}

/**
 * Helper untuk mengambil file blob dari Google Drive.
 */
function getDriveFileBlob(url) {
  if (!url || typeof url !== 'string') return null;
  const match = url.match(/\/d\/([a-zA-Z0-9_-]+)|id=([a-zA-Z0-9_-]+)/);
  const fileId = match ? (match[1] || match[2]) : null;
  if (!fileId) return null;
  try { return DriveApp.getFileById(fileId).getBlob(); } catch (e) { return null; }
}

/**
 * Helper untuk memanggil Document AI API.
 */
function parseCV(fileBlob) {
  // Fungsi ini masih menggunakan OAuth karena memanggil API GCP (Document AI)
  const url = `https://${DOC_AI_LOCATION}-documentai.googleapis.com/v1/projects/${GCP_PROJECT_ID}/locations/${DOC_AI_LOCATION}/processors/${DOC_AI_PROCESSOR_ID}:process`;
  const token = ScriptApp.getOAuthToken(); // <-- Ini diperlukan untuk Document AI
  
  // Menggunakan Utilities.base64Encode (b kecil)
  const payload = { "rawDocument": { "content": Utilities.base64Encode(fileBlob.getBytes()), "mimeType": fileBlob.getContentType() } };

  const options = { 'method': 'post', 'contentType': 'application/json', 'headers': { 'Authorization': 'Bearer ' + token }, 'payload': JSON.stringify(payload), 'muteHttpExceptions': true };
  const response = UrlFetchApp.fetch(url, options);
  const responseCode = response.getResponseCode();
  const responseBody = response.getContentText();
  if (responseCode === 200) { return JSON.parse(responseBody); }
  else { throw new Error(`Gagal memproses Document AI. Status: ${responseCode}. Respon: ${responseBody}`); }
}

/**
 * Helper untuk memformat output JSON dari Document AI menjadi teks rapi.
 */
function formatCvResponse(jsonResponse) {
  if (!jsonResponse || !jsonResponse.document || !jsonResponse.document.entities) {
    if (jsonResponse.document && jsonResponse.document.text) return jsonResponse.document.text;
    return "ERROR: Respons JSON tidak valid";
  }
  const entities = jsonResponse.document.entities;
  if (entities.length === 0) return "Tidak ada data terstruktur yang diekstrak.";
  const personalInfo = {}, educationHistory = [], workExperience = [], skills = [], others = [];
  entities.forEach(entity => {
    const text = entity.mentionText.replace(/\s+/g, ' ').trim();
    switch (entity.type) {
      case 'PERSON_NAME': personalInfo['Nama'] = text; break;
      case 'EMAIL': personalInfo['Email'] = text; break;
      case 'PHONE_NUMBER': personalInfo['Telepon'] = text; break;
      case 'JOB_TITLE': personalInfo['Jabatan'] = text; break;
      case 'LOCATION': personalInfo['Lokasi'] = text; break;
      case 'EDUCATION': educationHistory.push(`- ${entity.mentionText.replace(/\n/g, '\n  ')}`); break;
      case 'EXPERIENCE': workExperience.push(`- ${entity.mentionText.replace(/\n/g, '\n  ')}`); break;
      case 'SKILL': skills.push(text); break;
      default: others.push(`${entity.type}: ${text}`); break;
    }
  });
  const outputLines = [];
  if (Object.keys(personalInfo).length > 0) {
    outputLines.push("--- INFO PERSONAL ---");
    for (const key in personalInfo) outputLines.push(`${key}: ${personalInfo[key]}`);
  }
  if (skills.length > 0) { outputLines.push("\n--- KETERAMPILAN ---"); outputLines.push(skills.join(', ')); }
  if (workExperience.length > 0) { outputLines.push("\n--- PENGALAMAN KERJA ---"); outputLines.push(...workExperience); }
  if (educationHistory.length > 0) { outputLines.push("\n--- PENDIDIKAN ---"); outputLines.push(...educationHistory); }
  if (others.length > 0) { outputLines.push("\n--- INFO LAIN ---"); outputLines.push(...others); }
  return outputLines.join('\n');
}
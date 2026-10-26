// ===== PENGATURAN DARI SCRIPT PROPERTIES =====
const scriptProperties = PropertiesService.getScriptProperties();
// Properti untuk Document AI (Parsing)
const GCP_PROJECT_ID = scriptProperties.getProperty('GCP_PROJECT_ID');
const DOC_AI_LOCATION = scriptProperties.getProperty('DOC_AI_LOCATION');
const DOC_AI_PROCESSOR_ID = scriptProperties.getProperty('DOC_AI_PROCESSOR_ID');
// Properti untuk Gemini API (Scoring)
const GEMINI_API_KEY = scriptProperties.getProperty('GEMINI_API_KEY');

// ===== PENGATURAN SHEET PARSING =====
const SHEET_NAME_RESPONSES = "Respon"; // Pastikan nama ini sesuai
const CV_LINK_COLUMN_INDEX = 4; // Kolom E
const OUTPUT_COLUMN_INDEX = 5; // Kolom F
const OUTPUT_COLUMN_NUM = 6;   // Kolom G
const MAX_CHAR_LIMIT = 49999;

// ===== PENGATURAN SHEET SCORING =====
const SHEET_NAME_MASTERDATA = "Masterdata";
// Kolom di Sheet "Sheet Respon"
const POSISI_KANDIDAT_COL = 3;  // Kolom C
const PARSED_CV_COL = 6;      // Kolom F
const SCORING_OUTPUT_COL = 7; // Kolom G
const SUMMARY_OUTPUT_COL = 8; // Kolom H
// Kolom di Sheet "Masterdata"
const POSISI_MASTER_COL = 5;    // Kolom E
const JURUSAN_MASTER_COL = 6;   // Kolom F
const PENDIDIKAN_MASTER_COL = 7; // Kolom G
const PENGALAMAN_MASTER_COL = 8; // Kolom H
const SKILL_MASTER_COL = 9;     // Kolom I
const JOBDESC_MASTER_COL = 10;   // Kolom J

// Model AI Generatif untuk Scoring (Nama model untuk API Key)
const SCORING_MODEL = "gemini-3.5-flash"; // Model untuk Gemini API
const GEMINI_TEMPERATURE = 0.1; // 0.0 = Sangat Logis/Konsisten, 1.0 = Kreatif/Acak

// ==========================================================
// ===== FUNGSI UTAMA (MENU) & FUNGSI BERSAMA =====
// ==========================================================

function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('🤖 Recruitment Automation')
    .addItem('1. Parse CV', 'processSheet') // Fungsi ini ada di Parser.gs
    .addSeparator()
    .addItem('2. Scoring Candidates', 'scoreAllCandidates') // Fungsi ini ada di Scoring.gs
    .addSeparator()
    .addItem('3. Screening Pass', 'sendScreeningPass') // Fungsi ini ada di Screening_Pass.js
    .addSeparator()
    .addItem('4. Project Task Pass Kandidat', 'sendPJTaskPass') // Fungsi ini ada di Project_Task_Pass.js
    .addSeparator()
    .addItem('5. Create Offering Letter', 'createOfferingLetter') // Fungsi ini ada di Mail_Merge.js
    .addSeparator()
    .addItem('6. Send Interview Pass', 'sendInterviewPass') // Fungsi ini ada di Interview_Pass.js
    .addSeparator()
    .addItem('7. Send Offering Pass', 'sendOfferingPass') // Fungsi ini ada di Offering_Pass.js
    .addSeparator()
    .addToUi();
}

/**
 * Fungsi helper bersama untuk memeriksa properti skrip.
 */
function checkScriptProperties(requiredProperties) {
  let missingProps = [];
  requiredProperties.forEach(propName => {
    if (!scriptProperties.getProperty(propName)) {
      missingProps.push(propName);
    }
  });
  if (missingProps.length > 0) {
    Logger.log(`Error: Script Properties berikut belum diatur: ${missingProps.join(', ')}`);
    SpreadsheetApp.getUi().alert(`KONFIGURASI ERROR: Harap atur properti berikut di Project Settings > Script Properties:\n\n${missingProps.join('\n')}`);
    return false;
  }
  return true;
}

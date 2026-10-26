// ================================================================
// ===== BAGIAN 2: SCORING CV (GEMINI API) =====
// ================================================================

/**
 * Helper untuk memuat data dari sheet 'Masterdata' ke memori.
 */
function loadMasterdata() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME_MASTERDATA);
  if (!sheet) { throw new Error(`Sheet Masterdata "${SHEET_NAME_MASTERDATA}" tidak ditemukan.`); }
  const values = sheet.getDataRange().getValues();
  const masterdataMap = {};
  for (let i = 1; i < values.length; i++) {
    const row = values[i];
    const posisi = row[POSISI_MASTER_COL - 1]; 
    if (posisi) {
      masterdataMap[posisi.trim().toLowerCase()] = {
        posisi: posisi,
        jurusan: row[JURUSAN_MASTER_COL - 1],
        pendidikan: row[PENDIDIKAN_MASTER_COL - 1],
        pengalaman: row[PENGALAMAN_MASTER_COL - 1],
        skill: row[SKILL_MASTER_COL - 1],
        jobdesc: row[JOBDESC_MASTER_COL - 1]
      };
    }
  }
  Logger.log(`Masterdata berhasil dimuat. Total ${Object.keys(masterdataMap).length} posisi.`);
  return masterdataMap;
}

/**
 * Fungsi utama untuk melakukan scoring.
 * Dipanggil oleh menu '2. Skor Kandidat Baru'.
 */
function scoreAllCandidates() {
  // Memeriksa properti yang diperlukan HANYA untuk scoring
  if (!checkScriptProperties(['GEMINI_API_KEY'])) return;

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ui = SpreadsheetApp.getUi();
  let masterdata;
  try { 
    masterdata = loadMasterdata(); 
  } catch (e) { 
    ss.toast(`Error: ${e.message}`, 'Gagal', 5);
    return; 
  }

  const sheet = ss.getSheetByName(SHEET_NAME_RESPONSES);
  if (!sheet) { 
    ss.toast(`Error: Sheet "${SHEET_NAME_RESPONSES}" tidak ditemukan.`, 'Gagal', 5);
    return; 
  }
  
  const values = sheet.getDataRange().getValues();
  
  // Toast notifikasi mulai di kanan bawah (tampil 10 detik)
  ss.toast('Mulai proses scoring kandidat... Mohon tunggu.', 'Processing', 10);

  let processedCount = 0;

  for (let i = 1; i < values.length; i++) {
    const row = values[i];
    const scoreCell = row[SCORING_OUTPUT_COL - 1];
    const parsedCvText = row[PARSED_CV_COL - 1];
    const posisiDilamar = row[POSISI_KANDIDAT_COL - 1];

    if (scoreCell || !parsedCvText || !posisiDilamar || parsedCvText.startsWith("ERROR:")) {
      continue;
    }

    const kriteria = masterdata[posisiDilamar.trim().toLowerCase()];
    if (!kriteria) {
      Logger.log(`Kriteria untuk posisi "${posisiDilamar}" tidak ditemukan (Baris ${i + 1}).`);
      sheet.getRange(i + 1, SCORING_OUTPUT_COL).setValue(0);
      sheet.getRange(i + 1, SUMMARY_OUTPUT_COL).setValue("ERROR: Kriteria untuk posisi ini tidak ditemukan di Masterdata.");
      continue;
    }

    Logger.log(`Melakukan scoring untuk baris ${i + 1}, Posisi: ${posisiDilamar}`);
    // Toast indikator proses per baris agar terlihat progresnya
    ss.toast(`Sedang menilai kandidat baris ${i + 1} (${posisiDilamar})...`, 'Scoring CV', 3);

    try {
      const prompt = buildScoringPrompt(parsedCvText, kriteria);
      
      // Panggil Gemini menggunakan API Key
      const aiResponse = callGeminiWithApiKey(prompt); 

      const cleanJsonString = aiResponse.replace(/```json\n?|```/g, "").trim();
      let result;
      try {
         result = JSON.parse(cleanJsonString);
      } catch (jsonError) {
        Logger.log(`Error parsing JSON dari AI: ${jsonError}. Respons mentah: ${aiResponse}`);
        throw new Error("AI tidak mengembalikan format JSON yang valid.");
      }
      
      sheet.getRange(i + 1, SCORING_OUTPUT_COL).setValue(result.scoring || 0);
      sheet.getRange(i + 1, SUMMARY_OUTPUT_COL).setValue(result.summary || "Gagal membuat ringkasan.");

      processedCount++;
      Utilities.sleep(2000); // Jeda 2 detik antar panggilan API 

    } catch (e) {
      Logger.log(`Error scoring di baris ${i + 1}: ${e.message}`);
      sheet.getRange(i + 1, SCORING_OUTPUT_COL).setValue(0);
      sheet.getRange(i + 1, SUMMARY_OUTPUT_COL).setValue(`ERROR: ${e.message}`);
    }
  }

  // Toast notifikasi selesai (tampil selama 5 detik lalu otomatis hilang sendiri tanpa diklik)
  ss.toast(`Selesai! Total ${processedCount} kandidat berhasil dinilai.`, 'Proses Selesai', 5);
}
/**
 * Helper untuk membangun prompt untuk Gemini.
 * (Fungsi ini tidak diubah, sudah benar untuk alur kerja Anda)
 */
function buildScoringPrompt(cvText, kriteria) {
  const truncatedCvText = cvText.length > 20000 ? cvText.substring(0, 20000) : cvText;
  return `
Anda adalah Asisten HRD yang bertugas menilai CV kandidat secara objektif.
Berikut adalah data kandidat (hasil parsing CV) dan kriteria lowongan.

=========================
DATA KANDIDAT (CV):
=========================
${truncatedCvText}

=========================
KRITERIA LOWONGAN: ${kriteria.posisi}
=========================
1. Jurusan yang Dibutuhkan: ${kriteria.jurusan}
2. Level Pendidikan Minimal: ${kriteria.pendidikan}
3. Pengalaman Kerja Relevan: ${kriteria.pengalaman}
4. Skill yang Dibutuhkan: ${kriteria.skill}
5. Deskripsi Pekerjaan (Job Desc): ${kriteria.jobdesc}

=========================
INSTRUKSI PENILAIAN:
=========================
Lakukan penilaian kandidat berdasarkan data CV dan kriteria di atas.
Gunakan aturan poin berikut untuk menghitung total skor (0-100):

1. Kecocokan Pengalaman Kerja (Bobot 30 poin):
   - Bandingkan riwayat "PENGALAMAN KERJA" kandidat dengan "Pengalaman Kerja Relevan" dan "Job Desc" dari kriteria.

2. Kecocokan Pendidikan (Bobot 20 poin):
   - Bandingkan "PENDIDIKAN" kandidat dengan "Jurusan" dan "Level Pendidikan" dari kriteria.

3. Kecocokan Skill (Bobot 15 poin):
   - Bandingkan "KETERAMPILAN" kandidat dengan "Skill yang Dibutuhkan" dari kriteria.

4. Kecocokan Durasi Pengalaman (Bobot 15 poin):
   - Analisis durasi total pengalaman kerja kandidat dari CV.
   - Bandingkan dengan kriteria "Pengalaman Kerja Relevan".

5. Kecocokan Deskripsi Pengalaman (Bobot 20 poin):
   - Baca deskripsi tugas di "PENGALAMAN KERJA" kandidat.
   - Bandingkan seberapa mirip aktivitas tersebut dengan "Job Desc" dari kriteria.

=========================
FORMAT JAWABAN (WAJIB):
=========================
Berikan jawaban Anda HANYA dalam format JSON murni, tanpa teks lain di luar JSON.
{
  "scoring": <nilai_total_skor_numerik_dari_0_sampai_100>,
  "summary": "<teks_ringkasan_evaluasi_singkat_2_sampai_3_kalimat>"
}
`;
}

/**
 * FUNGSI YANG DIPERBAIKI: Memanggil Gemini API dengan Token Maksimal (8192).
 */
function callGeminiWithApiKey(prompt) {
  
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${SCORING_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
  
  const payload = {
    "contents": [
      {
        "parts": [{"text": prompt}]
      }
    ],
    "generationConfig": {
      "temperature": GEMINI_TEMPERATURE, 
      "maxOutputTokens": 8192,           // <--- UBAH INI DARI 2000 KE 8192
      "responseMimeType": "application/json"
    }
  };

  const options = {
    'method': 'post',
    'contentType': 'application/json',
    'payload': JSON.stringify(payload),
    'muteHttpExceptions': true
  };

  const response = UrlFetchApp.fetch(url, options);
  const responseCode = response.getResponseCode();
  const responseBody = response.getContentText();

  if (responseCode === 200) {
    const jsonResponse = JSON.parse(responseBody);
    const rawResponseText = jsonResponse.candidates?.[0]?.content?.parts?.[0]?.text;

    if (rawResponseText) {
      return rawResponseText; 
    } else {
      const finishReason = jsonResponse.candidates?.[0]?.finishReason;
      // Kita update pesan errornya agar tidak membingungkan
      if (finishReason) {
        throw new Error(`AI berhenti merespons. Alasan: ${finishReason} (Kemungkinan jawaban terlalu panjang).`);
      }
      throw new Error("Struktur respons AI tidak terduga atau kosong.");
    }
  } else {
    Logger.log(`Error Gemini API: ${responseBody}`);
    throw new Error(`Gagal memanggil Gemini API. Status: ${responseCode}. Respon: ${responseBody}`);
  }
}
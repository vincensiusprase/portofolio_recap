/**
 * Fungsi ini akan mengirim email otomatis ke kandidat yang memenuhi syarat.
 * Syarat kelulusan hanya: kolom H = "Pass".
 *
 * Pengecekan teknis: Kolom G (Email) tidak boleh kosong.
 *
 * Timestamp akan dicatat di kolom I.
 * Link Project Task akan diambil dari sheet 'masterdata' berdasarkan jabatan.
 */
function sendScreeningPass() {
  Logger.log('[START] sendScreeningPass dimulai. Waktu: ' + new Date());

  // --- Konfigurasi Sheet ---
  const appFormSheetName = "Recruitment";
  const masterdataSheetName = "Masterdata";

  // Membuka spreadsheet aktif dan mendapatkan sheet yang sesuai
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const appFormSheet = spreadsheet.getSheetByName(appFormSheetName);
  const masterdataSheet = spreadsheet.getSheetByName(masterdataSheetName);

  if (!appFormSheet) {
    Logger.log("Sheet dengan nama '" + appFormSheetName + "' tidak ditemukan.");
    return;
  }
  if (!masterdataSheet) {
    Logger.log("Sheet dengan nama '" + masterdataSheetName + "' tidak ditemukan.");
    return;
  }

  // --- Mendapatkan Data dari Sheet App Form ---
  const dataRange = appFormSheet.getDataRange();
  const values = dataRange.getValues();
  Logger.log(`[INFO] Sheet ${appFormSheetName}: ${values.length} baris, ${dataRange.getNumColumns()} kolom.`);

  // Kolom-kolom yang relevan di sheet App Form
  // Indeks kolom dimulai dari 0, jadi A=0, B=1, C=2, dst.
  const codeCol = 0;            // Kolom A : Candidate Code
  const nameCol = 2;            // Kolom C: Nama Lengkap
  const emailCol = 6;           // Kolom G: Email
  const jobTitleCol = 3;        // Kolom D: Jabatan Yang Dilamar
  const passCol = 7;            // Kolom H: Status kelulusan
  // Timestamp pengiriman (kolom I pada struktur sheet saat ini)
  const timestampCol = 8;

  // ID file logo di Google Drive
  const logoFileId = "1RTWzb8DwoAXnbV6f4EtSnk_IpiVppjeu";

  // --- Mendapatkan Data Link dari Sheet Masterdata ---
  const masterdataRange = masterdataSheet.getDataRange();
  const masterdataValues = masterdataRange.getValues();

  // Kolom-kolom yang relevan di sheet Masterdata
  const masterdataJobTitleCol = 4; // Kolom E: Jabatan Yang Dilamar
  const masterdataLinkCol = 10;    // Kolom K: Link Project Task

  // Membuat objek lookup untuk link project task
  const projectLinkMap = {};
  for (let i = 1; i < masterdataValues.length; i++) {
    const jobTitle = masterdataValues[i][masterdataJobTitleCol];
    const projectLink = masterdataValues[i][masterdataLinkCol];
    if (jobTitle && projectLink) {
      projectLinkMap[jobTitle] = projectLink;
    }
  }
  Logger.log(`[INFO] Project link berhasil dimuat: ${Object.keys(projectLinkMap).length} jabatan.`);

  // Melakukan perulangan untuk setiap baris data di App Form (mulai dari baris ke-2)
  for (let i = 1; i < values.length; i++) {
    const row = values[i];

    const candidateCode = row[codeCol];
    const namaLengkap = row[nameCol];
    const emailTujuan = row[emailCol];
    const jobTitle = row[jobTitleCol]; // Mendapatkan jabatan yang dilamar
    const screeningStatus = String(row[passCol] || '').trim().toLowerCase();
    const sentTimestamp = row[timestampCol];
    Logger.log(`[ROW ${i + 1}] Kandidat="${namaLengkap}", email="${emailTujuan}", status="${screeningStatus}", jabatan="${jobTitle}".`);

    // Satu-satunya kriteria kelulusan adalah kolom status = "Pass".
    // Email harus tersedia dan kolom timestamp harus masih kosong.
    if (screeningStatus === 'pass' && emailTujuan && !sentTimestamp) {
      Logger.log(`[ROW ${i + 1}] Lolos filter. Menyiapkan email ke ${emailTujuan}.`);

      // Mencari link project task dari map lookup
      const projectLink = projectLinkMap[jobTitle];

      if (!projectLink) {
        Logger.log(`[SKIP ROW ${i + 1}] Link Project Task untuk jabatan '${jobTitle}' tidak ditemukan di sheet masterdata.`);
        continue; // Lanjut ke baris berikutnya jika link tidak ada
      }
      Logger.log(`[ROW ${i + 1}] Project link ditemukan.`);

      // Ambil waktu sekarang saat script berjalan
      const now = new Date();
      // Tambahkan 48 jam (48 jam * 60 menit * 60 detik * 1000 milidetik)
      const deadlineDate = new Date(now.getTime() + (48 * 60 * 60 * 1000));
      
      // Format tanggal ke Bahasa Inggris (Contoh: Wednesday, 11 February 2026 at 16:00)
      const deadlineString = deadlineDate.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false // Menggunakan format 24 jam (16:00)
      });

      // Subjek email
      const subject = `Super Store Recruitment - Project Task Invitation | ${jobTitle}`;

      // Mendapatkan file logo dari Google Drive berdasarkan ID
      let logoBlob;
      try {
        const logoFile = DriveApp.getFileById(logoFileId);
        logoBlob = logoFile.getBlob();
        Logger.log(`[ROW ${i + 1}] Logo berhasil diakses: ${logoFile.getName()}.`);
      } catch (logoError) {
        Logger.log(`[ERROR ROW ${i + 1}] Logo gagal diakses. File ID: ${logoFileId}. Error: ${logoError.message}`);
        Logger.log(logoError.stack || logoError);
        continue;
      }

      // Escape data dari spreadsheet sebelum dimasukkan ke HTML.
      const escapeHtml = (value) => String(value || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
      const safeName = escapeHtml(namaLengkap);
      const safeJobTitle = escapeHtml(jobTitle);
      const safeCandidateCode = escapeHtml(candidateCode);
      const safeProjectLink = escapeHtml(projectLink);

      // Isi email HTML dengan layout kartu yang responsif dan tombol CTA.
      const htmlBody = `
        <div style="margin:0;padding:32px 12px;background:#f4f7fb;font-family:Arial,Helvetica,sans-serif;color:#263247;line-height:1.6;">
          <div style="max-width:900px;margin:0 auto;background:#ffffff;border:1px solid #e5eaf2;border-radius:18px;overflow:hidden;box-shadow:0 8px 24px rgba(28,48,82,.08);">
            <div style="padding:30px 32px;text-align:center;background:linear-gradient(135deg,#123b63,#1f78a8);">
              <img src="cid:logoImage" alt="Super Store" style="max-width:170px;max-height:72px;object-fit:contain;background:#fff;border-radius:10px;padding:8px;">
              <div style="margin-top:16px;color:#dcefff;font-size:13px;letter-spacing:1.5px;text-transform:uppercase;">Candidate Update</div>
            </div>
            <div style="padding:32px;">
              <p style="margin:0 0 18px;font-size:16px;">Dear <strong>${safeName}</strong>,</p>
              <div style="padding:18px 20px;margin-bottom:24px;background:#eef8f4;border-left:5px solid #22a06b;border-radius:10px;">
                <div style="font-size:20px;font-weight:700;color:#147a4c;">Congratulations!</div>
                <div style="margin-top:4px;">You have passed the screening stage for the <strong>${safeJobTitle}</strong> position.</div>
              </div>
              <p>We are pleased to invite you to continue to the next stage: the <strong>Project Task</strong>.</p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;">
                <tr>
                  <td valign="top" width="50%" style="width:50%;padding:0 12px 0 0;">
                    <h2 style="margin:10px 0 12px;color:#123b63;font-size:20px;">Your next steps</h2>
              <div style="padding:18px 20px;margin:12px 0;border:1px solid #dce8f2;border-radius:12px;">
                <strong style="color:#123b63;">1. Myers-Briggs Test</strong>
                <p style="margin:8px 0 0;">Access the test using the button below, copy the file, complete it, and share the copied file with General Access set to Anyone with the Link.</p>
                <p style="margin:12px 0 0;"><a href="https://funnel.16types.ai/id?utm_source=google&utm_medium=cpc&utm_campaign=23937784921&utm_content=202560476332&utm_term=812568719425&utm_channel=gsrc&utm_mar=yurii&gad_source=1&gad_campaignid=23937784921&gbraid=0AAAABDheCqEAlSQeLcZmvUb5qWDBwZ-YW&gclid=CjwKCAjwi-zWBhAdEiwAqlRf-Cz_rctWv8ctchXDnCmYps1X5ggF_76A109QK361fTYMRZZRV0Uj4RoC62AQAvD_BwE" style="display:inline-block;padding:10px 16px;background:#eaf3fb;color:#12527b;border-radius:8px;text-decoration:none;font-weight:700;">Open MBTI Test</a></p>
              </div>
              <div style="padding:18px 20px;margin:12px 0;border:1px solid #dce8f2;border-radius:12px;">
                <strong style="color:#123b63;">2. Positional Study Case</strong>
                <p style="margin:8px 0 0;">Open the project task, copy the file, complete your work, and share the copied file with General Access set to Anyone with the Link.</p>
                <p style="margin:12px 0 0;"><a href="${safeProjectLink}" style="display:inline-block;padding:10px 16px;background:#eaf3fb;color:#12527b;border-radius:8px;text-decoration:none;font-weight:700;">Open Project Task</a></p>
              </div>
                  </td>
                  <td valign="top" width="50%" style="width:50%;padding:0 0 0 12px;">
              <div style="padding:18px 20px;margin:24px 0;background:#fff8e8;border-radius:12px;">
                <strong style="color:#8a5a00;">Deadline</strong>
                <p style="margin:6px 0 0;">Please submit everything no later than <strong>${deadlineString}</strong>. Late submissions will not be considered.</p>
              </div>
              <h2 style="margin:28px 0 12px;color:#123b63;font-size:20px;">Submission details</h2>
              <ul style="padding-left:22px;">
                <li>MBTI file name: <strong>SUPERSTORE_2026_Position_Your Name_MBTI</strong></li>
                <li>Project task file name: <strong>SUPERSTORE_2026_Position_Your Name_PJTask</strong></li>
                <li>Candidate Code: <strong>${safeCandidateCode}</strong></li>
              </ul>
              <p>Submit your results using these forms:</p>
              <p><a href="https://forms.gle/JzmqMKjSMZMn9q9d6" style="color:#126da0;font-weight:700;">Submission Form</a></p>
                  </td>
                </tr>
              </table>
              <p style="margin-top:24px;">After submitting, please confirm via email at <strong>recruitment@superstore.com</strong> or WhatsApp at <strong><a href="https://wa.me/628123456789" style="color:#126da0;">wa.me/628123456789</a></strong>. If you have technical questions, please contact us through the same channels.</p>
              <p style="margin-top:28px;">Best regards,<br><strong>Super Store Recruitment Team</strong></p>
            </div>
            <div style="padding:18px 32px;background:#f7f9fc;border-top:1px solid #e5eaf2;color:#68778c;font-size:12px;">
              Official information is sent only from <strong>recruitment@superstore.com</strong>. Please report any suspicious communication immediately.
            </div>
          </div>
        </div>
      `;

      try {
        // Mengirim email dengan htmlBody dan lampiran inline
        GmailApp.sendEmail(
          emailTujuan,
          subject,
          '', {
            htmlBody: htmlBody,
            inlineImages: {
              logoImage: logoBlob
            }
          }
        );

        // Menulis timestamp pengiriman
        appFormSheet.getRange(i + 1, timestampCol + 1).setValue(now);

        // Mencatat log bahwa email berhasil dikirim
        Logger.log(`[SUCCESS ROW ${i + 1}] Email berhasil dikirim ke: ${emailTujuan} (${namaLengkap}). Timestamp: ${now}`);

      } catch (error) {
        // Menangkap error jika ada kegagalan saat mengirim email
        Logger.log(`[ERROR ROW ${i + 1}] Gagal mengirim email ke ${emailTujuan}. Error: ${error.message}`);
        Logger.log(error.stack || error);
      }
    } else {
      const alasan = screeningStatus !== 'pass'
        ? `status kolom H bukan Pass (nilai: "${screeningStatus}")`
        : !emailTujuan
          ? 'alamat email kolom G kosong'
          : `kolom I sudah memiliki timestamp (${sentTimestamp})`;
      Logger.log(`[SKIP ROW ${i + 1}] ${alasan}.`);
    }
  }

  Logger.log('[END] sendScreeningPass selesai.');
}

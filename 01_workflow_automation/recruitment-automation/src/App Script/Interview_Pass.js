/**
 * Mengirim pemberitahuan bahwa kandidat lolos tahap interview.
 *
 * Syarat Recruitment:
 * - Kolom L = "Pass"
 * - Kolom M masih kosong
 *
 * Relasi data:
 * - Recruitment kolom A = Offering kolom A
 * - Link offering letter di Offering kolom L
 *
 * Struktur Recruitment yang digunakan:
 * - A: Candidate Code / key
 * - C: Nama kandidat
 * - D: Jabatan
 * - G: Email
 * - L: Status interview
 * - M: Timestamp pengiriman
 */
function sendInterviewPass() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const recruitmentSheet = spreadsheet.getSheetByName('Recruitment');
  const offeringSheet = spreadsheet.getSheetByName('Offering');

  if (!recruitmentSheet || !offeringSheet) {
    throw new Error("Sheet 'Recruitment' dan 'Offering' wajib tersedia.");
  }

  const recruitmentValues = recruitmentSheet.getDataRange().getDisplayValues();
  const offeringValues = offeringSheet.getDataRange().getDisplayValues();
  const logoFileId = '1RTWzb8DwoAXnbV6f4EtSnk_IpiVppjeu';

  // Offering: key kolom A, link dokumen kolom L.
  const offeringMap = new Map();
  for (let i = 1; i < offeringValues.length; i++) {
    const key = String(offeringValues[i][0] || '').trim();
    const offeringLink = String(offeringValues[i][11] || '').trim();
    if (key && offeringLink) {
      offeringMap.set(key, offeringLink);
    }
  }

  let sentCount = 0;
  let skippedCount = 0;

  for (let i = 1; i < recruitmentValues.length; i++) {
    const rowNumber = i + 1;
    const row = recruitmentValues[i];

    const key = String(row[0] || '').trim();
    const candidateName = String(row[2] || '').trim();
    const jobTitle = String(row[3] || '').trim();
    const email = String(row[6] || '').trim();
    const interviewStatus = String(row[11] || '').trim().toLowerCase();
    const sentTimestamp = String(row[12] || '').trim();

    // Hanya memproses kandidat Pass yang belum pernah dikirimi email.
    if (interviewStatus !== 'pass' || sentTimestamp) {
      continue;
    }

    if (!key || !email) {
      Logger.log(`[SKIP ROW ${rowNumber}] Key atau email kosong.`);
      skippedCount++;
      continue;
    }

    const offeringLink = offeringMap.get(key);
    if (!offeringLink) {
      Logger.log(`[SKIP ROW ${rowNumber}] Offering letter untuk key '${key}' tidak ditemukan.`);
      skippedCount++;
      continue;
    }

    let offeringFile;
    try {
      offeringFile = getDriveFileFromLink_(offeringLink);
    } catch (error) {
      Logger.log(`[SKIP ROW ${rowNumber}] Link offering letter tidak valid: ${error.message}`);
      skippedCount++;
      continue;
    }

    const safeName = escapeHtml_(candidateName);
    const safeJobTitle = escapeHtml_(jobTitle);
    const safeKey = escapeHtml_(key);
    const subject = `Super Store Recruitment - Interview Passed | ${jobTitle || 'Candidate Update'}`;

    let logoBlob;
    try {
      logoBlob = DriveApp.getFileById(logoFileId).getBlob();
    } catch (error) {
      Logger.log(`[SKIP ROW ${rowNumber}] Logo tidak dapat diakses: ${error.message}`);
      skippedCount++;
      continue;
    }

    // Isi email dalam format HTML dengan logo dan penjelasan lengkap.
    const htmlBody = `
      <div style="font-family:Georgia,serif;color:#263247;line-height:1.6;max-width:760px;margin:0 auto;">
        <div style="text-align:center;background:#1f6f9f;padding:22px 20px 24px;margin-bottom:24px;border-radius:12px 12px 0 0;">
          <img src="cid:logoImage" alt="Super Store Logo" style="display:block;background:#fff;max-width:150px;max-height:80px;margin:0 auto 14px;padding:8px;border-radius:8px;box-sizing:border-box;">
          <div style="font-family:Arial,sans-serif;color:#fff;font-size:12px;letter-spacing:1px;text-transform:uppercase;">Interview Result &amp; Offering Letter</div>
        </div>
        <p>Dear <strong>${safeName}</strong>,</p>
        <p>Thank you for your patience, time, and commitment throughout our recruitment process. We are delighted to inform you that you have successfully passed the interview stage for the <strong>${safeJobTitle}</strong> position at Super Store.</p>
        <div style="padding:20px 22px;margin:22px 0;background:#eef8f4;border-left:5px solid #22a06b;border-radius:10px;font-family:Arial,sans-serif;">
          <div style="font-size:21px;font-weight:700;color:#147a4c;">Congratulations!</div>
          <div style="margin-top:7px;">You are one step closer to joining our team.</div>
        </div>
        <p>As the next step, please find attached your official <strong>Offer Letter in PDF format</strong>. The document contains the details of the position, employment terms, compensation, and other relevant conditions.</p>
        <p>For your reference, here is a summary of your application:</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0;font-family:Arial,sans-serif;font-size:14px;">
          <tr><td style="padding:10px 12px;border:1px solid #dce8f2;background:#f7f9fc;font-weight:700;width:38%;">Candidate Code</td><td style="padding:10px 12px;border:1px solid #dce8f2;">${safeKey}</td></tr>
          <tr><td style="padding:10px 12px;border:1px solid #dce8f2;background:#f7f9fc;font-weight:700;">Position</td><td style="padding:10px 12px;border:1px solid #dce8f2;">${safeJobTitle}</td></tr>
          <tr><td style="padding:10px 12px;border:1px solid #dce8f2;background:#f7f9fc;font-weight:700;">Interview Status</td><td style="padding:10px 12px;border:1px solid #dce8f2;color:#147a4c;font-weight:700;">Passed</td></tr>
        </table>
        <p>Kindly review the attached Offer Letter carefully, including the compensation package, employment status, start date, responsibilities, and other terms stated in the document. Please keep the file for your records.</p>
        <p>We would also like to highlight a few important points:</p>
        <ul>
          <li>The offering is based on the requirements of the position, available budget, and the overall recruitment assessment.</li>
          <li>Please ensure that all information in the Offer Letter is correct and contact us promptly if you find any discrepancy.</li>
          <li>Your acceptance and any requested documents should be submitted according to the instructions stated in the Offer Letter.</li>
          <li>All employment terms remain subject to the formal agreement and applicable company policies.</li>
        </ul>
        <p>If you have any questions regarding the Offer Letter or the next steps, please contact our Recruitment Team directly via WhatsApp at <strong>wa.me/628123456789</strong>.</p>
        <p>We are confident that you will bring great value to our team, and we truly look forward to welcoming you on board.</p>
        <p>Best regards,<br><strong>Super Store Recruitment Team</strong></p>
        <br>
        <hr style="border:0;border-top:1px solid #dce8f2;">
        <p style="font-family:Arial,sans-serif;color:#68778c;font-size:12px;">*Please note that official recruitment information is sent only through our authorized recruitment channel. We are not responsible for phishing attempts using other email addresses. If you receive suspicious communication, please inform the Recruitment Team immediately.</p>
      </div>
    `;

    try {
      const offeringPdfBlob = offeringFile
        .getAs(MimeType.PDF)
        .setName(`Offering_Letter_${key}.pdf`);

      GmailApp.sendEmail(email, subject, '', {
        htmlBody: htmlBody,
        inlineImages: { logoImage: logoBlob },
        attachments: [offeringPdfBlob]
      });

      // Kolom M menjadi penanda bahwa email sudah berhasil dikirim.
      recruitmentSheet.getRange(rowNumber, 13).setValue(new Date());
      sentCount++;
      Logger.log(`[SUCCESS ROW ${rowNumber}] Interview pass berhasil dikirim ke ${email}.`);
    } catch (error) {
      Logger.log(`[ERROR ROW ${rowNumber}] Gagal mengirim ke ${email}: ${error.message}`);
      skippedCount++;
    }
  }

  Logger.log(`[DONE] Terkirim: ${sentCount}; dilewati/gagal: ${skippedCount}.`);
}

/** Mengambil file Drive dari URL atau file ID pada kolom L. */
function getDriveFileFromLink_(link) {
  const match = String(link).match(/[-\w]{25,}/);
  if (!match) {
    throw new Error('ID file tidak ditemukan pada link.');
  }
  return DriveApp.getFileById(match[0]);
}

/** Mencegah isi spreadsheet merusak HTML email. */
function escapeHtml_(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

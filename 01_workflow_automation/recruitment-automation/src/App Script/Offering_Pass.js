/**
 * Mengirim konfirmasi setelah offering letter yang sudah dikembalikan
 * kandidat diterima oleh Recruitment Team.
 *
 * Syarat pada sheet Recruitment:
 * - Kolom N = "Pass" setelah offering letter dikembalikan kandidat
 * - Kolom O masih kosong sebagai penanda email belum dikirim
 *
 * Data kandidat:
 * - Recruitment A = Candidate Code / key
 * - Recruitment C = Nama kandidat
 * - Recruitment D = Jabatan
 * - Recruitment G = Email kandidat
 */
function sendOfferingPass() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const recruitmentSheet = spreadsheet.getSheetByName('Recruitment');

  if (!recruitmentSheet) {
    throw new Error("Sheet 'Recruitment' wajib tersedia.");
  }

  const recruitmentValues = recruitmentSheet.getDataRange().getDisplayValues();
  const logoFileId = '1RTWzb8DwoAXnbV6f4EtSnk_IpiVppjeu';

  let sentCount = 0;
  let skippedCount = 0;

  for (let i = 1; i < recruitmentValues.length; i++) {
    const rowNumber = i + 1;
    const row = recruitmentValues[i];
    const key = String(row[0] || '').trim();
    const candidateName = String(row[2] || '').trim();
    const jobTitle = String(row[3] || '').trim();
    const startDate = 'Akan diinformasikan oleh Recruitment Team';
    const email = String(row[6] || '').trim();
    const status = String(row[13] || '').trim().toLowerCase();
    const sentTimestamp = String(row[14] || '').trim();
    if (status !== 'pass' || sentTimestamp) continue;
    if (!key || !candidateName || !email) {
      Logger.log(`[SKIP ROW ${rowNumber}] Key, nama, atau email kosong.`);
      skippedCount++;
      continue;
    }

    const safeName = escapeOfferingHtml_(candidateName);
    const safeJobTitle = escapeOfferingHtml_(jobTitle);
    const safeStartDate = escapeOfferingHtml_(startDate || 'Akan diinformasikan oleh Recruitment Team');
    const subject = `Welcome to Super Store - ${jobTitle || 'Welcome Aboard'}`;
    let logoBlob;

    try {
      logoBlob = DriveApp.getFileById(logoFileId).getBlob();
      const htmlBody = `
        <div style="font-family:Arial,Helvetica,sans-serif;color:#263247;line-height:1.6;max-width:760px;margin:0 auto;">
          <div style="text-align:center;background:#1f6f9f;padding:22px 20px 24px;border-radius:12px 12px 0 0;">
            <img src="cid:logoImage" alt="Super Store Logo" style="display:block;background:#fff;max-width:150px;max-height:80px;margin:0 auto 14px;padding:8px;border-radius:8px;box-sizing:border-box;">
            <div style="color:#fff;font-size:12px;letter-spacing:1px;text-transform:uppercase;">Welcome to Super Store</div>
          </div>
          <div style="padding:28px 24px;">
            <p>Dear <strong>${safeName}</strong>,</p>
            <p>Congratulations and welcome to <strong>Super Store</strong>! We confirm that your signed offering letter has been received and recorded by our Recruitment Team. You are now officially joining us as <strong>${safeJobTitle}</strong>.</p>
            <div style="padding:18px 20px;margin:22px 0;background:#eef8f4;border-left:5px solid #22a06b;border-radius:10px;">
              <strong style="color:#147a4c;font-size:18px;">Welcome aboard!</strong>
              <div style="margin-top:6px;">Your planned start date is <strong>${safeStartDate}</strong>.</div>
            </div>
            <h3>Onboarding information</h3>
            <ul><li>Recruitment Team will share your first-day schedule and reporting instructions.</li><li>Please prepare to attend the onboarding session and bring the required documents.</li><li>Further information about your team, responsibilities, and company policies will be provided during onboarding.</li></ul>
            <h3>Required administrative documents</h3>
            <p>Please prepare and submit the following documents according to the instructions from our Recruitment or HR Team:</p>
            <ul><li>Copy of identity card/passport</li><li>Tax identification and bank account details</li><li>Education certificate or supporting qualifications</li><li>Other documents required for employment administration</li></ul>
            <p>Please submit the documents according to the instructions from our Recruitment or HR Team. Ensure that all information is accurate. If you have any questions, contact our Recruitment Team directly.</p>
            <p>We look forward to having you as part of the Super Store team.</p>
            <p>Best regards,<br><strong>Super Store Recruitment Team</strong></p>
          </div>
        </div>`;

      GmailApp.sendEmail(email, subject, '', { htmlBody, inlineImages: { logoImage: logoBlob } });
      recruitmentSheet.getRange(rowNumber, 15).setValue(new Date());
      sentCount++;
      Logger.log(`[SUCCESS ROW ${rowNumber}] Welcome email berhasil dikirim ke ${email}.`);
    } catch (error) {
      Logger.log(`[ERROR ROW ${rowNumber}] Gagal mengirim ke ${email}: ${error.message}`);
      skippedCount++;
    }
  }

  Logger.log(`[DONE] Terkirim: ${sentCount}; dilewati/gagal: ${skippedCount}.`);
}

function escapeOfferingHtml_(value) {
  return String(value || '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

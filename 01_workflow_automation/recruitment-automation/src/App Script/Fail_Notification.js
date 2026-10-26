/**
 * Mengirim notifikasi bahwa kandidat tidak melanjutkan ke tahap berikutnya.
 *
 * Status Recruitment:
 * - H = Screening,       timestamp = I
 * - J = Project Task,    timestamp = K
 * - L = Interview,       timestamp = M
 * - N = Offering,        timestamp = O
 *
 * Status harus bernilai "Fail" dan timestamp stage terkait harus kosong.
 * Timestamp hanya ditulis setelah email berhasil dikirim.
 */
function sendFailNotifications() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const recruitmentSheet = spreadsheet.getSheetByName('Recruitment');

  if (!recruitmentSheet) {
    throw new Error("Sheet 'Recruitment' wajib tersedia.");
  }

  const values = recruitmentSheet.getDataRange().getDisplayValues();
  const logoFileId = '1RTWzb8DwoAXnbV6f4EtSnk_IpiVppjeu';
  const stages = [
    { name: 'Screening', statusCol: 7, timestampCol: 8 },
    { name: 'Project Task', statusCol: 9, timestampCol: 10 },
    { name: 'Interview', statusCol: 11, timestampCol: 12 },
    { name: 'Offering', statusCol: 13, timestampCol: 14 }
  ];

  let logoBlob;
  try {
    logoBlob = DriveApp.getFileById(logoFileId).getBlob();
  } catch (error) {
    Logger.log(`[ERROR] Logo gagal diakses: ${error.message}`);
    return;
  }

  let sentCount = 0;
  for (let i = 1; i < values.length; i++) {
    const row = values[i];
    const rowNumber = i + 1;
    const candidateCode = String(row[0] || '').trim();
    const candidateName = String(row[2] || '').trim();
    const jobTitle = String(row[3] || '').trim();
    const email = String(row[6] || '').trim();

    if (!candidateCode || !candidateName || !email) {
      Logger.log(`[SKIP ROW ${rowNumber}] Candidate code, nama, atau email kosong.`);
      continue;
    }

    for (const stage of stages) {
      const status = String(row[stage.statusCol] || '').trim().toLowerCase();
      const sentTimestamp = String(row[stage.timestampCol] || '').trim();
      if (status !== 'fail' || sentTimestamp) continue;

      const safeName = escapeFailHtml_(candidateName);
      const safeJobTitle = escapeFailHtml_(jobTitle || 'the applied position');
      const safeStage = escapeFailHtml_(stage.name);
      const subject = `Super Store Recruitment - ${stage.name} Stage Update | ${jobTitle || 'Candidate Update'}`;
      const htmlBody = `
        <div style="font-family:Arial,Helvetica,sans-serif;color:#263247;line-height:1.6;max-width:760px;margin:0 auto;">
          <div style="text-align:center;background:#1f6f9f;padding:22px 20px 24px;border-radius:12px 12px 0 0;">
            <img src="cid:logoImage" alt="Super Store Logo" style="display:block;background:#fff;max-width:150px;max-height:80px;margin:0 auto 14px;padding:8px;border-radius:8px;box-sizing:border-box;">
            <div style="color:#fff;font-size:12px;letter-spacing:1px;text-transform:uppercase;">Recruitment Update</div>
          </div>
          <div style="padding:28px 24px;">
            <p>Dear <strong>${safeName}</strong>,</p>
            <p>Thank you for your interest in the <strong>${safeJobTitle}</strong> position at Super Store and for the time you invested in our recruitment process.</p>
            <div style="padding:18px 20px;margin:22px 0;background:#fff4f2;border-left:5px solid #d64545;border-radius:10px;">
              <strong style="color:#b42318;font-size:18px;">Recruitment status update</strong>
              <div style="margin-top:6px;">After careful consideration, we are unable to continue your application beyond the <strong>${safeStage} Stage</strong> at this time.</div>
            </div>
            <p>We appreciate your effort and wish you every success in your future career. Please feel welcome to apply for other opportunities that match your experience.</p>
            <p>Best regards,<br><strong>Super Store Recruitment Team</strong></p>
          </div>
          <div style="padding:18px 24px;background:#f7f9fc;border-top:1px solid #e5eaf2;color:#68778c;font-size:12px;">Candidate Code: ${escapeFailHtml_(candidateCode)}</div>
        </div>`;

      try {
        GmailApp.sendEmail(email, subject, '', { htmlBody: htmlBody, inlineImages: { logoImage: logoBlob } });
        recruitmentSheet.getRange(rowNumber, stage.timestampCol + 1).setValue(new Date());
        sentCount++;
        Logger.log(`[SUCCESS ROW ${rowNumber}] Fail notification ${stage.name} terkirim ke ${email}.`);
      } catch (error) {
        Logger.log(`[ERROR ROW ${rowNumber}] Gagal mengirim fail notification ${stage.name}: ${error.message}`);
      }
    }
  }

  Logger.log(`[END] sendFailNotifications selesai. Total email: ${sentCount}.`);
}

function escapeFailHtml_(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

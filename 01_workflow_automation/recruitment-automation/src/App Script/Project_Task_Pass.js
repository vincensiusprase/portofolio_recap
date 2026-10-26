/**
 * Mengirim email kepada kandidat yang lolos Project Task dan mengundang mereka
 * untuk memilih jadwal Online Interview.
 *
 * Syarat pengiriman:
 * - Kolom J = "Pass"
 * - Kolom G berisi email
 * - Kolom I sudah terisi (timestamp) --- artinya sudah pass Screening
 * - Kolom K belum memiliki timestamp pengiriman Project Task Pass (artinya belum pernah dikirim sebelumnya)
 */
function sendPJTaskPass() {
  Logger.log('[START] sendPJTaskPass dimulai. Waktu: ' + new Date());

  const appFormSheetName = 'Recruitment';
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const appFormSheet = spreadsheet.getSheetByName(appFormSheetName);

  if (!appFormSheet) {
    Logger.log(`[ERROR] Sheet '${appFormSheetName}' tidak ditemukan.`);
    return;
  }

  const values = appFormSheet.getDataRange().getValues();
  Logger.log(`[INFO] Sheet ${appFormSheetName}: ${values.length} baris.`);

  // Indeks array dimulai dari 0.
  const codeCol = 0;       // Kolom A: Candidate Code
  const nameCol = 2;       // Kolom C: Nama Lengkap
  const emailCol = 6;      // Kolom G: Email
  const jobTitleCol = 3;   // Kolom D: Jabatan Yang Dilamar
  const passCol = 9;       // Kolom J: Status Project Task
  const timestampCol = 10; // Kolom K: Timestamp Pengiriman
  const logoFileId = '1RTWzb8DwoAXnbV6f4EtSnk_IpiVppjeu';

  // Link Google Calendar untuk pemilihan jadwal interview.
  const calendarInvitationUrl = 'https://calendar.app.google/oda8LbJHNWmpsYvk8';

  const escapeHtml = (value) => String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

  let logoBlob;
  try {
    const logoFile = DriveApp.getFileById(logoFileId);
    logoBlob = logoFile.getBlob();
    Logger.log(`[INFO] Logo berhasil diakses: ${logoFile.getName()}.`);
  } catch (error) {
    Logger.log(`[ERROR] Logo gagal diakses. File ID: ${logoFileId}. Error: ${error.message}`);
    Logger.log(error.stack || error);
    return;
  }

  for (let i = 1; i < values.length; i++) {
    const row = values[i];
    const candidateCode = row[codeCol];
    const namaLengkap = row[nameCol];
    const emailTujuan = row[emailCol];
    const jobTitle = row[jobTitleCol];
    const status = String(row[passCol] || '').trim().toLowerCase();
    const sentTimestamp = row[timestampCol];

    Logger.log(`[ROW ${i + 1}] Kandidat="${namaLengkap}", email="${emailTujuan}", status="${status}", timestamp="${sentTimestamp}".`);

    if (status !== 'pass' || !emailTujuan || sentTimestamp) {
      const reason = status !== 'pass'
        ? `status kolom J bukan Pass (nilai: "${status}")`
        : !emailTujuan
          ? 'email kolom G kosong'
          : `kolom K sudah memiliki timestamp (${sentTimestamp})`;
      Logger.log(`[SKIP ROW ${i + 1}] ${reason}.`);
      continue;
    }

    const safeName = escapeHtml(namaLengkap);
    const safeJobTitle = escapeHtml(jobTitle);
    const safeCandidateCode = escapeHtml(candidateCode);
    const subject = `Super Store Recruitment - Online Interview Invitation | ${jobTitle}`;

    const htmlBody = `
      <div style="margin:0;padding:32px 12px;background:#f4f7fb;font-family:Arial,Helvetica,sans-serif;color:#263247;line-height:1.6;">
        <div style="max-width:760px;margin:0 auto;background:#fff;border:1px solid #e5eaf2;border-radius:18px;overflow:hidden;box-shadow:0 8px 24px rgba(28,48,82,.08);">
          <div style="padding:30px 32px;text-align:center;background:linear-gradient(135deg,#123b63,#1f78a8);">
            <img src="cid:logoImage" alt="Super Store" style="max-width:170px;max-height:72px;object-fit:contain;background:#fff;border-radius:10px;padding:8px;">
            <div style="margin-top:16px;color:#dcefff;font-size:13px;letter-spacing:1.5px;text-transform:uppercase;">Interview Invitation</div>
          </div>
          <div style="padding:32px;">
            <p style="margin:0 0 18px;font-size:16px;">Dear <strong>${safeName}</strong>,</p>
            <div style="padding:18px 20px;margin-bottom:24px;background:#eef8f4;border-left:5px solid #22a06b;border-radius:10px;">
              <div style="font-size:20px;font-weight:700;color:#147a4c;">Congratulations!</div>
              <div style="margin-top:4px;">You have successfully passed the <strong>Project Task Stage</strong> for the <strong>${safeJobTitle}</strong> position.</div>
            </div>
            <p>We are pleased to invite you to the next stage: an <strong>Online Interview</strong> with the Super Store Recruitment Team.</p>
            <div style="padding:18px 20px;margin:24px 0;background:#fff8e8;border-radius:12px;">
              <strong style="color:#8a5a00;">Choose your interview schedule</strong>
              <p style="margin:6px 0 0;">Please open the link below and choose one of the available interview schedules.</p>
            </div>
            <p style="text-align:center;margin:24px 0;"><a href="${calendarInvitationUrl}" style="display:inline-block;padding:14px 22px;background:#126da0;color:#fff;border-radius:9px;text-decoration:none;font-weight:700;">View Available Interview Schedules</a></p>
            <div style="padding:16px 20px;margin:24px 0;background:#f7f9fc;border-radius:10px;">
              <strong>Interview details</strong>
              <ul style="margin:8px 0 0;padding-left:22px;">
                <li>Format: Online Interview</li>
                <li>Duration: Approximately 30 minutes</li>
                <li>Candidate Code: <strong>${safeCandidateCode}</strong></li>
                <li>Please select an available interview schedule through the calendar link.</li>
              </ul>
            </div>
            <p>After choosing a schedule, please confirm your selected slot by replying to this email or contacting <strong>recruitment@superstore.com</strong>.</p>
            <p style="margin-top:28px;">Best regards,<br><strong>Super Store Recruitment Team</strong></p>
          </div>
          <div style="padding:18px 32px;background:#f7f9fc;border-top:1px solid #e5eaf2;color:#68778c;font-size:12px;">
            Official information is sent only from <strong>recruitment@superstore.com</strong>. Please report any suspicious communication immediately.
          </div>
        </div>
      </div>`;

    try {
      GmailApp.sendEmail(emailTujuan, subject, '', {
        htmlBody: htmlBody,
        inlineImages: { logoImage: logoBlob }
      });

      appFormSheet.getRange(i + 1, timestampCol + 1).setValue(new Date());
      Logger.log(`[SUCCESS ROW ${i + 1}] Interview invitation berhasil dikirim ke ${emailTujuan}.`);
    } catch (error) {
      Logger.log(`[ERROR ROW ${i + 1}] Gagal mengirim email ke ${emailTujuan}. Error: ${error.message}`);
      Logger.log(error.stack || error);
    }
  }

  Logger.log('[END] sendPJTaskPass selesai.');
}

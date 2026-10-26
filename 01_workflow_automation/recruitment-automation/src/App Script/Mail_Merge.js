function createOfferingLetter() {
  var spSheet = SpreadsheetApp.getActiveSpreadsheet();
  var offSheet = spSheet.getSheetByName("Offering");
  var offeringDetailsFolder = DriveApp.getFolderById("1jDC58ZLaWXXQpYE0xBszSDHy0XbmRdwr");
  var offeringTemplate = DriveApp.getFileById("1ZSXQCjPExHpqDmjpFufrk-NJ2TczfVbzh7Ivu2f3AVI");
  
  var totalRows = offSheet.getLastRow();
  
  // Loop through each row of the spreadsheet, starting from the second row
  for(var rowNo = 2; rowNo <= totalRows; rowNo++){
    // Check if column H is empty. If so, skip the row.
    var status = offSheet.getRange("H" + rowNo).getDisplayValue();
    if (status === "") {
      continue;
    }

    // Get the link column (L) to check if the PDF has already been created.
    var linkCell = offSheet.getRange("L" + rowNo);

    // If the link column is not empty, skip the row to avoid duplicates.
    if (linkCell.getDisplayValue() !== "") {
      continue;
    }

    // Get values from the spreadsheet
    var nomorOL = offSheet.getRange("D" + rowNo).getDisplayValue();
    var suratDibuat = offSheet.getRange("E" + rowNo).getDisplayValue();
    var namakandidat = offSheet.getRange("B" + rowNo).getDisplayValue();
    var jabatanDilamar = offSheet.getRange("C" + rowNo).getDisplayValue();
    var tglmulai = offSheet.getRange("F" + rowNo).getDisplayValue();
    var jabatanatasan = offSheet.getRange("G" + rowNo).getDisplayValue();
    var gajipokok = offSheet.getRange("H" + rowNo).getDisplayValue();
    var tjtetap = offSheet.getRange("I" + rowNo).getDisplayValue();
    var tjtrans = offSheet.getRange("J" + rowNo).getDisplayValue();
    var tjmakan = offSheet.getRange("K" + rowNo).getDisplayValue();
    
    // Make a copy of the template file
    var rawOffFile = offeringTemplate.makeCopy(offeringDetailsFolder);
    var rawFile = DocumentApp.openById(rawOffFile.getId());
    var rawFileContent = rawFile.getBody();
    
    // Replace placeholders with data from the spreadsheet
    rawFileContent.replaceText("No_OL_XX", nomorOL);
    rawFileContent.replaceText("Tanggal_OL_XX", suratDibuat);
    rawFileContent.replaceText("Nama_OL_XX", namakandidat);
    rawFileContent.replaceText("Jabatan_OL_XX", jabatanDilamar);
    rawFileContent.replaceText("Tanggal_Mulai_XX", tglmulai);
    rawFileContent.replaceText("Jabatan_Atasan_XX", jabatanatasan);
    rawFileContent.replaceText("Gaji_Pokok_XX", gajipokok);
    rawFileContent.replaceText("TJ_Tetap_XX", tjtetap);
    rawFileContent.replaceText("TJ_Trans_XX", tjtrans);
    rawFileContent.replaceText("TJ_Makan_XX", tjmakan);
    
    // Save the document and convert it to a PDF
    rawFile.saveAndClose();
    var offSlip = rawFile.getAs(MimeType.PDF);
    
    // Create the PDF file in the specified folder with a descriptive name
    var offeringPDF = offeringDetailsFolder.createFile(offSlip).setName("Offering_" + namakandidat + "_" + nomorOL);
    
    // Add the URL of the PDF file to column L
    linkCell.setValue(offeringPDF.getUrl());
    
    // Delete the temporary Google Docs file that was created from the template
    DriveApp.getFileById(rawOffFile.getId()).setTrashed(true);
  }
}
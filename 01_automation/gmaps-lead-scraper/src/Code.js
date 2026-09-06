// Render tampilan Web App
function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index')
      .setTitle('B2B Leads Scraper UI - Advanced')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// Fungsi 1: Ambil Masterdata Lokasi dari Google Sheets
function getMasterLocations() {
  try {
    const spreadsheetId = '1_KgZFn_FdJMuWrmzX0U37-PBDBrEW2JnSng5qcjykrU'; // ID Sheet Anda
    const masterSheetName = 'Masterdata';
    const ss = SpreadsheetApp.openById(spreadsheetId);
    const masterSheet = ss.getSheetByName(masterSheetName);
    
    // Ambil range lokasi (misal A2:A, atau disesuaikan)
    const locationData = masterSheet.getRange('A2:A').getValues();
    const locations = locationData.map(row => row[0]).filter(val => val !== '');
    
    return locations;
  } catch (e) {
    throw new Error("Gagal mengambil Masterdata lokasi: " + e.message);
  }
}

// Fungsi 2: Jalankan Scraping dengan Parameter Dinamis dari UI
function startWebScraping(payload) {
  const apiKey = PropertiesService.getScriptProperties().getProperty('GOOGLE_PLACES_API_KEY');
  const spreadsheetId = '1_KgZFn_FdJMuWrmzX0U37-PBDBrEW2JnSng5qcjykrU';
  const targetSheetName = 'Scraping';
  
  if (!apiKey) throw new Error("API Key tidak ditemukan di Script Properties!");

  const ss = SpreadsheetApp.openById(spreadsheetId);
  let sheet = ss.getSheetByName(targetSheetName);
  if (!sheet) {
    sheet = ss.insertSheet(targetSheetName);
    sheet.appendRow([
      'Place ID', 'Name', 'Address', 'Phone Number', 'Opening Hours',
      'Website', 'Rating', 'Reviews Count', 'Types',
      'Latitude', 'Longitude', 'Business Status', 'Query Used', 'Location Used'
    ]);
  }

  // Set memori duplikat
  let existingPlaceIds = new Set();
  const lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    const existingData = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
    existingData.forEach(row => { if (row[0]) existingPlaceIds.add(row[0].toString().trim()); });
  }

  let totalNewPlaces = 0;
  const cleanText = (text) => text ? text.toString().replace(/[\n\r]+/g, ' ').replace(/"/g, "'") : 'Not available';

  // Looping Lokasi & Query dari Web App
  for (const location of payload.locations) {
    let locationKeyword = location.toLowerCase().replace(/kecamatan|kec\.|kec /g, "").split(",")[0].trim();

    for (const query of payload.queries) {
      let url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}+in+${encodeURIComponent(location)}&key=${apiKey}`;
      let resultsFetched = 0;

      while (url && resultsFetched < payload.limit) {
        try {
          const response = UrlFetchApp.fetch(url);
          const data = JSON.parse(response.getContentText());

          if (data.status === 'OK') {
            for (const place of data.results) {
              if (resultsFetched >= payload.limit) break;

              const placeId = place.place_id ? place.place_id.toString().trim() : "";
              if (existingPlaceIds.has(placeId)) continue; // SKIP DUPLIKAT

              // Normalisasi Alamat
              let addressStr = (place.formatted_address || "").toLowerCase()
                .replace(/\bbar\b\.?/g, 'barat').replace(/\bsel\b\.?/g, 'selatan')
                .replace(/\btim\b\.?/g, 'timur').replace(/\but\b\.?/g, 'utara');

              let locationWords = locationKeyword.split(/\s+/).filter(word => word.length > 2);
              if (!locationWords.every(word => addressStr.includes(word))) continue; // NYASAR

              // FILTER DINAMIS DARI WEB APP
              let placeNameLower = (place.name || "").toLowerCase();
              let placeTypesStr = (place.types || []).join(",").toLowerCase();

              // 1. Blacklist Nama Check
              let isBadName = payload.blacklistNames.some(badWord => badWord && placeNameLower.includes(badWord));
              if (isBadName) continue;

              // 2. Whitelist vs Bad Types
              let isGoodName = payload.whitelistNames.some(goodWord => goodWord && placeNameLower.includes(goodWord));
              let isBadType = payload.badTypes.some(badType => badType && placeTypesStr.includes(badType));

              if (isBadType && !isGoodName) continue;

              // Tarik Place Details (Field Masked)
              const fields = 'place_id,name,formatted_address,formatted_phone_number,opening_hours,website,rating,user_ratings_total,types,geometry,business_status';
              const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=${fields}&key=${apiKey}`;
              
              const detailsResponse = UrlFetchApp.fetch(detailsUrl);
              const detailsData = JSON.parse(detailsResponse.getContentText());

              if (detailsData.status === 'OK' && detailsData.result) {
                const res = detailsData.result;
                sheet.appendRow([
                  placeId, cleanText(res.name), cleanText(res.formatted_address),
                  cleanText(res.formatted_phone_number),
                  res.opening_hours ? cleanText(res.opening_hours.weekday_text.join(', ')) : 'Not available',
                  res.website || 'Not available', res.rating || 'Not available',
                  res.user_ratings_total || 0,
                  res.types ? res.types.map(t => t.replace(/_/g, ' ').toUpperCase()).join(', ') : 'Not available',
                  res.geometry?.location?.lat || 'Not available',
                  res.geometry?.location?.lng || 'Not available',
                  place.business_status || 'Not available', query, location
                ]);

                resultsFetched++;
                totalNewPlaces++;
                existingPlaceIds.add(placeId);
              }
            }
            url = (data.next_page_token && resultsFetched < payload.limit) ? 
                  `https://maps.googleapis.com/maps/api/place/textsearch/json?pagetoken=${data.next_page_token}&key=${apiKey}` : null;
            if (url) Utilities.sleep(2000);
          } else { url = null; }
        } catch (e) { url = null; }
      }
    }
  }

  return { status: 'SUCCESS', totalNewPlaces: totalNewPlaces };
}
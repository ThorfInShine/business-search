// Google Sheets API dengan parameter dinamis

// Default values untuk spreadsheet yang akan digunakan
export const DEFAULT_SPREADSHEET_ID = '1GlSR2ISC-B75n5Fml59-9f-bzjj4Ks5r';
export const DEFAULT_SHEET_ID = '2121251766';

// Method 1: Menggunakan Google Sheets sebagai JSON (Public access)
export const fetchGoogleSheetsDataPublic = async (spreadsheetId, sheetId = '0') => {
  try {
    // URL untuk mengakses Google Sheets sebagai JSON
    const url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:json&gid=${sheetId}`;
    
    console.log('Fetching data from Google Sheets:', url);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      if (response.status === 400) {
        throw new Error('Spreadsheet tidak ditemukan atau tidak dapat diakses. Pastikan link benar dan spreadsheet dapat diakses publik.');
      } else if (response.status === 403) {
        throw new Error('Akses ditolak. Pastikan spreadsheet dapat diakses oleh "Anyone with the link".');
      } else {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    }
    
    const text = await response.text();
    
    // Check if response is valid
    if (!text.includes('google.visualization.Query.setResponse')) {
      throw new Error('Response tidak valid dari Google Sheets. Pastikan spreadsheet dapat diakses publik.');
    }
    
    console.log('Raw response length:', text.length);
    
    // Parse Google's JSON response (mereka wrap dengan function call)
    const jsonString = text.substring(47).slice(0, -2);
    const data = JSON.parse(jsonString);
    
    if (!data.table) {
      throw new Error('Spreadsheet kosong atau tidak memiliki data');
    }
    
    if (!data.table.rows || data.table.rows.length === 0) {
      throw new Error('Sheet tidak memiliki data atau sheet ID salah');
    }
    
    // Convert to usable format
    const headers = data.table.cols.map((col, index) => {
      return col.label || col.id || `Column_${index + 1}`;
    });
    
    console.log('Headers found:', headers);
    
    const rows = data.table.rows.map((row, rowIndex) => {
      const rowData = {};
      headers.forEach((header, index) => {
        const cell = row.c[index];
        rowData[header] = cell ? (cell.v !== null ? String(cell.v) : '') : '';
      });
      return rowData;
    });
    
    // Filter out empty rows
    const filteredRows = rows.filter(row => {
      return Object.values(row).some(value => value && value.toString().trim() !== '');
    });
    
    console.log(`Successfully fetched ${filteredRows.length} rows from Google Sheets`);
    console.log('Sample data:', filteredRows.slice(0, 2));
    
    return filteredRows;
  } catch (error) {
    console.error('Error fetching Google Sheets data:', error);
    throw error;
  }
};

// Fungsi dengan cache busting yang kompatibel dengan CORS
export const fetchGoogleSheetsDataWithCacheBust = async (spreadsheetId, sheetId = '0', timestamp) => {
  try {
    // Gunakan parameter URL untuk cache busting saja, tanpa custom headers
    const cacheBustParam = `&cb=${timestamp}&_=${Date.now()}&rand=${Math.random().toString(36).substring(7)}`;
    const url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:json&gid=${sheetId}${cacheBustParam}`;
    
    console.log('🔄 Fetching with cache bust URL:', url);
    
    // Gunakan fetch tanpa custom headers yang bermasalah
    const response = await fetch(url, {
      method: 'GET',
      // Hapus headers yang menyebabkan CORS error
      mode: 'cors'
    });
    
    if (!response.ok) {
      if (response.status === 400) {
        throw new Error('Spreadsheet tidak ditemukan atau tidak dapat diakses. Pastikan link benar dan spreadsheet dapat diakses publik.');
      } else if (response.status === 403) {
        throw new Error('Akses ditolak. Pastikan spreadsheet dapat diakses oleh "Anyone with the link".');
      } else {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    }
    
    const text = await response.text();
    
    // Check if response is valid
    if (!text.includes('google.visualization.Query.setResponse')) {
      throw new Error('Response tidak valid dari Google Sheets. Pastikan spreadsheet dapat diakses publik.');
    }
    
    console.log('📊 Fresh data received, length:', text.length);
    
    // Parse Google's JSON response
    const jsonString = text.substring(47).slice(0, -2);
    const data = JSON.parse(jsonString);
    
    if (!data.table || !data.table.rows || data.table.rows.length === 0) {
      throw new Error('Sheet tidak memiliki data atau sheet ID salah');
    }
    
    // Convert to usable format
    const headers = data.table.cols.map((col, index) => {
      return col.label || col.id || `Column_${index + 1}`;
    });
    
    const rows = data.table.rows.map((row, rowIndex) => {
      const rowData = {};
      headers.forEach((header, index) => {
        const cell = row.c[index];
        rowData[header] = cell ? (cell.v !== null ? String(cell.v) : '') : '';
      });
      return rowData;
    });
    
    // Filter out empty rows
    const filteredRows = rows.filter(row => {
      return Object.values(row).some(value => value && value.toString().trim() !== '');
    });
    
    console.log(`✅ Successfully fetched ${filteredRows.length} fresh rows from Google Sheets`);
    
    return filteredRows;
  } catch (error) {
    console.error('❌ Error fetching fresh Google Sheets data:', error);
    throw error;
  }
};

// Method 2: Menggunakan CSV export (fallback)
export const fetchGoogleSheetsAsCSV = async (spreadsheetId, sheetId = '0') => {
  try {
    const csvUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&gid=${sheetId}`;
    
    console.log('Fetching CSV from Google Sheets:', csvUrl);
    
    const response = await fetch(csvUrl);
    
    if (!response.ok) {
      if (response.status === 400) {
        throw new Error('Spreadsheet tidak ditemukan atau sheet ID salah');
      } else if (response.status === 403) {
        throw new Error('Akses ditolak. Pastikan spreadsheet dapat diakses publik');
      } else {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    }
    
    const csvText = await response.text();
    
    if (!csvText || csvText.trim() === '') {
      throw new Error('Spreadsheet kosong atau tidak memiliki data');
    }
    
    console.log('CSV data length:', csvText.length);
    
    return csvText;
  } catch (error) {
    console.error('Error fetching CSV from Google Sheets:', error);
    throw error;
  }
};

// Method 3: CSV export dengan cache busting
export const fetchGoogleSheetsAsCSVWithCacheBust = async (spreadsheetId, sheetId = '0', timestamp) => {
  try {
    const cacheBustParam = `&cb=${timestamp}&_=${Date.now()}&rand=${Math.random().toString(36).substring(7)}`;
    const csvUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&gid=${sheetId}${cacheBustParam}`;
    
    console.log('🔄 Fetching CSV with cache bust:', csvUrl);
    
    const response = await fetch(csvUrl, {
      method: 'GET',
      mode: 'cors'
    });
    
    if (!response.ok) {
      if (response.status === 400) {
        throw new Error('Spreadsheet tidak ditemukan atau sheet ID salah');
      } else if (response.status === 403) {
        throw new Error('Akses ditolak. Pastikan spreadsheet dapat diakses publik');
      } else {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    }
    
    const csvText = await response.text();
    
    if (!csvText || csvText.trim() === '') {
      throw new Error('Spreadsheet kosong atau tidak memiliki data');
    }
    
    console.log('📊 Fresh CSV data length:', csvText.length);
    
    return csvText;
  } catch (error) {
    console.error('❌ Error fetching CSV with cache bust:', error);
    throw error;
  }
};

// Main function dengan parameter dinamis
export const fetchGoogleSheetsData = async (spreadsheetId, sheetId = '0') => {
  // Coba method public JSON dulu
  try {
    console.log(`Trying Google Sheets JSON API for ${spreadsheetId}...`);
    return await fetchGoogleSheetsDataPublic(spreadsheetId, sheetId);
  } catch (error) {
    console.warn('Google Sheets JSON API failed:', error.message);
    
    // Fallback ke CSV export
    try {
      console.log('Trying Google Sheets CSV export...');
      const csvText = await fetchGoogleSheetsAsCSV(spreadsheetId, sheetId);
      
      // Parse CSV manually
      const lines = csvText.split('\n').filter(line => line.trim());
      
      if (lines.length === 0) {
        throw new Error('CSV kosong');
      }
      
      const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
      
      const rows = lines.slice(1)
        .map(line => {
          const values = [];
          let current = '';
          let inQuotes = false;
          
          // Simple CSV parser yang handle quotes
          for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
              inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
              values.push(current.trim());
              current = '';
            } else {
              current += char;
            }
          }
          values.push(current.trim()); // Add last value
          
          const rowData = {};
          headers.forEach((header, index) => {
            rowData[header] = values[index] ? values[index].replace(/"/g, '') : '';
          });
          return rowData;
        })
        .filter(row => {
          return Object.values(row).some(value => value && value.toString().trim() !== '');
        });
      
      console.log(`Successfully parsed ${rows.length} rows from CSV`);
      return rows;
      
    } catch (csvError) {
      console.error('CSV export also failed:', csvError.message);
      throw new Error(`Gagal mengakses spreadsheet: ${csvError.message}`);
    }
  }
};
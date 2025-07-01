// File: services/sheetsUpdateService.js

// Fungsi untuk update Google Sheets menggunakan Google Apps Script Web App
export const updateGoogleSheets = async (spreadsheetId, sheetId, businessId, updates) => {
  try {
    console.log('Attempting to update Google Sheets:', {
      spreadsheetId,
      sheetId,
      businessId,
      updates
    });

    // URL Google Apps Script Web App yang akan kita buat
    const webAppUrl = 'https://script.google.com/macros/s/AKfycbwCNBz4BEqjH3k0QqoRR0OHpXIwmfJfxYBR__OFJMH5cxH9oWh6A6sCL1eCoS7cLzUEDw/exec';
    
    const payload = {
      action: 'updateStatus',
      spreadsheetId: spreadsheetId,
      sheetId: sheetId,
      businessId: businessId,
      updates: updates
    };

    console.log('Sending payload:', payload);

    const response = await fetch(webAppUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      mode: 'cors' // Tambahkan ini untuk CORS
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Response error text:', errorText);
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }

    const responseText = await response.text();
    console.log('Response text:', responseText);

    let result;
    try {
      result = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse response as JSON:', parseError);
      throw new Error('Invalid response format from server');
    }
    
    console.log('Parsed result:', result);
    
    if (!result.success) {
      throw new Error(result.error || 'Gagal mengupdate spreadsheet');
    }

    return result;
  } catch (error) {
    console.error('Error updating Google Sheets:', error);
    
    // Berikan pesan error yang lebih detail
    if (error.message.includes('CORS')) {
      throw new Error('CORS error: Pastikan Google Apps Script sudah di-deploy sebagai Web App dengan akses "Anyone"');
    } else if (error.message.includes('404')) {
      throw new Error('Web App tidak ditemukan. Pastikan URL Google Apps Script benar');
    } else if (error.message.includes('403')) {
      throw new Error('Akses ditolak. Pastikan Google Apps Script memiliki permission yang benar');
    }
    
    throw error;
  }
};

// Fungsi alternatif untuk update lokal (jika tidak bisa update spreadsheet)
export const updateLocalData = (businesses, businessId, updates) => {
  return businesses.map(business => {
    if (business.id === businessId) {
      return {
        ...business,
        ...updates,
        lastUpdated: new Date().toISOString()
      };
    }
    return business;
  });
};

// Fungsi untuk menyimpan perubahan ke localStorage sebagai backup
export const saveToLocalStorage = (businesses) => {
  try {
    const dataToSave = {
      businesses: businesses,
      lastSaved: new Date().toISOString()
    };
    localStorage.setItem('businessUpdates', JSON.stringify(dataToSave));
    console.log('Data saved to localStorage');
  } catch (error) {
    console.warn('Failed to save to localStorage:', error);
  }
};

// Fungsi untuk mengambil perubahan dari localStorage
export const loadFromLocalStorage = () => {
  try {
    const saved = localStorage.getItem('businessUpdates');
    if (saved) {
      const data = JSON.parse(saved);
      console.log('Loaded data from localStorage:', data.lastSaved);
      return data;
    }
  } catch (error) {
    console.warn('Failed to load from localStorage:', error);
  }
  return null;
};

// Fungsi untuk mengecek koneksi ke Google Apps Script
export const testGoogleSheetsConnection = async () => {
  try {
    const webAppUrl = 'https://script.google.com/macros/s/AKfycbwCNBz4BEqjH3k0QqoRR0OHpXIwmfJfxYBR__OFJMH5cxH9oWh6A6sCL1eCoS7cLzUEDw/exec';
    
    const response = await fetch(webAppUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action: 'test' }),
      mode: 'cors'
    });

    const result = await response.text();
    console.log('Connection test result:', result);
    return true;
  } catch (error) {
    console.error('Connection test failed:', error);
    return false;
  }
};
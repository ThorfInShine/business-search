import Papa from 'papaparse';
import { CSV_CONFIG } from '../config/csvConfig';
import { 
  fetchGoogleSheetsData, 
  DEFAULT_SPREADSHEET_ID, 
  DEFAULT_SHEET_ID 
} from './googleSheetsAPI';

// Fungsi untuk fetch data dari Google Sheets API dengan parameter
export const fetchCSVData = async (spreadsheetId = null, sheetId = null) => {
  try {
    // Gunakan default jika tidak ada parameter
    const finalSpreadsheetId = spreadsheetId || DEFAULT_SPREADSHEET_ID;
    const finalSheetId = sheetId || DEFAULT_SHEET_ID;
    
    console.log('Attempting to fetch data from Google Sheets...', {
      spreadsheetId: finalSpreadsheetId,
      sheetId: finalSheetId
    });
    
    // Coba gunakan Google Sheets API
    const data = await fetchGoogleSheetsData(finalSpreadsheetId, finalSheetId);
    
    if (data && data.length > 0) {
      console.log('Successfully fetched data from Google Sheets API');
      return data;
    } else {
      throw new Error('No data returned from Google Sheets');
    }
    
  } catch (error) {
    console.error('Error dengan Google Sheets API:', error);
    
    // Jika menggunakan custom spreadsheet, jangan fallback ke CSV lama
    if (spreadsheetId && spreadsheetId !== DEFAULT_SPREADSHEET_ID) {
      throw error; // Re-throw error untuk custom spreadsheet
    }
    
    // Fallback ke method lama hanya untuk default spreadsheet
    try {
      console.log('Trying fallback CSV method...');
      const response = await fetch(CSV_CONFIG.CSV_URL);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const csvText = await response.text();
      console.log('Raw CSV text length:', csvText.length);
      
      return new Promise((resolve, reject) => {
        Papa.parse(csvText, {
          ...CSV_CONFIG.PARSE_CONFIG,
          complete: (results) => {
            console.log('Papa Parse results:', results.data.length, 'rows');
            if (results.errors.length > 0) {
              console.warn('CSV parsing warnings:', results.errors);
            }
            resolve(results.data);
          },
          error: (error) => {
            console.error('Papa Parse error:', error);
            reject(error);
          }
        });
      });
    } catch (csvError) {
      console.error('Error fetching CSV:', csvError);
      throw new Error(`Gagal mengambil data: ${error.message}`);
    }
  }
};

// Fungsi untuk parse file CSV yang di-upload (tetap sama)
export const parseUploadedCSV = (file) => {
  return new Promise((resolve, reject) => {
    console.log('Parsing uploaded file:', file.name, file.size, file.type);
    
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      encoding: 'UTF-8',
      complete: (results) => {
        console.log('Upload Parse results:', results.data.length, 'rows');
        if (results.errors.length > 0) {
          console.warn('CSV parsing warnings:', results.errors);
        }
        resolve(results.data);
      },
      error: (error) => {
        console.error('Upload Parse error:', error);
        reject(error);
      }
    });
  });
};
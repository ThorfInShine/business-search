import React, { useState } from 'react';

const SpreadsheetUrlInput = ({ onUrlSubmit, loading }) => {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');

  // Fungsi untuk extract spreadsheet ID dan sheet ID dari URL
  const parseSpreadsheetUrl = (url) => {
    try {
      // Pattern untuk berbagai format URL Google Sheets
      const patterns = [
        // Format: https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit#gid=SHEET_ID
        /\/spreadsheets\/d\/([a-zA-Z0-9-_]+).*[#&]gid=([0-9]+)/,
        // Format: https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit
        /\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/,
        // Format dengan /edit?usp=sharing
        /\/spreadsheets\/d\/([a-zA-Z0-9-_]+)\/edit/
      ];

      for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) {
          const spreadsheetId = match[1];
          const sheetId = match[2] || '0'; // Default ke sheet pertama jika tidak ada gid
          return { spreadsheetId, sheetId };
        }
      }

      throw new Error('Format URL tidak valid');
    } catch (error) {
      throw new Error('URL Google Sheets tidak valid');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!url.trim()) {
      setError('Silakan masukkan URL spreadsheet');
      return;
    }

    if (!url.includes('docs.google.com/spreadsheets')) {
      setError('URL harus berupa link Google Sheets yang valid');
      return;
    }

    try {
      const { spreadsheetId, sheetId } = parseSpreadsheetUrl(url);
      console.log('Parsed spreadsheet:', { spreadsheetId, sheetId });
      onUrlSubmit(spreadsheetId, sheetId);
    } catch (error) {
      setError(error.message);
    }
  };

  const handleInputChange = (e) => {
    setUrl(e.target.value);
    if (error) setError(''); // Clear error saat user mulai mengetik
  };

  // Contoh URL untuk membantu user
  const exampleUrl = "https://docs.google.com/spreadsheets/d/1naNH3b2tlE9A57hX_osidJEsP1nFfBeY/edit#gid=2121251766";

  return (
    <div className="spreadsheet-url-input">
      <h4>🔗 MASUKKAN LINK SPREADSHEET</h4>
      <p className="url-description">
        Masukkan URL Google Sheets yang ingin Anda gunakan sebagai sumber data
      </p>
      
      <form onSubmit={handleSubmit} className="url-form">
        <div className="url-input-wrapper">
          <input
            type="url"
            value={url}
            onChange={handleInputChange}
            placeholder="https://docs.google.com/spreadsheets/d/..."
            className={`url-input ${error ? 'error' : ''}`}
            disabled={loading}
          />
          <button 
            type="submit" 
            className="url-submit-btn"
            disabled={loading || !url.trim()}
          >
            {loading ? '⏳' : '🚀'} 
            <span>{loading ? 'MEMUAT...' : 'HUBUNGKAN'}</span>
          </button>
        </div>
        
        {error && (
          <div className="url-error">
            ⚠️ {error}
          </div>
        )}
      </form>

      <div className="url-help">
        <details>
          <summary>💡 Cara mendapatkan link spreadsheet</summary>
          <div className="help-content">
            <ol>
              <li>Buka Google Sheets Anda</li>
              <li>Klik tombol <strong>"Share"</strong> di kanan atas</li>
              <li>Pilih <strong>"Anyone with the link"</strong></li>
              <li>Set permission ke <strong>"Viewer"</strong></li>
              <li>Klik <strong>"Copy link"</strong></li>
              <li>Paste link tersebut di form di atas</li>
            </ol>
            <div className="example-url">
              <strong>Contoh URL:</strong>
              <code>{exampleUrl}</code>
            </div>
          </div>
        </details>
      </div>
    </div>
  );
};

export default SpreadsheetUrlInput;
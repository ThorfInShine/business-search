// Konfigurasi untuk CSV
export const CSV_CONFIG = {
  // URL untuk mengakses CSV langsung dari Google Sheets
  CSV_URL: 'https://docs.google.com/spreadsheets/d/1GlSR2ISC-B75n5Fml59-9f-bzjj4Ks5r/export?format=csv&gid=2121251766',
  
  // Atau gunakan file lokal jika sudah di-download
  // CSV_URL: '/data/business-data.csv',
  
  // Konfigurasi Papa Parse
  PARSE_CONFIG: {
    header: true, // Gunakan baris pertama sebagai header
    skipEmptyLines: true,
    transformHeader: (header) => {
      // Transform header untuk konsistensi
      const headerMap = {
        'Nama Usaha': 'namaUsaha',
        'Alamat': 'alamat',
        'Kecamatan': 'kecamatan',
        'Nama Sales': 'nmsls',
        'NMSLS': 'nmsls',
        'PIC': 'nmsls',
        'Jenis Usaha': 'jenisUsaha',
        'No Telepon': 'noTelp',
        'No. Telepon': 'noTelp',
        'Telepon': 'noTelp',
        'Email': 'email',
        'Deskripsi': 'deskripsi',
        'Website': 'website',
        'Jam Operasional': 'jamOperasional',
        'Rating': 'rating'
      };
      
      return headerMap[header] || header.toLowerCase().replace(/\s+/g, '');
    }
  }
};
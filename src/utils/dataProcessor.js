// Fungsi untuk membersihkan dan memproses data CSV
export const processCSVData = (rawData) => {
  console.log('Processing raw data:', rawData);
  console.log('Raw data length:', rawData?.length);
  
  if (!rawData || rawData.length === 0) {
    console.log('No raw data to process');
    return [];
  }

  // Debug: lihat struktur data
  if (rawData.length > 0) {
    console.log('First row structure:', rawData[0]);
    console.log('Available keys:', Object.keys(rawData[0] || {}));
  }

  const processedData = rawData.map((row, index) => {
    // Debug untuk beberapa baris pertama
    if (index < 5) {
      console.log(`Row ${index} raw data:`, row);
    }

    // Ambil data nmsls untuk parsing alamat
    const nmslsRaw = getFieldValue(row, [
      'nmsls', 'Nama Sales', 'NMSLS', 'PIC', 'pic', 'sales', 'Sales', 'SALES',
      'Nama PIC', 'nama_pic', 'contact_person', 'Contact Person'
    ]);

    // Parse informasi alamat dari nmsls
    const parsedAddress = parseAddressFromNmsls(nmslsRaw);

    // Ambil status entri dengan lebih banyak variasi
    const statusEntriRaw = getFieldValue(row, [
      // Variasi umum
      'Status', 'status', 'STATUS', 
      'status_entri', 'Status Entri', 'STATUS_ENTRI',
      'entry_status', 'Entry Status', 'ENTRY_STATUS', 
      'kondisi', 'Kondisi', 'KONDISI',
      'keterangan_status', 'Keterangan Status', 'progress', 'Progress', 'PROGRESS',
      
      // Variasi spesifik yang mungkin ada
      'sudah_entri', 'Sudah Entri', 'SUDAH_ENTRI',
      'status_survey', 'Status Survey', 'STATUS_SURVEY',
      'keterangan', 'Keterangan', 'KETERANGAN',
      'completed', 'Completed', 'COMPLETED',
      'done', 'Done', 'DONE',
      
      // Kolom dengan nama yang mungkin tidak standar
      'col_status', 'Col_Status', 'COL_STATUS',
      'field_status', 'Field_Status', 'FIELD_STATUS',
      
      // Coba semua kolom yang mengandung kata 'status'
      ...Object.keys(row).filter(key => 
        key.toLowerCase().includes('status') || 
        key.toLowerCase().includes('entri') ||
        key.toLowerCase().includes('sudah') ||
        key.toLowerCase().includes('selesai')
      )
    ]);

    // Ambil nama petugas dengan lebih banyak variasi
    const namaPetugasRaw = getFieldValue(row, [
      // Variasi umum
      'Petugas', 'petugas', 'PETUGAS', 
      'nama_petugas', 'Nama Petugas', 'NAMA_PETUGAS',
      'enumerator', 'Enumerator', 'ENUMERATOR', 
      'surveyor', 'Surveyor', 'SURVEYOR',
      'operator', 'Operator', 'OPERATOR', 
      'pencatat', 'Pencatat', 'PENCATAT',
      'entry_by', 'Entry By', 'ENTRY_BY', 
      'created_by', 'Created By', 'CREATED_BY',
      'pic_entri', 'PIC Entri', 'PIC_ENTRI',
      
      // Variasi spesifik
      'nama_enumerator', 'Nama Enumerator', 'NAMA_ENUMERATOR',
      'nama_surveyor', 'Nama Surveyor', 'NAMA_SURVEYOR',
      'nama_operator', 'Nama Operator', 'NAMA_OPERATOR',
      'petugas_entri', 'Petugas Entri', 'PETUGAS_ENTRI',
      'user', 'User', 'USER',
      'username', 'Username', 'USERNAME',
      
      // Kolom dengan nama yang mungkin tidak standar
      'col_petugas', 'Col_Petugas', 'COL_PETUGAS',
      'field_petugas', 'Field_Petugas', 'FIELD_PETUGAS',
      
      // Coba semua kolom yang mengandung kata 'petugas' atau 'nama'
      ...Object.keys(row).filter(key => 
        key.toLowerCase().includes('petugas') || 
        key.toLowerCase().includes('enumerator') ||
        key.toLowerCase().includes('surveyor') ||
        key.toLowerCase().includes('operator') ||
        (key.toLowerCase().includes('nama') && !key.toLowerCase().includes('usaha'))
      )
    ]);

    // Debug untuk status dan petugas
    if (index < 5) {
      console.log(`Row ${index} - Status raw:`, statusEntriRaw);
      console.log(`Row ${index} - Petugas raw:`, namaPetugasRaw);
      console.log(`Row ${index} - Status cleaned:`, cleanStatusEntri(statusEntriRaw));
      console.log(`Row ${index} - Petugas cleaned:`, cleanString(namaPetugasRaw));
    }

    // Bersihkan data dan berikan default values untuk semua field
    const cleanData = {
      id: index + 1,
      
      // Informasi Dasar Usaha
      namaUsaha: cleanString(getFieldValue(row, [
        'NamaUsaha', 'namaUsaha', 'Nama Usaha', 'nama_usaha', 'nama usaha', 'NAMA_USAHA', 'NAMA USAHA'
      ])),
      
      // Lokasi - Gabungkan alamat asli dengan info dari nmsls
      alamat: cleanString(getFieldValue(row, [
        'Alamat', 'alamat', 'ALAMAT', 'address', 'Address', 'ADDRESS'
      ])),
      alamatLengkap: buildCompleteAddress(
        getFieldValue(row, ['Alamat', 'alamat', 'ALAMAT']),
        parsedAddress
      ),
      
      // Info alamat detail dari parsing nmsls
      rt: parsedAddress.rt,
      rw: parsedAddress.rw,
      dusun: parsedAddress.dusun,
      kodeWilayah: parsedAddress.kodeWilayah,
      
      propinsi: cleanString(getFieldValue(row, [
        'prop', 'Propinsi', 'propinsi', 'PROPINSI', 'province', 'Province'
      ])),
      kabupaten: cleanString(getFieldValue(row, [
        'kab', 'Kabupaten', 'kabupaten', 'KABUPATEN', 'regency', 'Regency'
      ])),
      kecamatan: cleanString(getFieldValue(row, [
        'kec', 'Kecamatan', 'kecamatan', 'KECAMATAN', 'district', 'District', 'DISTRICT'
      ])),
      desa: cleanString(getFieldValue(row, [
        'desa', 'Desa', 'DESA', 'village', 'Village', 'VILLAGE', 'kelurahan', 'Kelurahan'
      ])),
      
      // Kontak
      nmsls: cleanString(nmslsRaw),
      nmslsParsed: parsedAddress.cleanName, // Nama yang sudah dibersihkan dari kode
      noTelp: cleanPhone(getFieldValue(row, [
        'telpon_hp', 'NoTelp', 'noTelp', 'No Telepon', 'No. Telepon', 'Telepon', 'phone', 'Phone', 'PHONE',
        'no_telp', 'NO_TELP', 'telephone', 'Telephone', 'hp', 'HP'
      ])),
      
      // Koordinat
      latitude: cleanCoordinate(getFieldValue(row, [
        'latitude', 'Latitude', 'LATITUDE', 'lat', 'Lat', 'LAT'
      ])),
      longitude: cleanCoordinate(getFieldValue(row, [
        'longitude', 'Longitude', 'LONGITUDE', 'lng', 'Lng', 'LNG', 'lon', 'Lon'
      ])),
      
      // Informasi lainnya
      jenisUsaha: cleanString(getFieldValue(row, [
        'JenisUsaha', 'jenisUsaha', 'Jenis Usaha', 'jenis_usaha', 'kategori', 'Kategori', 'KATEGORI',
        'business_type', 'Business Type', 'type', 'Type'
      ])),
      
      // KBLI - Klasifikasi Baku Lapangan Usaha Indonesia
      kbli: cleanString(getFieldValue(row, [
        'KBLI', 'kbli', 'Kbli', 'kode_kbli', 'Kode KBLI', 'KODE_KBLI', 'kode kbli',
        'klasifikasi_usaha', 'Klasifikasi Usaha', 'business_classification', 'Business Classification'
      ])),
      
      // Field Kegiatan
      kegiatan: cleanString(getFieldValue(row, [
        'Kegiatan', 'kegiatan', 'KEGIATAN', 'aktivitas', 'Aktivitas', 'AKTIVITAS',
        'kegiatan_usaha', 'Kegiatan Usaha', 'KEGIATAN_USAHA', 'kegiatan usaha',
        'business_activity', 'Business Activity', 'activity', 'Activity', 'ACTIVITY',
        'layanan', 'Layanan', 'LAYANAN', 'service', 'Service', 'SERVICE',
        'produk', 'Produk', 'PRODUK', 'product', 'Product', 'PRODUCT',
        'bidang_usaha', 'Bidang Usaha', 'BIDANG_USAHA', 'bidang usaha'
      ])),
      
      // Status Entri dan Petugas - Gunakan nilai yang sudah diambil
      statusEntri: cleanStatusEntri(statusEntriRaw),
      namaPetugas: cleanString(namaPetugasRaw),
      
      email: cleanEmail(getFieldValue(row, [
        'Email', 'email', 'EMAIL', 'E-mail', 'e-mail', 'e_mail', 'E_MAIL'
      ])),
      website: cleanURL(getFieldValue(row, [
        'Website', 'website', 'WEBSITE', 'web', 'Web', 'WEB', 'url', 'URL'
      ])),
      jamOperasional: cleanString(getFieldValue(row, [
        'JamOperasional', 'jamOperasional', 'Jam Operasional', 'jam_operasional', 
        'operating_hours', 'Operating Hours', 'hours', 'Hours'
      ])),
      tahunBerdiri: cleanString(getFieldValue(row, [
        'TahunBerdiri', 'tahunBerdiri', 'Tahun Berdiri', 'tahun_berdiri', 
        'year_established', 'Year Established', 'established', 'Established'
      ])),
      jumlahKaryawan: cleanString(getFieldValue(row, [
        'JumlahKaryawan', 'jumlahKaryawan', 'Jumlah Karyawan', 'jumlah_karyawan', 
        'employees', 'Employees', 'staff', 'Staff'
      ])),
      omzet: cleanString(getFieldValue(row, [
        'omzet', 'Omzet', 'OMZET', 'revenue', 'Revenue', 'turnover', 'Turnover'
      ])),
      modal: cleanString(getFieldValue(row, [
        'modal', 'Modal', 'MODAL', 'capital', 'Capital', 'investment', 'Investment'
      ])),
      keuntungan: cleanString(getFieldValue(row, [
        'keuntungan', 'Keuntungan', 'KEUNTUNGAN', 'profit', 'Profit', 'laba', 'Laba'
      ])),
      kelompokUsaha: cleanString(getFieldValue(row, [
        'kelompok_usaha', 'Kelompok Usaha', 'kelompokUsaha', 'business_group', 'group'
      ])),
      statusUsaha: cleanString(getFieldValue(row, [
        'status_usaha', 'Status Usaha', 'statusUsaha', 'business_status', 'status'
      ])),
      bentukUsaha: cleanString(getFieldValue(row, [
        'bentuk_usaha', 'Bentuk Usaha', 'bentukUsaha', 'business_form', 'form'
      ])),
      rating: cleanRating(getFieldValue(row, [
        'Rating', 'rating', 'RATING'
      ])),
      deskripsi: cleanString(getFieldValue(row, [
        'Deskripsi', 'deskripsi', 'DESKRIPSI', 'description', 'Description', 'DESCRIPTION',
        'keterangan', 'Keterangan', 'KETERANGAN'
      ])),
      
      // Data mentah yang sudah difilter
      rawData: filterUsefulFields(row)
    };

    // Debug hanya untuk beberapa baris pertama
    if (index < 5) {
      console.log(`Processed row ${index}:`, {
        namaUsaha: cleanData.namaUsaha,
        statusEntri: cleanData.statusEntri,
        namaPetugas: cleanData.namaPetugas
      });
    }
    
    return cleanData;
  }).filter(item => {
    const hasName = item.namaUsaha.trim() !== '';
    return hasName;
  });

  console.log('Final processed data length:', processedData.length);
  console.log('Sample processed data:', processedData.slice(0, 2));
  
  return processedData;
};

// Fungsi untuk parsing informasi alamat dari field nmsls
const parseAddressFromNmsls = (nmslsString) => {
  if (!nmslsString || typeof nmslsString !== 'string') {
    return {
      rt: '',
      rw: '',
      dusun: '',
      kodeWilayah: '',
      cleanName: ''
    };
  }

  const result = {
    rt: '',
    rw: '',
    dusun: '',
    kodeWilayah: '',
    cleanName: nmslsString
  };

  try {
    // Pattern untuk mengekstrak informasi
    // Contoh: [001800] RT 004 RW 004 DUSUN WUNUCARI-[00]
    
    // Ekstrak kode wilayah dalam kurung siku di awal
    const kodeWilayahMatch = nmslsString.match(/^\[(\d+)\]/);
    if (kodeWilayahMatch) {
      result.kodeWilayah = kodeWilayahMatch[1];
    }

    // Ekstrak RT
    const rtMatch = nmslsString.match(/RT\s*(\d+)/i);
    if (rtMatch) {
      result.rt = rtMatch[1].padStart(3, '0'); // Format 3 digit
    }

    // Ekstrak RW
    const rwMatch = nmslsString.match(/RW\s*(\d+)/i);
    if (rwMatch) {
      result.rw = rwMatch[1].padStart(3, '0'); // Format 3 digit
    }

    // Ekstrak Dusun
    const dusunMatch = nmslsString.match(/DUSUN\s+([A-Z\s]+?)(?:-\[|\s*$)/i);
    if (dusunMatch) {
      result.dusun = dusunMatch[1].trim();
    }

    // Bersihkan nama dari kode-kode
    let cleanName = nmslsString;
    
    // Hapus kode wilayah di awal
    cleanName = cleanName.replace(/^\[\d+\]\s*/, '');
    
    // Hapus informasi RT RW
    cleanName = cleanName.replace(/RT\s*\d+/gi, '');
    cleanName = cleanName.replace(/RW\s*\d+/gi, '');
    
    // Hapus informasi DUSUN
    cleanName = cleanName.replace(/DUSUN\s+[A-Z\s]+/gi, '');
    
    // Hapus kode di akhir
    cleanName = cleanName.replace(/-\[\d+\]$/, '');
    
    // Bersihkan spasi berlebih
    cleanName = cleanName.replace(/\s+/g, ' ').trim();
    
    result.cleanName = cleanName || nmslsString;

  } catch (error) {
    console.warn('Error parsing nmsls:', error);
    result.cleanName = nmslsString;
  }

  return result;
};

// Fungsi untuk membangun alamat lengkap
const buildCompleteAddress = (originalAddress, parsedAddress) => {
  if (!originalAddress) return '';

  let completeAddress = originalAddress;
  
  // Tambahkan informasi RT/RW jika ada dan belum ada di alamat asli
  if (parsedAddress.rt && !originalAddress.toLowerCase().includes('rt')) {
    completeAddress += `, RT ${parsedAddress.rt}`;
  }
  
  if (parsedAddress.rw && !originalAddress.toLowerCase().includes('rw')) {
    completeAddress += `, RW ${parsedAddress.rw}`;
  }
  
  // Tambahkan informasi dusun jika ada dan belum ada di alamat asli
  if (parsedAddress.dusun && !originalAddress.toLowerCase().includes(parsedAddress.dusun.toLowerCase())) {
    completeAddress += `, Dusun ${parsedAddress.dusun}`;
  }

  return completeAddress;
};

// Helper function untuk mendapatkan nilai field dengan berbagai nama alternatif
const getFieldValue = (row, fieldNames) => {
  for (const fieldName of fieldNames) {
    if (row[fieldName] !== undefined && row[fieldName] !== null && row[fieldName] !== '') {
      return row[fieldName];
    }
  }
  return '';
};

// Utility functions untuk membersihkan data
const cleanString = (str) => {
  if (typeof str !== 'string') {
    return String(str || '');
  }
  return str.trim().replace(/\s+/g, ' ');
};

const cleanPhone = (phone) => {
  if (typeof phone !== 'string') {
    phone = String(phone || '');
  }
  return phone.replace(/[^\d+\-\s()]/g, '').trim();
};

const cleanEmail = (email) => {
  if (typeof email !== 'string') {
    email = String(email || '');
  }
  const cleaned = email.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(cleaned) ? cleaned : '';
};

const cleanURL = (url) => {
  if (typeof url !== 'string') {
    url = String(url || '');
  }
  const cleaned = url.trim();
  if (cleaned && !cleaned.startsWith('http')) {
    return `https://${cleaned}`;
  }
  return cleaned;
};

const cleanRating = (rating) => {
  if (typeof rating === 'number') return rating;
  if (typeof rating === 'string') {
    const num = parseFloat(rating);
    return isNaN(num) ? 0 : Math.min(5, Math.max(0, num));
  }
  return 0;
};

const cleanCoordinate = (coord) => {
  if (typeof coord === 'number') return coord;
  if (typeof coord === 'string') {
    const num = parseFloat(coord);
    return isNaN(num) ? 0 : num;
  }
  return 0;
};

// PERBAIKAN: Fungsi untuk membersihkan status entri dengan lebih banyak variasi
const cleanStatusEntri = (status) => {
  console.log('Cleaning status:', status, typeof status);
  
  if (!status) {
    return 'Belum';
  }
  
  // Konversi ke string dan bersihkan
  const cleanStatus = String(status).trim().toLowerCase();
  console.log('Clean status:', cleanStatus);
  
  // Mapping berbagai variasi status dengan lebih lengkap
  const statusMap = {
    // Sudah
    'sudah': 'Sudah',
    'selesai': 'Sudah',
    'complete': 'Sudah',
    'completed': 'Sudah',
    'done': 'Sudah',
    'finished': 'Sudah',
    'ok': 'Sudah',
    'yes': 'Sudah',
    'ya': 'Sudah',
    'iya': 'Sudah',
    '1': 'Sudah',
    'true': 'Sudah',
    'success': 'Sudah',
    'berhasil': 'Sudah',
    'selesai entri': 'Sudah',
    'sudah entri': 'Sudah',
    'entri selesai': 'Sudah',
    'data lengkap': 'Sudah',
    'lengkap': 'Sudah',
    
    // Progress
    'progress': 'Progress',
    'ongoing': 'Progress',
    'proses': 'Progress',
    'berjalan': 'Progress',
    'sedang proses': 'Progress',
    'dalam proses': 'Progress',
    'berlangsung': 'Progress',
    'partial': 'Progress',
    'sebagian': 'Progress',
    
    // Belum
    'belum': 'Belum',
    'pending': 'Belum',
    'incomplete': 'Belum',
    'no': 'Belum',
    'tidak': 'Belum',
    '0': 'Belum',
    'false': 'Belum',
    'kosong': 'Belum',
    'empty': 'Belum',
    'belum entri': 'Belum',
    'tidak lengkap': 'Belum',
    'kurang': 'Belum'
  };
  
  const result = statusMap[cleanStatus] || 'Belum';
  console.log('Status result:', result);
  
  return result;
};

// Fungsi untuk memfilter field yang berguna saja
const filterUsefulFields = (row) => {
  const excludedFields = [
    'a_1', 'a_2', 'a_3', 'a_4', 'a_5',
    '__parsed_extra', '__rowNum__',
    'undefined', 'null', '',
  ];
  
  const filtered = {};
  
  Object.entries(row).forEach(([key, value]) => {
    if (!excludedFields.includes(key) && value !== null && value !== undefined && value !== '') {
      const readableKey = getReadableFieldName(key);
      filtered[readableKey] = value;
    }
  });
  
  return filtered;
};

const getReadableFieldName = (fieldName) => {
  const fieldNameMap = {
    'NamaUsaha': 'Nama Usaha',
    'Alamat': 'Alamat',
    'prop': 'Propinsi',
    'kab': 'Kabupaten', 
    'kec': 'Kecamatan',
    'desa': 'Desa/Kelurahan',
    'nmsls': 'Nama PIC/Sales',
    'telpon_hp': 'No. Telepon/HP',
    'latitude': 'Latitude',
    'longitude': 'Longitude',
    'Email': 'Email',
    'Website': 'Website',
    'JenisUsaha': 'Jenis Usaha',
    'KBLI': 'Kode KBLI',
    'kbli': 'Kode KBLI',
    'Kegiatan': 'Kegiatan Usaha',
    'kegiatan': 'Kegiatan Usaha',
    'Status': 'Status Entri',
    'status': 'Status Entri',
    'Petugas': 'Nama Petugas',
    'petugas': 'Nama Petugas',
    'omzet': 'Omzet',
    'modal': 'Modal',
    'keuntungan': 'Keuntungan',
    'tahun_berdiri': 'Tahun Berdiri',
    'jumlah_karyawan': 'Jumlah Karyawan',
    'jam_operasional': 'Jam Operasional',
    'deskripsi': 'Deskripsi',
    'rating': 'Rating'
  };
  
  return fieldNameMap[fieldName] || fieldName;
};

// Fungsi pencarian yang lebih komprehensif
export const searchBusinesses = (businesses, searchTerm) => {
  if (!searchTerm.trim()) {
    return businesses;
  }

  const term = searchTerm.toLowerCase();
  return businesses.filter(business => 
    business.namaUsaha.toLowerCase().includes(term) ||
    business.alamat.toLowerCase().includes(term) ||
    business.alamatLengkap.toLowerCase().includes(term) ||
    business.kecamatan.toLowerCase().includes(term) ||
    business.desa.toLowerCase().includes(term) ||
    business.dusun.toLowerCase().includes(term) ||
    business.kabupaten.toLowerCase().includes(term) ||
    business.propinsi.toLowerCase().includes(term) ||
    business.jenisUsaha.toLowerCase().includes(term) ||
    business.kbli.toLowerCase().includes(term) ||
    business.kegiatan.toLowerCase().includes(term) ||
    business.statusEntri.toLowerCase().includes(term) ||
    business.namaPetugas.toLowerCase().includes(term) ||
    business.nmsls.toLowerCase().includes(term) ||
    business.nmslsParsed.toLowerCase().includes(term) ||
    business.noTelp.includes(term) ||
    business.rt.includes(term) ||
    business.rw.includes(term) ||
    business.email.toLowerCase().includes(term) ||
    business.deskripsi.toLowerCase().includes(term)
  );
};

export const filterByCategory = (businesses, category) => {
  if (!category || category === 'all') {
    return businesses;
  }
  return businesses.filter(business => 
    business.jenisUsaha.toLowerCase() === category.toLowerCase() ||
    business.kelompokUsaha.toLowerCase() === category.toLowerCase() ||
    business.bentukUsaha.toLowerCase() === category.toLowerCase()
  );
};

export const getUniqueCategories = (businesses) => {
  const categories = new Set();
  businesses.forEach(business => {
    if (business.jenisUsaha) categories.add(business.jenisUsaha);
    if (business.kelompokUsaha) categories.add(business.kelompokUsaha);
    if (business.bentukUsaha) categories.add(business.bentukUsaha);
  });
  return Array.from(categories).sort();
};

export const getUniqueRegions = (businesses) => {
  const regions = new Set();
  businesses.forEach(business => {
    if (business.propinsi) regions.add(business.propinsi);
    if (business.kabupaten) regions.add(business.kabupaten);
    if (business.kecamatan) regions.add(business.kecamatan);
    if (business.desa) regions.add(business.desa);
    if (business.dusun) regions.add(business.dusun);
  });
  return Array.from(regions).sort();
};

export const filterByRegion = (businesses, region) => {
  if (!region || region === 'all') {
    return businesses;
  }
  return businesses.filter(business => 
    business.propinsi === region ||
    business.kabupaten === region ||
    business.kecamatan === region ||
    business.desa === region ||
    business.dusun === region
  );
};
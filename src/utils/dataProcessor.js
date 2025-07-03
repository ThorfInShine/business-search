// Fungsi untuk membuat identifier unik berdasarkan kombinasi field
const createUniqueIdentifier = (business) => {
  const name = business.namaUsaha?.toLowerCase().trim() || ''
  const address = business.alamat?.toLowerCase().trim() || ''
  const kecamatan = business.kecamatan?.toLowerCase().trim() || ''
  const phone = business.noTelp?.replace(/\D/g, '') || '' // Remove non-digits
  
  // Kombinasi nama + alamat + kecamatan sebagai identifier utama
  let identifier = `${name}_${address}_${kecamatan}`
  
  // Jika ada nomor telepon, tambahkan sebagai identifier alternatif
  if (phone.length >= 8) { // Minimal 8 digit untuk nomor telepon valid
    identifier += `_${phone}`
  }
  
  return identifier
}

// ENHANCED: Remove duplicates with detailed logging
const removeDuplicatesFromArray = (dataArray) => {
  const seen = new Set();
  const seenPhones = new Set();
  const unique = [];
  const duplicates = [];
  
  console.log(`🔍 Starting array deduplication of ${dataArray.length} items...`);
  
  for (const item of dataArray) {
    const identifier = createUniqueIdentifier(item);
    const phone = item.noTelp?.replace(/\D/g, '') || '';
    
    // Check primary identifier (nama + alamat + kecamatan)
    if (!seen.has(identifier)) {
      // Check phone number as secondary deduplication
      if (phone.length >= 8 && seenPhones.has(phone)) {
        console.log(`📞 Duplicate phone detected, skipping: ${item.namaUsaha} (${phone})`);
        duplicates.push({
          reason: 'duplicate_phone',
          name: item.namaUsaha,
          phone: phone,
          identifier: identifier
        });
        continue;
      }
      
      seen.add(identifier);
      if (phone.length >= 8) {
        seenPhones.add(phone);
      }
      
      // Set the identifier for reference
      item._uniqueIdentifier = identifier;
      unique.push(item);
    } else {
      console.log(`🔄 Duplicate detected and removed: ${item.namaUsaha} (${identifier})`);
      duplicates.push({
        reason: 'duplicate_identifier',
        name: item.namaUsaha,
        identifier: identifier,
        phone: phone
      });
    }
  }
  
  // Detailed summary
  console.log(`🧹 Array deduplication complete:`);
  console.log(`   - Original: ${dataArray.length}`);
  console.log(`   - Unique: ${unique.length}`);
  console.log(`   - Duplicates removed: ${duplicates.length}`);
  
  // Group duplicates by reason
  const duplicatesByReason = duplicates.reduce((acc, dup) => {
    acc[dup.reason] = (acc[dup.reason] || 0) + 1;
    return acc;
  }, {});
  
  console.log(`   - Duplicate breakdown:`, duplicatesByReason);
  
  // Show sample duplicates
  if (duplicates.length > 0) {
    console.log(`   - Sample duplicates:`, duplicates.slice(0, 3));
  }
  
  return unique;
};

// Fungsi untuk membersihkan status toko
const cleanStatusToko = (status) => {
  console.log('Cleaning status toko:', status, typeof status);
  
  if (!status) {
    return 'BUKA';
  }
  
  const cleanStatus = String(status).trim().toLowerCase();
  console.log('Clean status:', cleanStatus);
  
  // Mapping status toko
  const statusMap = {
    // Buka
    'buka': 'BUKA',
    'open': 'BUKA',
    'aktif': 'BUKA',
    'beroperasi': 'BUKA',
    'operasional': 'BUKA',
    'ya': 'BUKA',
    'yes': 'BUKA',
    '1': 'BUKA',
    'true': 'BUKA',
    'sudah': 'BUKA',
    'selesai': 'BUKA',
    'complete': 'BUKA',
    'completed': 'BUKA',
    'done': 'BUKA',
    'finished': 'BUKA',
    'ok': 'BUKA',
    'iya': 'BUKA',
    'success': 'BUKA',
    'berhasil': 'BUKA',
    
    // Tutup
    'tutup': 'TUTUP',
    'closed': 'TUTUP',
    'tidak aktif': 'TUTUP',
    'non-aktif': 'TUTUP',
    'tidak beroperasi': 'TUTUP',
    'tidak': 'TUTUP',
    'no': 'TUTUP',
    '0': 'TUTUP',
    'false': 'TUTUP',
    'belum': 'TUTUP',
    'pending': 'TUTUP',
    'incomplete': 'TUTUP',
    'kosong': 'TUTUP',
    'empty': 'TUTUP',
    'tidak lengkap': 'TUTUP',
    'kurang': 'TUTUP'
  };
  
  const result = statusMap[cleanStatus] || 'BUKA';
  console.log('Status result:', result);
  
  return result;
};

// ENHANCED: Process CSV data with optional deduplication
export const processCSVData = (rawData, options = {}) => {
  const { skipDeduplication = false } = options;
  
  console.log('\n🔄 ===== STARTING DATA PROCESSING =====');
  console.log('Processing raw data with detailed logging:', rawData?.length);
  console.log('Skip deduplication:', skipDeduplication);
  
  if (!rawData || rawData.length === 0) {
    console.log('❌ No raw data to process');
    return [];
  }

  // Debug: lihat struktur data
  if (rawData.length > 0) {
    console.log('📋 First row structure:', rawData[0]);
    console.log('📋 Available keys:', Object.keys(rawData[0] || {}));
  }

  console.log('⚙️ Processing each row...');
  
  const processedData = rawData.map((row, index) => {
    // Debug untuk beberapa baris pertama
    if (index < 3) {
      console.log(`📝 Processing row ${index + 1}:`, row);
    }

    // Ambil data nmsls untuk parsing alamat
    const nmslsRaw = getFieldValue(row, [
      'nmsls', 'Nama Sales', 'NMSLS', 'PIC', 'pic', 'sales', 'Sales', 'SALES',
      'Nama PIC', 'nama_pic', 'contact_person', 'Contact Person'
    ]);

    // Parse informasi alamat dari nmsls
    const parsedAddress = parseAddressFromNmsls(nmslsRaw);

    // Ambil status toko dengan lebih banyak variasi
    const statusTokoRaw = getFieldValue(row, [
      // Variasi umum
      'Status', 'status', 'STATUS', 
      'status_toko', 'Status Toko', 'STATUS_TOKO',
      'toko_status', 'Toko Status', 'TOKO_STATUS',
      'kondisi_toko', 'Kondisi Toko', 'KONDISI_TOKO',
      'operasional', 'Operasional', 'OPERASIONAL',
      'buka_tutup', 'Buka Tutup', 'BUKA_TUTUP',
      'status_entri', 'Status Entri', 'STATUS_ENTRI', // Backward compatibility
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
        key.toLowerCase().includes('selesai') ||
        key.toLowerCase().includes('toko') ||
        key.toLowerCase().includes('buka') ||
        key.toLowerCase().includes('tutup')
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

    // Get nama usaha
    const namaUsaha = cleanString(getFieldValue(row, [
      'NamaUsaha', 'namaUsaha', 'Nama Usaha', 'nama_usaha', 'nama usaha', 'NAMA_USAHA', 'NAMA USAHA'
    ]));

    // Debug untuk status dan petugas
    if (index < 3) {
      console.log(`📝 Row ${index + 1} details:`);
      console.log(`   - Nama Usaha: "${namaUsaha}"`);
      console.log(`   - Status raw: "${statusTokoRaw}"`);
      console.log(`   - Petugas raw: "${namaPetugasRaw}"`);
      console.log(`   - Status cleaned: "${cleanStatusToko(statusTokoRaw)}"`);
      console.log(`   - Petugas cleaned: "${cleanString(namaPetugasRaw)}"`);
    }

    // Bersihkan data dan berikan default values untuk semua field
    const cleanData = {
      id: index + 1,
      
      // Informasi Dasar Usaha
      namaUsaha: namaUsaha,
      
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
      
      // Status Toko dan Petugas - Gunakan nilai yang sudah diambil
      statusToko: cleanStatusToko(statusTokoRaw),
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
      rawData: filterUsefulFields(row),
      
      // Identifier unik untuk deduplication (will be set later if needed)
      _uniqueIdentifier: null
    };

    // Debug hanya untuk beberapa baris pertama
    if (index < 3) {
      console.log(`✅ Processed row ${index + 1} result:`, {
        namaUsaha: cleanData.namaUsaha,
        statusToko: cleanData.statusToko,
        namaPetugas: cleanData.namaPetugas,
        hasValidName: cleanData.namaUsaha.trim() !== ''
      });
    }
    
    return cleanData;
  });

  console.log(`⚙️ Initial processing complete: ${processedData.length} records`);

  // Filter out items without business names
  const filteredData = processedData.filter(item => {
    const hasName = item.namaUsaha.trim() !== '';
    if (!hasName && processedData.indexOf(item) < 5) {
      console.log(`🗑️ Filtering out item without name:`, item);
    }
    return hasName;
  });

  console.log(`🗑️ After filtering empty names: ${filteredData.length} records`);
  console.log(`🗑️ Filtered out: ${processedData.length - filteredData.length} records with empty names`);

  // Conditional deduplication
  let finalData;
  if (skipDeduplication) {
    console.log(`🚫 SKIPPING DEDUPLICATION as requested`);
    finalData = filteredData;
  } else {
    console.log(`🧹 Starting deduplication...`);
    finalData = removeDuplicatesFromArray(filteredData);
  }
  
  console.log('\n✅ ===== DATA PROCESSING COMPLETE =====');
  console.log(`📊 Processing summary:`);
  console.log(`   - Raw input: ${rawData.length}`);
  console.log(`   - After processing: ${processedData.length}`);
  console.log(`   - After name filtering: ${filteredData.length}`);
  if (skipDeduplication) {
    console.log(`   - Final output (no dedup): ${finalData.length}`);
    console.log(`   - Total loss: ${rawData.length - finalData.length} (${(((rawData.length - finalData.length)/rawData.length)*100).toFixed(1)}%)`);
  } else {
    console.log(`   - After deduplication: ${finalData.length}`);
    console.log(`   - Total loss: ${rawData.length - finalData.length} (${(((rawData.length - finalData.length)/rawData.length)*100).toFixed(1)}%)`);
  }
  
  console.log('📋 Sample processed data:', finalData.slice(0, 2));
  
  return finalData;
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
    'Status': 'Status Toko',
    'status': 'Status Toko',
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
    business.statusToko.toLowerCase().includes(term) ||
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

// Mendapatkan daftar kecamatan unik
export const getUniqueKecamatan = (businesses) => {
  const kecamatanSet = new Set();
  
  businesses.forEach(business => {
    if (business.kecamatan && business.kecamatan.trim()) {
      kecamatanSet.add(business.kecamatan.trim());
    }
  });
  
  return Array.from(kecamatanSet).sort();
};

// Mendapatkan daftar desa unik (bisa difilter berdasarkan kecamatan)
export const getUniqueDesa = (businesses, selectedKecamatan = 'all') => {
  const desaSet = new Set();
  
  businesses.forEach(business => {
    // Filter berdasarkan kecamatan jika dipilih
    if (selectedKecamatan !== 'all' && business.kecamatan !== selectedKecamatan) {
      return;
    }
    
    if (business.desa && business.desa.trim()) {
      desaSet.add(business.desa.trim());
    }
  });
  
  return Array.from(desaSet).sort();
};

// Filter berdasarkan kecamatan
export const filterByKecamatan = (businesses, kecamatan) => {
  if (!kecamatan || kecamatan === 'all') {
    return businesses;
  }
  
  return businesses.filter(business => 
    business.kecamatan && business.kecamatan.toLowerCase() === kecamatan.toLowerCase()
  );
};

// Filter berdasarkan desa
export const filterByDesa = (businesses, desa) => {
  if (!desa || desa === 'all') {
    return businesses;
  }
  
  return businesses.filter(business => 
    business.desa && business.desa.toLowerCase() === desa.toLowerCase()
  );
};
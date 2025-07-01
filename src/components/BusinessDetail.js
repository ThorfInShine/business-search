import React, { useState } from 'react';

const BusinessDetail = ({ business, onClose }) => {
  const [showAllData, setShowAllData] = useState(false);

  const handleContact = (type, value) => {
    switch (type) {
      case 'phone':
        window.open(`tel:${value}`);
        break;
      case 'email':
        window.open(`mailto:${value}`);
        break;
      case 'website':
        window.open(value.startsWith('http') ? value : `https://${value}`, '_blank');
        break;
      case 'maps':
        if (business.latitude && business.longitude) {
          window.open(`https://maps.google.com/?q=${business.latitude},${business.longitude}`, '_blank');
        }
        break;
      default:
        break;
    }
  };

  const copyToClipboard = () => {
    const text = `
INFORMASI USAHA
===============
Nama: ${business.namaUsaha}
Jenis: ${business.jenisUsaha || '-'}
Kegiatan: ${business.kegiatan || '-'}
Kode KBLI: ${business.kbli || '-'}
Status Entri: ${business.statusEntri || '-'}
Petugas: ${business.namaPetugas || '-'}
Status: ${business.statusUsaha || '-'}
Tahun Berdiri: ${business.tahunBerdiri || '-'}

ALAMAT & LOKASI
===============
Alamat: ${business.alamatLengkap || business.alamat || '-'}
RT/RW: ${business.rt || '-'}/${business.rw || '-'}
Dusun: ${business.dusun || '-'}
Desa/Kelurahan: ${business.desa || '-'}
Kecamatan: ${business.kecamatan || '-'}
Kabupaten: ${business.kabupaten || '-'}
Provinsi: ${business.propinsi || '-'}

INFORMASI KONTAK
================
Kontak: ${business.nmslsParsed || business.nmsls || '-'}
Telepon: ${business.noTelp || '-'}
Email: ${business.email || '-'}
Website: ${business.website || '-'}

DETAIL USAHA
============
Omzet: ${business.omzet || '-'}
Modal: ${business.modal || '-'}
Keuntungan: ${business.keuntungan || '-'}
Karyawan: ${business.jumlahKaryawan || '-'}
`;
    
    navigator.clipboard.writeText(text).then(() => {
      alert('Informasi berhasil disalin ke clipboard!');
    });
  };

  return (
    <div className="detail-panel">
      {/* Header */}
      <div className="detail-header">
        <div className="detail-title">
          <h2>{business.namaUsaha}</h2>
          {business.jenisUsaha && (
            <span className="business-type">{business.jenisUsaha}</span>
          )}
        </div>
        <button onClick={onClose} className="close-btn">✕</button>
      </div>

      {/* Content */}
      <div className="detail-content">
        {/* Informasi Utama */}
        <div className="info-section">
          <h3>🏢 INFORMASI USAHA</h3>
          <div className="info-grid">
            <InfoItem label="Nama Usaha" value={business.namaUsaha} />
            <InfoItem label="Jenis Usaha" value={business.jenisUsaha} />
            <InfoItem label="Kegiatan" value={business.kegiatan} />
            <InfoItem label="Kode KBLI" value={business.kbli} />
            <InfoItem label="Status Entri" value={business.statusEntri} />
            <InfoItem label="Petugas" value={business.namaPetugas} />
            <InfoItem label="Status Usaha" value={business.statusUsaha} />
            <InfoItem label="Bentuk Usaha" value={business.bentukUsaha} />
            <InfoItem label="Tahun Berdiri" value={business.tahunBerdiri} />
          </div>
        </div>

        {/* Alamat & Lokasi */}
        <div className="info-section">
          <h3>📍 ALAMAT & LOKASI</h3>
          <div className="info-grid">
            <InfoItem label="Alamat" value={business.alamatLengkap || business.alamat} fullWidth />
            <InfoItem label="RT" value={business.rt} />
            <InfoItem label="RW" value={business.rw} />
            <InfoItem label="Dusun" value={business.dusun} />
            <InfoItem label="Desa/Kelurahan" value={business.desa} />
            <InfoItem label="Kecamatan" value={business.kecamatan} />
            <InfoItem label="Kabupaten" value={business.kabupaten} />
            <InfoItem label="Provinsi" value={business.propinsi} />
          </div>
          {business.latitude && business.longitude && (
            <div className="maps-section">
              <InfoItem 
                label="Koordinat" 
                value={`${business.latitude}, ${business.longitude}`} 
              />
              <button 
                className="maps-link-btn"
                onClick={() => handleContact('maps')}
              >
                🗺️ BUKA DI GOOGLE MAPS
              </button>
            </div>
          )}
        </div>

        {/* Informasi Kontak */}
        <div className="info-section">
          <h3>📞 INFORMASI KONTAK</h3>
          <div className="info-grid">
            <InfoItem label="Kontak Person" value={business.nmslsParsed || business.nmsls} />
            <InfoItem label="Nomor Telepon" value={business.noTelp} />
            <InfoItem label="Email" value={business.email} />
            <InfoItem label="Website" value={business.website} />
          </div>
        </div>

        {/* Detail Usaha */}
        {(business.omzet || business.modal || business.keuntungan || business.jumlahKaryawan) && (
          <div className="info-section">
            <h3>💼 DETAIL USAHA</h3>
            <div className="info-grid">
              <InfoItem label="Omzet" value={business.omzet} />
              <InfoItem label="Modal" value={business.modal} />
              <InfoItem label="Keuntungan" value={business.keuntungan} />
              <InfoItem label="Jumlah Karyawan" value={business.jumlahKaryawan} />
            </div>
          </div>
        )}

        {/* Deskripsi */}
        {business.deskripsi && (
          <div className="info-section">
            <h3>📝 DESKRIPSI</h3>
            <p className="description-text">{business.deskripsi}</p>
          </div>
        )}

        {/* Data Tambahan */}
        {business.rawData && Object.keys(business.rawData).length > 0 && (
          <div className="info-section">
            <div className="section-header">
              <h3>📊 DATA TAMBAHAN</h3>
              <button 
                className="toggle-btn"
                onClick={() => setShowAllData(!showAllData)}
              >
                {showAllData ? 'SEMBUNYIKAN' : 'TAMPILKAN'}
              </button>
            </div>
            
            {showAllData && (
              <div className="additional-data">
                {Object.entries(business.rawData)
                  .filter(([key, value]) => {
                    const unwantedFields = ['a_1', 'a_2', 'a_3', 'a_4', 'a_5'];
                    return !unwantedFields.some(unwanted => 
                      key.toLowerCase().includes(unwanted.toLowerCase())
                    );
                  })
                  .map(([key, value]) => (
                    value && value !== '' && value !== '0' && (
                      <InfoItem 
                        key={key}
                        label={key} 
                        value={value} 
                      />
                    )
                  ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Tombol Aksi */}
      <div className="detail-actions">
        {business.noTelp && (
          <button 
            className="action-button phone"
            onClick={() => handleContact('phone', business.noTelp)}
          >
            📞 TELEPON
          </button>
        )}
        {business.email && (
          <button 
            className="action-button email"
            onClick={() => handleContact('email', business.email)}
          >
            📧 EMAIL
          </button>
        )}
        {business.website && (
          <button 
            className="action-button website"
            onClick={() => handleContact('website', business.website)}
          >
            🌐 WEBSITE
          </button>
        )}
        <button 
          className="action-button copy"
          onClick={copyToClipboard}
        >
          📋 SALIN INFO
        </button>
      </div>
    </div>
  );
};

// Komponen untuk item informasi
const InfoItem = ({ label, value, fullWidth = false }) => {
  if (!value || value.toString().trim() === '' || value === '0') return null;
  
  return (
    <div className={`info-item ${fullWidth ? 'full-width' : ''}`}>
      <div className="info-label">{label}:</div>
      <div className="info-value">{value}</div>
    </div>
  );
};

export default BusinessDetail;
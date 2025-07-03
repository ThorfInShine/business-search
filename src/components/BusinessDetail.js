import React, { useState } from 'react';
import './BusinessDetail.css';

const BusinessDetail = ({ 
  business, 
  isOpen = true, // Default true untuk backward compatibility
  onClose, 
  onEdit, 
  onDelete, 
  canEdit = false, 
  useDatabase = false 
}) => {
  const [showAllData, setShowAllData] = useState(false);

  // Jika tidak ada business, jangan render apa-apa
  if (!business) return null;

  // Jika isOpen false, jangan render (untuk modal mode)
  if (isOpen === false) return null;

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
        const lat = business.latitude || business.lat;
        const lng = business.longitude || business.lng;
        if (lat && lng) {
          window.open(`https://maps.google.com/?q=${lat},${lng}`, '_blank');
        }
        break;
      default:
        break;
    }
  };

  const copyToClipboard = () => {
    const getName = () => business.nama_usaha || business.namaUsaha;
    const getJenisUsaha = () => business.jenis_usaha || business.jenisUsaha;
    const getAlamat = () => business.alamat_lengkap || business.alamatLengkap || business.alamat;
    const getKecamatan = () => business.kecamatan;
    const getDesa = () => business.desa;
    const getKontak = () => business.nmsls_parsed || business.nmslsParsed || business.nmsls;
    const getTelp = () => business.no_telp || business.noTelp;
    const getEmail = () => business.email;
    const getKegiatan = () => business.kegiatan;
    const getKbli = () => business.kbli;
    const getStatusToko = () => business.status_toko || business.statusToko;
    const getPetugas = () => business.nama_petugas || business.namaPetugas;

    const text = `
INFORMASI USAHA
===============
Nama: ${getName()}
Jenis: ${getJenisUsaha() || '-'}
Kegiatan: ${getKegiatan() || '-'}
Kode KBLI: ${getKbli() || '-'}
Status Toko: ${getStatusToko() || '-'}
Petugas: ${getPetugas() || '-'}
Status: ${business.status_usaha || business.statusUsaha || '-'}
Tahun Berdiri: ${business.tahun_berdiri || business.tahunBerdiri || '-'}

ALAMAT & LOKASI
===============
Alamat: ${getAlamat() || '-'}
RT/RW: ${business.rt || '-'}/${business.rw || '-'}
Dusun: ${business.dusun || '-'}
Desa/Kelurahan: ${getDesa() || '-'}
Kecamatan: ${getKecamatan() || '-'}
Kabupaten: ${business.kabupaten || '-'}
Provinsi: ${business.propinsi || business.provinsi || '-'}

INFORMASI KONTAK
================
Kontak: ${getKontak() || '-'}
Telepon: ${getTelp() || '-'}
Email: ${getEmail() || '-'}
Website: ${business.website || '-'}

DETAIL USAHA
============
Omzet: ${business.omzet || '-'}
Modal: ${business.modal || '-'}
Keuntungan: ${business.keuntungan || '-'}
Karyawan: ${business.jumlah_karyawan || business.jumlahKaryawan || '-'}
`;
    
    navigator.clipboard.writeText(text).then(() => {
      alert('Informasi berhasil disalin ke clipboard!');
    });
  };

  // Helper functions to get correct field values
  const getName = () => business.nama_usaha || business.namaUsaha;
  const getJenisUsaha = () => business.jenis_usaha || business.jenisUsaha;
  const getAlamat = () => business.alamat_lengkap || business.alamatLengkap || business.alamat;
  const getKecamatan = () => business.kecamatan;
  const getDesa = () => business.desa;
  const getKontak = () => business.nmsls_parsed || business.nmslsParsed || business.nmsls;
  const getTelp = () => business.no_telp || business.noTelp;
  const getEmail = () => business.email;
  const getKegiatan = () => business.kegiatan;
  const getKbli = () => business.kbli;
  const getStatusToko = () => business.status_toko || business.statusToko;
  const getPetugas = () => business.nama_petugas || business.namaPetugas;
  const getLatitude = () => business.latitude || business.lat;
  const getLongitude = () => business.longitude || business.lng;

  return (
    <div className="business-detail-modal-overlay">
      <div className="business-detail-modal">
        {/* Header */}
        <div className="detail-modal-header">
          <div className="detail-modal-title">
            <h2>{getName()}</h2>
            {getJenisUsaha() && (
              <span className="business-type">{getJenisUsaha()}</span>
            )}
          </div>
          <button onClick={onClose} className="close-btn">✕</button>
        </div>

        {/* Content */}
        <div className="detail-modal-content">
          {/* Informasi Utama */}
          <div className="info-section">
            <h3>🏢 INFORMASI USAHA</h3>
            <div className="info-grid">
              <InfoItem label="Nama Usaha" value={getName()} />
              <InfoItem label="Jenis Usaha" value={getJenisUsaha()} />
              <InfoItem label="Kegiatan" value={getKegiatan()} />
              <InfoItem label="Kode KBLI" value={getKbli()} />
              <InfoItem label="Status Toko" value={getStatusToko()} />
              <InfoItem label="Petugas" value={getPetugas()} />
              <InfoItem label="Status Usaha" value={business.status_usaha || business.statusUsaha} />
              <InfoItem label="Bentuk Usaha" value={business.bentuk_usaha || business.bentukUsaha} />
              <InfoItem label="Tahun Berdiri" value={business.tahun_berdiri || business.tahunBerdiri} />
            </div>
          </div>

          {/* Alamat & Lokasi */}
          <div className="info-section">
            <h3>📍 ALAMAT & LOKASI</h3>
            <div className="info-grid">
              <InfoItem label="Alamat" value={getAlamat()} fullWidth />
              <InfoItem label="RT" value={business.rt} />
              <InfoItem label="RW" value={business.rw} />
              <InfoItem label="Dusun" value={business.dusun} />
              <InfoItem label="Desa/Kelurahan" value={getDesa()} />
              <InfoItem label="Kecamatan" value={getKecamatan()} />
              <InfoItem label="Kabupaten" value={business.kabupaten} />
              <InfoItem label="Provinsi" value={business.propinsi || business.provinsi} />
            </div>
            {getLatitude() && getLongitude() && (
              <div className="maps-section">
                <InfoItem 
                  label="Koordinat" 
                  value={`${getLatitude()}, ${getLongitude()}`} 
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
              <InfoItem label="Kontak Person" value={getKontak()} />
              <InfoItem label="Nomor Telepon" value={getTelp()} />
              <InfoItem label="Email" value={getEmail()} />
              <InfoItem label="Website" value={business.website} />
              <InfoItem label="Jam Operasional" value={business.jam_operasional || business.jamOperasional} />
            </div>
          </div>

          {/* Detail Usaha */}
          {(business.omzet || business.modal || business.keuntungan || business.jumlah_karyawan || business.jumlahKaryawan) && (
            <div className="info-section">
              <h3>💼 DETAIL USAHA</h3>
              <div className="info-grid">
                <InfoItem label="Omzet" value={business.omzet} />
                <InfoItem label="Modal" value={business.modal} />
                <InfoItem label="Keuntungan" value={business.keuntungan} />
                <InfoItem label="Jumlah Karyawan" value={business.jumlah_karyawan || business.jumlahKaryawan} />
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
          {business.raw_data && Object.keys(business.raw_data).length > 0 && (
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
                  {Object.entries(business.raw_data)
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

          {/* Legacy rawData support */}
          {!business.raw_data && business.rawData && Object.keys(business.rawData).length > 0 && (
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
        <div className="detail-modal-actions">
          {/* Edit/Delete buttons for authenticated users */}
          {canEdit && useDatabase && (
            <>
              <button 
                className="action-button edit"
                onClick={onEdit}
              >
                ✏️ EDIT
              </button>
              <button 
                className="action-button delete"
                onClick={onDelete}
              >
                🗑️ HAPUS
              </button>
            </>
          )}
          
          {getTelp() && (
            <button 
              className="action-button phone"
              onClick={() => handleContact('phone', getTelp())}
            >
              📞 TELEPON
            </button>
          )}
          {getEmail() && (
            <button 
              className="action-button email"
              onClick={() => handleContact('email', getEmail())}
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
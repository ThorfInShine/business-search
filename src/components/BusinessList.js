import React, { memo, useRef, useEffect } from 'react';

const BusinessCard = memo(({ business, isSelected, onSelect, onEdit, onDelete, canEdit, useDatabase }) => {
  const handleCardClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onSelect(business);
  };

  const handleActionClick = (e, action, value) => {
    e.preventDefault();
    e.stopPropagation();
    
    switch (action) {
      case 'phone':
        window.open(`tel:${value}`);
        break;
      case 'email':
        window.open(`mailto:${value}`);
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

  const handleEdit = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onEdit(business);
  };

  const handleDelete = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onDelete(business);
  };

  // Fungsi untuk mendapatkan class status
  const getStatusClass = (status) => {
    switch (status) {
      case 'BUKA':
        return 'status-open';
      case 'TUTUP':
        return 'status-closed';
      default:
        return 'status-unknown';
    }
  };

  // Get the correct field names based on data source
  const getName = () => business.nama_usaha || business.namaUsaha;
  const getJenisUsaha = () => business.jenis_usaha || business.jenisUsaha;
  const getAlamat = () => business.alamat_lengkap || business.alamatLengkap || business.alamat;
  const getKecamatan = () => business.kecamatan;
  const getDesa = () => business.desa;
  const getKontak = () => business.nmsls_parsed || business.nmslsParsed || business.nmsls;
  const getTelp = () => business.no_telp || business.noTelp;
  const getEmail = () => business.email;
  const getKegiatan = () => business.kegiatan;
  const getStatusToko = () => business.status_toko || business.statusToko;
  const getPetugas = () => business.nama_petugas || business.namaPetugas;
  const getRt = () => business.rt;
  const getRw = () => business.rw;
  const getDusun = () => business.dusun;

  return (
    <div 
      className={`business-card ${isSelected ? 'selected' : ''}`}
      onClick={handleCardClick}
    >
      <div className="business-header">
        <div className="business-title-section">
          <h3 className="business-name">{getName()}</h3>
          {/* Status Badge */}
          <div className="status-info">
            <span className={`status-badge ${getStatusClass(getStatusToko())}`}>
              {getStatusToko() || 'BUKA'}
            </span>
            {getPetugas() && (
              <span className="petugas-info">
                👤 {getPetugas()}
              </span>
            )}
          </div>
        </div>
        {getJenisUsaha() && (
          <span className="business-category">{getJenisUsaha()}</span>
        )}
      </div>

      <div className="business-main-info">
        <div className="info-column">
          <div className="info-item">
            <span className="info-label">📍 ALAMAT</span>
            <span className="info-value">
              {getAlamat() || '-'}
            </span>
          </div>
          
          <div className="info-item">
            <span className="info-label">🏘️ LOKASI</span>
            <span className="info-value">
              {[
                getRt() && `RT ${getRt()}`,
                getRw() && `RW ${getRw()}`,
                getDusun() && `${getDusun()}`
              ].filter(Boolean).join(', ') || 
              [getDesa(), getKecamatan()].filter(Boolean).join(', ') || '-'}
            </span>
          </div>

          <div className="info-item">
            <span className="info-label">🏛️ WILAYAH</span>
            <span className="info-value">
              {[getKecamatan(), business.kabupaten].filter(Boolean).join(', ') || '-'}
            </span>
          </div>

          {/* Tampilkan kegiatan jika ada */}
          {getKegiatan() && (
            <div className="info-item">
              <span className="info-label">🔧 KEGIATAN</span>
              <span className="info-value">
                {getKegiatan()}
              </span>
            </div>
          )}
        </div>

        <div className="info-column">
          <div className="info-item">
            <span className="info-label">👤 KONTAK PERSON</span>
            <span className="info-value">
              {getKontak() || '-'}
            </span>
          </div>

          <div className="info-item">
            <span className="info-label">📞 TELEPON</span>
            <span className="info-value">
              {getTelp() || '-'}
            </span>
          </div>

          <div className="info-item">
            <span className="info-label">📧 EMAIL</span>
            <span className="info-value">
              {getEmail() || '-'}
            </span>
          </div>
        </div>
      </div>

      <div className="business-actions">
        {getTelp() && (
          <button 
            className="action-btn phone-btn"
            onClick={(e) => handleActionClick(e, 'phone', getTelp())}
            title="Telepon"
            aria-label={`Telepon ${getName()}`}
          >
            📞
          </button>
        )}
        {getEmail() && (
          <button 
            className="action-btn email-btn"
            onClick={(e) => handleActionClick(e, 'email', getEmail())}
            title="Email"
            aria-label={`Email ${getName()}`}
          >
            📧
          </button>
        )}
        {(business.latitude || business.lat) && (business.longitude || business.lng) && (
          <button 
            className="action-btn maps-btn"
            onClick={(e) => handleActionClick(e, 'maps')}
            title="Lihat di Peta"
            aria-label={`Lihat ${getName()} di Peta`}
          >
            🗺️
          </button>
        )}
        <button 
          className="action-btn detail-btn"
          onClick={handleCardClick}
          title="Lihat Detail"
          aria-label={`Lihat detail ${getName()}`}
        >
          👁️
        </button>
      </div>

      {/* Edit/Delete buttons for authenticated users */}
      {canEdit && useDatabase && (
        <div className="business-card-actions">
          <button 
            className="edit-business-btn"
            onClick={handleEdit}
            title="Edit Usaha"
          >
            ✏️ Edit
          </button>
          <button 
            className="delete-business-btn"
            onClick={handleDelete}
            title="Hapus Usaha"
          >
            🗑️ Hapus
          </button>
        </div>
      )}
    </div>
  );
});

const BusinessList = ({ 
  businesses, 
  selectedBusiness, 
  onSelectBusiness, 
  onEditBusiness, 
  onDeleteBusiness, 
  canEdit = false,
  useDatabase = false 
}) => {
  const listRef = useRef(null);

  // Scroll to top when businesses change (new page)
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  }, [businesses]);

  if (businesses.length === 0) {
    return (
      <div className="no-results">
        <h3>🔍 TIDAK ADA HASIL DITEMUKAN</h3>
        <p>Tidak ada usaha yang sesuai dengan kriteria pencarian Anda</p>
      </div>
    );
  }

  return (
    <div className="business-list" ref={listRef}>
      {businesses.map((business, index) => (
        <BusinessCard
          key={business.id || `${business.namaUsaha || business.nama_usaha}-${index}`}
          business={business}
          isSelected={selectedBusiness && (
            selectedBusiness.id === business.id || 
            (selectedBusiness.namaUsaha || selectedBusiness.nama_usaha) === (business.namaUsaha || business.nama_usaha)
          )}
          onSelect={onSelectBusiness}
          onEdit={onEditBusiness}
          onDelete={onDeleteBusiness}
          canEdit={canEdit}
          useDatabase={useDatabase}
        />
      ))}
    </div>
  );
};

export default BusinessList;
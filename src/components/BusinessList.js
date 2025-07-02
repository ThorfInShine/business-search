import React, { memo, useRef, useEffect } from 'react';

const BusinessCard = memo(({ business, isSelected, onSelect }) => {
  const handleCardClick = (e) => {
    // Pastikan tidak ada event bubbling
    e.preventDefault();
    e.stopPropagation();
    onSelect(business);
  };

  const handleActionClick = (e, action, value) => {
    e.preventDefault();
    e.stopPropagation(); // Penting: stop propagation
    
    switch (action) {
      case 'phone':
        window.open(`tel:${value}`);
        break;
      case 'email':
        window.open(`mailto:${value}`);
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

  // Fungsi untuk mendapatkan class status
  const getStatusClass = (status) => {
    switch (status) {
      case 'Sudah':
        return 'status-completed';
      case 'Progress':
        return 'status-progress';
      case 'Belum':
      default:
        return 'status-pending';
    }
  };

  return (
    <div 
      className={`business-card ${isSelected ? 'selected' : ''}`}
      onClick={handleCardClick}
    >
      <div className="business-header">
        <div className="business-title-section">
          <h3 className="business-name">{business.namaUsaha}</h3>
          {/* Status Badge */}
          <div className="status-info">
            <span className={`status-badge ${getStatusClass(business.statusEntri)}`}>
              {business.statusEntri || 'Belum'}
            </span>
            {business.namaPetugas && (
              <span className="petugas-info">
                👤 {business.namaPetugas}
              </span>
            )}
          </div>
        </div>
        {business.jenisUsaha && (
          <span className="business-category">{business.jenisUsaha}</span>
        )}
      </div>

      <div className="business-main-info">
        <div className="info-column">
          <div className="info-item">
            <span className="info-label">📍 ALAMAT</span>
            <span className="info-value">
              {business.alamatLengkap || business.alamat || '-'}
            </span>
          </div>
          
          <div className="info-item">
            <span className="info-label">🏘️ LOKASI</span>
            <span className="info-value">
              {[
                business.rt && `RT ${business.rt}`,
                business.rw && `RW ${business.rw}`,
                business.dusun && `${business.dusun}`
              ].filter(Boolean).join(', ') || 
              [business.desa, business.kecamatan].filter(Boolean).join(', ') || '-'}
            </span>
          </div>

          <div className="info-item">
            <span className="info-label">🏛️ WILAYAH</span>
            <span className="info-value">
              {[business.kecamatan, business.kabupaten].filter(Boolean).join(', ') || '-'}
            </span>
          </div>

          {/* Tampilkan kegiatan jika ada */}
          {business.kegiatan && (
            <div className="info-item">
              <span className="info-label">🔧 KEGIATAN</span>
              <span className="info-value">
                {business.kegiatan}
              </span>
            </div>
          )}
        </div>

        <div className="info-column">
          <div className="info-item">
            <span className="info-label">👤 KONTAK PERSON</span>
            <span className="info-value">
              {business.nmslsParsed || business.nmsls || '-'}
            </span>
          </div>

          <div className="info-item">
            <span className="info-label">📞 TELEPON</span>
            <span className="info-value">
              {business.noTelp || '-'}
            </span>
          </div>

          <div className="info-item">
            <span className="info-label">📧 EMAIL</span>
            <span className="info-value">
              {business.email || '-'}
            </span>
          </div>
        </div>
      </div>

      <div className="business-actions">
        {business.noTelp && (
          <button 
            className="action-btn phone-btn"
            onClick={(e) => handleActionClick(e, 'phone', business.noTelp)}
            title="Telepon"
            aria-label={`Telepon ${business.namaUsaha}`}
          >
            📞
          </button>
        )}
        {business.email && (
          <button 
            className="action-btn email-btn"
            onClick={(e) => handleActionClick(e, 'email', business.email)}
            title="Email"
            aria-label={`Email ${business.namaUsaha}`}
          >
            📧
          </button>
        )}
        {business.latitude && business.longitude && (
          <button 
            className="action-btn maps-btn"
            onClick={(e) => handleActionClick(e, 'maps')}
            title="Lihat di Peta"
            aria-label={`Lihat ${business.namaUsaha} di Peta`}
          >
            🗺️
          </button>
        )}
        <button 
          className="action-btn detail-btn"
          onClick={handleCardClick} // Gunakan handleCardClick yang sama
          title="Lihat Detail"
          aria-label={`Lihat detail ${business.namaUsaha}`}
        >
          👁️
        </button>
      </div>
    </div>
  );
});

const BusinessList = ({ businesses, selectedBusiness, onSelectBusiness }) => {
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
      {businesses.map((business) => (
        <BusinessCard
          key={business.id}
          business={business}
          isSelected={selectedBusiness?.id === business.id}
          onSelect={onSelectBusiness}
        />
      ))}
    </div>
  );
};

export default BusinessList;
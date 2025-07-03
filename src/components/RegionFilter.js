import React from 'react';

const RegionFilter = ({ 
  kecamatanList, 
  selectedKecamatan, 
  onKecamatanChange,
  desaList,
  selectedDesa,
  onDesaChange 
}) => {
  return (
    <div className="filters-row">
      {/* Filter Kecamatan */}
      {kecamatanList.length > 0 && (
        <div className="kecamatan-filter">
          <label htmlFor="kecamatan-select">FILTER KECAMATAN:</label>
          <select 
            id="kecamatan-select"
            value={selectedKecamatan} 
            onChange={(e) => onKecamatanChange(e.target.value)}
            className="kecamatan-select"
          >
            <option value="all">SEMUA KECAMATAN</option>
            {kecamatanList.map(kecamatan => (
              <option key={kecamatan} value={kecamatan}>
                {kecamatan}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Filter Desa/Kelurahan */}
      {desaList.length > 0 && (
        <div className="desa-filter">
          <label htmlFor="desa-select">FILTER DESA/KELURAHAN:</label>
          <select 
            id="desa-select"
            value={selectedDesa} 
            onChange={(e) => onDesaChange(e.target.value)}
            className="desa-select"
          >
            <option value="all">SEMUA DESA/KELURAHAN</option>
            {desaList.map(desa => (
              <option key={desa} value={desa}>
                {desa}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
};

export default RegionFilter;
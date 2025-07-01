import React from 'react';

const RegionFilter = ({ businesses, selectedRegion, onRegionChange }) => {
  // Dapatkan daftar wilayah unik
  const regions = [...new Set(businesses.map(b => {
    if (b.kabupaten) return b.kabupaten;
    if (b.kecamatan) return b.kecamatan;
    if (b.propinsi) return b.propinsi;
    return '';
  }).filter(Boolean))].sort();

  if (regions.length === 0) return null;

  return (
    <div className="region-filter">
      <label htmlFor="region-select">Filter Wilayah:</label>
      <select 
        id="region-select"
        value={selectedRegion} 
        onChange={(e) => onRegionChange(e.target.value)}
        className="region-select"
      >
        <option value="all">Semua Wilayah</option>
        {regions.map(region => (
          <option key={region} value={region}>
            {region}
          </option>
        ))}
      </select>
    </div>
  );
};

export default RegionFilter;
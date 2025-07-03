import React from 'react';

const CategoryFilter = ({ 
  categories, 
  selectedCategory, 
  onCategoryChange,
  regions,
  selectedRegion,
  onRegionChange 
}) => {
  return (
    <div className="filters-row">
      {/* Filter Kategori */}
      {categories.length > 0 && (
        <div className="category-filter">
          <label htmlFor="category-select">FILTER KATEGORI:</label>
          <select 
            id="category-select"
            value={selectedCategory} 
            onChange={(e) => onCategoryChange(e.target.value)}
            className="category-select"
          >
            <option value="all">SEMUA KATEGORI</option>
            {categories.map(category => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Filter Wilayah */}
      {regions.length > 0 && (
        <div className="region-filter">
          <label htmlFor="region-select">FILTER WILAYAH:</label>
          <select 
            id="region-select"
            value={selectedRegion} 
            onChange={(e) => onRegionChange(e.target.value)}
            className="region-select"
          >
            <option value="all">SEMUA WILAYAH</option>
            {regions.map(region => (
              <option key={region} value={region}>
                {region}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
};

export default CategoryFilter;
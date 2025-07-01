import React from 'react';

const CategoryFilter = ({ categories, selectedCategory, onCategoryChange }) => {
  if (categories.length === 0) return null;

  return (
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
  );
};

export default CategoryFilter;
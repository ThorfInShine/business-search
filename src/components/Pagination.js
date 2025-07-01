import React, { useState, useEffect } from 'react';

const Pagination = ({ 
  currentPage, 
  totalPages, 
  totalItems, 
  itemsPerPage, 
  onPageChange 
}) => {
  const [inputPage, setInputPage] = useState(currentPage);

  // Sync input with current page
  useEffect(() => {
    setInputPage(currentPage);
  }, [currentPage]);

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  // Generate page numbers to show
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 7;
    
    if (totalPages <= maxVisiblePages) {
      // Show all pages if total pages is small
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);
      
      // Add dots if there's a gap
      if (currentPage > 4) {
        pages.push('...');
      }
      
      // Show pages around current page
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      
      for (let i = start; i <= end; i++) {
        if (!pages.includes(i)) {
          pages.push(i);
        }
      }
      
      // Add dots if there's a gap
      if (currentPage < totalPages - 3) {
        pages.push('...');
      }
      
      // Always show last page
      if (!pages.includes(totalPages) && totalPages > 1) {
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  const pageNumbers = getPageNumbers();

  // Handle page number click
  const handlePageClick = (page) => {
    if (page !== '...' && page >= 1 && page <= totalPages && page !== currentPage) {
      onPageChange(page);
    }
  };

  // Handle navigation buttons
  const handleFirst = () => {
    if (currentPage !== 1) {
      onPageChange(1);
    }
  };

  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  const handleLast = () => {
    if (currentPage !== totalPages) {
      onPageChange(totalPages);
    }
  };

  // Handle input change
  const handleInputChange = (e) => {
    const value = e.target.value;
    // Allow empty or valid numbers
    if (value === '' || (/^\d+$/.test(value) && parseInt(value) >= 1 && parseInt(value) <= totalPages)) {
      setInputPage(value === '' ? '' : parseInt(value));
    }
  };

  // Handle input submit
  const handleInputSubmit = (e) => {
    if (e.key === 'Enter' || e.type === 'blur') {
      const page = parseInt(inputPage);
      if (page >= 1 && page <= totalPages && page !== currentPage) {
        onPageChange(page);
      } else {
        // Reset to current page if invalid
        setInputPage(currentPage);
      }
    }
  };

  // Don't render if there's only one page or no pages
  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="pagination-container">
      {/* Info */}
      <div className="pagination-info">
        <span>
          MENAMPILKAN {startItem.toLocaleString()} - {endItem.toLocaleString()} DARI {totalItems.toLocaleString()} USAHA
        </span>
      </div>

      {/* Pagination Controls */}
      <div className="pagination-controls">
        {/* Halaman Pertama */}
        <button 
          className="pagination-btn"
          onClick={handleFirst}
          disabled={currentPage === 1}
          title="Halaman Pertama"
          aria-label="Ke halaman pertama"
        >
          ⏮️
        </button>

        {/* Halaman Sebelumnya */}
        <button 
          className="pagination-btn"
          onClick={handlePrevious}
          disabled={currentPage === 1}
          title="Halaman Sebelumnya"
          aria-label="Ke halaman sebelumnya"
        >
          ⬅️
        </button>

        {/* Nomor Halaman */}
        <div className="pagination-numbers">
          {pageNumbers.map((page, index) => (
            <button
              key={`${page}-${index}`}
              className={`pagination-number ${page === currentPage ? 'active' : ''} ${page === '...' ? 'dots' : ''}`}
              onClick={() => handlePageClick(page)}
              disabled={page === '...' || page === currentPage}
              aria-label={page === '...' ? 'Halaman lainnya' : `Ke halaman ${page}`}
              title={page === '...' ? 'Halaman lainnya' : `Halaman ${page}`}
            >
              {page}
            </button>
          ))}
        </div>

        {/* Halaman Selanjutnya */}
        <button 
          className="pagination-btn"
          onClick={handleNext}
          disabled={currentPage === totalPages}
          title="Halaman Selanjutnya"
          aria-label="Ke halaman selanjutnya"
        >
          ➡️
        </button>

        {/* Halaman Terakhir */}
        <button 
          className="pagination-btn"
          onClick={handleLast}
          disabled={currentPage === totalPages}
          title="Halaman Terakhir"
          aria-label="Ke halaman terakhir"
        >
          ⏭️
        </button>
      </div>

      {/* Lompat Cepat */}
      <div className="pagination-jump">
        <span>KE HALAMAN:</span>
        <input 
          type="number" 
          min="1" 
          max={totalPages}
          value={inputPage}
          onChange={handleInputChange}
          onKeyPress={handleInputSubmit}
          onBlur={handleInputSubmit}
          className="page-input"
          placeholder={currentPage.toString()}
          aria-label="Masukkan nomor halaman"
        />
        <span>DARI {totalPages.toLocaleString()}</span>
      </div>
    </div>
  );
};

export default Pagination;
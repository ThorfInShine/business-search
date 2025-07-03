import React, { useState, useEffect } from 'react';

const Pagination = ({ 
  currentPage, 
  totalPages, 
  totalItems, 
  itemsPerPage, 
  onPageChange,
  loading = false
}) => {
  const [inputPage, setInputPage] = useState(currentPage);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile screen
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Sync input with current page
  useEffect(() => {
    setInputPage(currentPage);
  }, [currentPage]);

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  // Get mobile-friendly button text
  const getPrevButtonText = () => {
    if (window.innerWidth <= 375) return "‹ Prev";
    if (window.innerWidth <= 480) return "‹ Prev";
    return "← Sebelumnya";
  };

  const getNextButtonText = () => {
    if (window.innerWidth <= 375) return "Next ›";
    if (window.innerWidth <= 480) return "Next ›";
    return "Selanjutnya →";
  };

  // Unified pagination - show only essential pages
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = isMobile ? 3 : 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show current page and adjacent pages
      const start = Math.max(1, currentPage - 1);
      const end = Math.min(totalPages, currentPage + 1);
      
      // Add first page if not in range
      if (start > 1) {
        pages.push(1);
        if (start > 2) {
          pages.push('...');
        }
      }
      
      // Add current range
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      
      // Add last page if not in range
      if (end < totalPages) {
        if (end < totalPages - 1) {
          pages.push('...');
        }
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  const pageNumbers = getPageNumbers();

  const handlePageClick = (page) => {
    if (page !== '...' && page >= 1 && page <= totalPages && page !== currentPage && !loading) {
      onPageChange(page);
    }
  };

  const handlePrevious = () => {
    if (currentPage > 1 && !loading) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages && !loading) {
      onPageChange(currentPage + 1);
    }
  };

  const handleInputSubmit = (e) => {
    if ((e.key === 'Enter' || e.type === 'blur') && !loading) {
      const page = parseInt(inputPage);
      if (page >= 1 && page <= totalPages && page !== currentPage) {
        onPageChange(page);
      } else {
        setInputPage(currentPage);
      }
    }
  };

  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="pagination-container">
      {/* Info */}
      <div className="pagination-info">
        <div className="page-indicator">
          Halaman <strong>{currentPage}</strong> dari <strong>{totalPages}</strong>
          {loading && <span className="loading-indicator"> ⏳</span>}
        </div>
        <div className="items-info">
          {startItem.toLocaleString()} - {endItem.toLocaleString()} dari {totalItems.toLocaleString()} usaha
        </div>
      </div>

      {/* Main Controls - Natural flow: Prev | Numbers | Next */}
      <div className="pagination-controls">
        {/* Previous Button */}
        <button 
          className="pagination-btn prev"
          onClick={handlePrevious}
          disabled={currentPage === 1 || loading}
          title="Halaman sebelumnya"
        >
          {getPrevButtonText()}
        </button>

        {/* Page Numbers */}
        <div className="pagination-numbers">
          {pageNumbers.map((page, index) => (
            <button
              key={`${page}-${index}`}
              className={`pagination-number ${page === currentPage ? 'active' : ''} ${page === '...' ? 'dots' : ''}`}
              onClick={() => handlePageClick(page)}
              disabled={page === '...' || page === currentPage || loading}
              title={page === '...' ? '' : `Ke halaman ${page}`}
            >
              {page}
            </button>
          ))}
        </div>

        {/* Next Button */}
        <button 
          className="pagination-btn next"
          onClick={handleNext}
          disabled={currentPage === totalPages || loading}
          title="Halaman selanjutnya"
        >
          {getNextButtonText()}
        </button>
      </div>

      {/* Quick Jump */}
      <div className="pagination-jump">
        <span>Langsung ke halaman:</span>
        <input 
          type="number" 
          min="1" 
          max={totalPages}
          value={inputPage}
          onChange={(e) => setInputPage(e.target.value)}
          onKeyPress={handleInputSubmit}
          onBlur={handleInputSubmit}
          disabled={loading}
          className="pagination-input"
          title="Masukkan nomor halaman"
        />
      </div>
    </div>
  );
};

export default Pagination;
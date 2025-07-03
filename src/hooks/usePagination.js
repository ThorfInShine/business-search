import { useState, useMemo, useCallback, useRef } from 'react';

export const usePagination = (totalItems, itemsPerPage = 20, onPageChange = null) => {
  const [currentPage, setCurrentPage] = useState(1);
  const isDetailOpenRef = useRef(false);

  // Calculate pagination values
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  
  // Scroll business list to top
  const scrollBusinessListToTop = useCallback((force = false) => {
    if (isDetailOpenRef.current && !force) {
      console.log('Skipping scroll - detail is open');
      return;
    }

    const businessListContainer = document.querySelector('.business-list');
    if (businessListContainer) {
      businessListContainer.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }

    const resultsSummary = document.querySelector('.results-summary');
    if (resultsSummary) {
      resultsSummary.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  }, []);

  // Handle page change
  const handlePageChange = useCallback((page) => {
    const newPage = parseInt(page);
    
    if (isNaN(newPage) || newPage < 1 || newPage > totalPages) {
      console.warn(`Invalid page number: ${page}. Must be between 1 and ${totalPages}`);
      return;
    }
    
    if (newPage !== currentPage) {
      console.log(`Changing page from ${currentPage} to ${newPage}`);
      setCurrentPage(newPage);
      
      // Call onPageChange if provided (for server-side pagination)
      if (onPageChange) {
        onPageChange(newPage);
      }
      
      setTimeout(() => {
        scrollBusinessListToTop();
      }, 100);
    }
  }, [currentPage, totalPages, onPageChange, scrollBusinessListToTop]);

  // Reset pagination
  const resetPagination = useCallback((force = false) => {
    if (!force && isDetailOpenRef.current) {
      console.log('Skipping pagination reset - detail is open');
      return;
    }
    
    console.log('Resetting pagination to page 1', { force });
    setCurrentPage(1);
    
    setTimeout(() => {
      scrollBusinessListToTop(true);
    }, 100);
  }, [scrollBusinessListToTop]);

  // Set detail status
  const setDetailOpen = useCallback((isOpen) => {
    console.log('Setting detail open:', isOpen);
    isDetailOpenRef.current = isOpen;
  }, []);

  // Auto-adjust page if exceeds total pages
  useMemo(() => {
    if (currentPage > totalPages && totalPages > 0 && !isDetailOpenRef.current) {
      console.log(`Auto-adjusting page from ${currentPage} to ${totalPages}`);
      setCurrentPage(totalPages);
      
      setTimeout(() => {
        scrollBusinessListToTop(true);
      }, 100);
    }
  }, [currentPage, totalPages, scrollBusinessListToTop]);

  return {
    currentPage,
    totalPages,
    totalItems,
    handlePageChange,
    resetPagination,
    setCurrentPage,
    itemsPerPage,
    scrollBusinessListToTop,
    setDetailOpen
  };
};
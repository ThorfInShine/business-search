import { useState, useMemo, useCallback, useRef } from 'react';

export const usePagination = (data, itemsPerPage = 1000) => {
  const [currentPage, setCurrentPage] = useState(1);
  const businessListRef = useRef(null);
  const isDetailOpenRef = useRef(false);
  const dataLengthRef = useRef(0);

  // Calculate pagination values
  const totalItems = data.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  
  // Get current page data
  const currentData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return data.slice(startIndex, endIndex);
  }, [data, currentPage, itemsPerPage]);

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
      
      setTimeout(() => {
        scrollBusinessListToTop();
      }, 100);
    }
  }, [currentPage, totalPages, scrollBusinessListToTop]);

  // Reset pagination - HANYA jika dipaksa atau data length berubah drastis
  const resetPagination = useCallback((force = false) => {
    const dataLengthChanged = Math.abs(dataLengthRef.current - totalItems) > 100;
    
    if (!force && !dataLengthChanged && isDetailOpenRef.current) {
      console.log('Skipping pagination reset - detail is open');
      return;
    }
    
    console.log('Resetting pagination to page 1', { force, dataLengthChanged });
    dataLengthRef.current = totalItems;
    setCurrentPage(1);
    
    setTimeout(() => {
      scrollBusinessListToTop(true);
    }, 100);
  }, [totalItems, scrollBusinessListToTop]);

  // TAMBAHAN: Fungsi untuk restore pagination ke halaman tertentu
  const restorePagination = useCallback((pageNumber) => {
    const targetPage = parseInt(pageNumber);
    
    if (isNaN(targetPage) || targetPage < 1 || targetPage > totalPages) {
      console.warn(`Cannot restore to invalid page: ${pageNumber}. Staying on page 1.`);
      setCurrentPage(1);
      return;
    }
    
    console.log(`Restoring pagination to page ${targetPage}`);
    setCurrentPage(targetPage);
    
    // Jangan scroll otomatis saat restore
  }, [totalPages]);

  // Set detail status
  const setDetailOpen = useCallback((isOpen) => {
    console.log('Setting detail open:', isOpen);
    isDetailOpenRef.current = isOpen;
  }, []);

  // Auto-adjust page if exceeds total pages - HANYA jika tidak ada detail yang terbuka
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
    currentData,
    handlePageChange,
    resetPagination,
    restorePagination, // TAMBAHAN: export fungsi restore
    itemsPerPage,
    businessListRef,
    scrollBusinessListToTop,
    setDetailOpen
  };
};
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { fetchCSVData, parseUploadedCSV } from './services/csvService';
import { 
  processCSVData, 
  searchBusinesses, 
  filterByCategory, 
  getUniqueCategories 
} from './utils/dataProcessor';
import { 
  updateGoogleSheets, 
  updateLocalData, 
  saveToLocalStorage 
} from './services/sheetsUpdateService';
import { usePagination } from './hooks/usePagination';
import BusinessList from './components/BusinessList';
import BusinessDetail from './components/BusinessDetail';
import SearchBar from './components/SearchBar';
import CategoryFilter from './components/CategoryFilter';
import FileUpload from './components/FileUpload';
import SpreadsheetUrlInput from './components/SpreadsheetUrlInput';
import Pagination from './components/Pagination';
import LoadingOverlay from './components/LoadingOverlay';
import StatusEditor from './components/StatusEditor';
import './App.css';

const App = () => {
  const [allBusinesses, setAllBusinesses] = useState([]);
  const [filteredBusinesses, setFilteredBusinesses] = useState([]);
  const [selectedBusiness, setSelectedBusiness] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dataSource, setDataSource] = useState(null);
  const [customSpreadsheet, setCustomSpreadsheet] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [editingBusiness, setEditingBusiness] = useState(null);

  // Ref untuk melacak apakah detail sedang terbuka
  const isDetailOpenRef = useRef(false);
  const lastFilterStateRef = useRef({ searchTerm: '', selectedCategory: 'all' });

  // Pagination hook dengan 1000 items per page
  const {
    currentPage,
    totalPages,
    totalItems,
    currentData,
    handlePageChange,
    resetPagination,
    itemsPerPage,
    scrollBusinessListToTop,
    setDetailOpen
  } = usePagination(filteredBusinesses, 1000);

  // Dark mode effect
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      setDarkMode(true);
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      setDarkMode(false);
      document.documentElement.setAttribute('data-theme', 'light');
    }
    
    setIsInitialized(true);
  }, []);

  // Toggle dark mode
  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    
    if (newDarkMode) {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
      localStorage.setItem('theme', 'light');
    }
  };

  // Apply filters - HANYA dipanggil saat filter berubah, TIDAK saat detail dibuka/ditutup
  const applyFilters = useCallback(() => {
    console.log('applyFilters called', { 
      searchTerm, 
      selectedCategory, 
      isDetailOpen: isDetailOpenRef.current,
      allBusinessesLength: allBusinesses.length 
    });

    // Jangan apply filter jika tidak ada data
    if (allBusinesses.length === 0) {
      return;
    }

    // Cek apakah filter benar-benar berubah
    const currentFilterState = { searchTerm, selectedCategory };
    const lastFilterState = lastFilterStateRef.current;
    
    const filtersChanged = 
      currentFilterState.searchTerm !== lastFilterState.searchTerm ||
      currentFilterState.selectedCategory !== lastFilterState.selectedCategory;

    // Jika filter tidak berubah, jangan lakukan apa-apa
    if (!filtersChanged && filteredBusinesses.length > 0) {
      console.log('Filters unchanged, skipping applyFilters');
      return;
    }

    // Update last filter state
    lastFilterStateRef.current = currentFilterState;

    setPageLoading(false);
    
    const shouldShowLoading = allBusinesses.length > 50000;
    
    if (shouldShowLoading) {
      setPageLoading(true);
    }
    
    const timeoutId = setTimeout(() => {
      try {
        let filtered = allBusinesses;
        
        if (searchTerm.trim()) {
          filtered = searchBusinesses(filtered, searchTerm);
        }
        
        if (selectedCategory !== 'all') {
          filtered = filterByCategory(filtered, selectedCategory);
        }
        
        console.log('Setting filtered businesses:', filtered.length);
        setFilteredBusinesses(filtered);
        
        // Reset pagination HANYA jika filter berubah
        if (filtersChanged) {
          console.log('Resetting pagination due to filter change');
          resetPagination(true);
        }
        
        // Scroll to top after filtering HANYA jika tidak ada detail yang terbuka
        if (!isDetailOpenRef.current) {
          setTimeout(() => {
            scrollBusinessListToTop();
          }, 200);
        }
        
      } catch (error) {
        console.error('Error applying filters:', error);
      } finally {
        setPageLoading(false);
      }
    }, shouldShowLoading ? 50 : 0);

    return () => {
      clearTimeout(timeoutId);
      setPageLoading(false);
    };
  }, [allBusinesses, searchTerm, selectedCategory, filteredBusinesses.length, resetPagination, scrollBusinessListToTop]);

  // Effect untuk apply filters - HANYA trigger saat filter berubah
  useEffect(() => {
    if (allBusinesses.length > 0) {
      console.log('Filter effect triggered');
      const cleanup = applyFilters();
      return cleanup;
    }
  }, [searchTerm, selectedCategory, allBusinesses.length]);

  // Effect terpisah untuk inisialisasi data
  useEffect(() => {
    if (allBusinesses.length > 0 && filteredBusinesses.length === 0) {
      console.log('Initializing filtered businesses');
      setFilteredBusinesses(allBusinesses);
    }
  }, [allBusinesses]);

  // Handle escape key to close detail panel
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        if (editingBusiness) {
          handleCloseStatusEditor();
        } else if (selectedBusiness) {
          handleCloseBusiness();
        }
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [selectedBusiness, editingBusiness]);

  // Load data dari spreadsheet
  const loadBusinessData = async (spreadsheetId, sheetId) => {
    try {
      setLoading(true);
      setPageLoading(false);
      setError(null);
      
      if (!spreadsheetId) {
        throw new Error('Spreadsheet ID diperlukan');
      }
      
      const rawData = await fetchCSVData(spreadsheetId, sheetId);
      const processedData = processCSVData(rawData);
      
      setAllBusinesses(processedData);
      setCategories(getUniqueCategories(processedData));
      setDataSource('google-sheets');
      setCustomSpreadsheet({ spreadsheetId, sheetId });
      
      // Reset filter state
      lastFilterStateRef.current = { searchTerm: '', selectedCategory: 'all' };
      
      console.log(`Memuat ${processedData.length} data usaha dari spreadsheet`);
      
    } catch (err) {
      console.error('Error loading business data:', err);
      setError(`Gagal memuat data: ${err.message}`);
    } finally {
      setLoading(false);
      setPageLoading(false);
    }
  };

  const handleFileUpload = async (file) => {
    try {
      setLoading(true);
      setPageLoading(false);
      setError(null);
      
      const rawData = await parseUploadedCSV(file);
      
      if (!rawData || rawData.length === 0) {
        throw new Error('File CSV kosong atau tidak dapat dibaca');
      }
      
      const processedData = processCSVData(rawData);
      
      if (processedData.length === 0) {
        throw new Error('Tidak ada data valid yang ditemukan dalam file CSV.');
      }
      
      setAllBusinesses(processedData);
      setCategories(getUniqueCategories(processedData));
      setDataSource('upload');
      setCustomSpreadsheet(null);
      
      // Reset filter state
      lastFilterStateRef.current = { searchTerm: '', selectedCategory: 'all' };
      
      console.log(`Memuat ${processedData.length} data usaha dari file yang diunggah`);
      
    } catch (err) {
      console.error('Error processing uploaded file:', err);
      setError(`Gagal memproses file: ${err.message}`);
    } finally {
      setLoading(false);
      setPageLoading(false);
    }
  };

  const handleSpreadsheetUrl = (spreadsheetId, sheetId) => {
    loadBusinessData(spreadsheetId, sheetId);
  };

  const handleSearch = (term) => {
    console.log('Search term changed:', term);
    setSearchTerm(term);
  };

  const handleCategoryChange = (category) => {
    console.log('Category changed:', category);
    setSelectedCategory(category);
  };

  const handleSelectBusiness = (business) => {
    console.log('Selecting business:', business.namaUsaha);
    isDetailOpenRef.current = true;
    setDetailOpen(true);
    setSelectedBusiness(business);
  };

  const handleCloseBusiness = () => {
    console.log('Closing business detail');
    isDetailOpenRef.current = false;
    setDetailOpen(false);
    setSelectedBusiness(null);
  };

  // Handler untuk edit status
  const handleEditStatus = (business) => {
    console.log('Editing status for:', business.namaUsaha);
    setEditingBusiness(business);
  };

  // Handler untuk update status
  const handleStatusUpdate = async (businessId, updates) => {
    try {
      console.log('Updating status for business ID:', businessId, 'Updates:', updates);
      
      // Update data lokal terlebih dahulu
      const updatedBusinesses = updateLocalData(allBusinesses, businessId, updates);
      setAllBusinesses(updatedBusinesses);
      
      // Simpan ke localStorage sebagai backup
      saveToLocalStorage(updatedBusinesses);

      // Jika menggunakan Google Sheets, coba update ke spreadsheet
      if (dataSource === 'google-sheets' && customSpreadsheet) {
        try {
          await updateGoogleSheets(
            customSpreadsheet.spreadsheetId,
            customSpreadsheet.sheetId,
            businessId,
            updates
          );
          console.log('Status berhasil diupdate ke Google Sheets');
        } catch (error) {
          console.warn('Gagal update ke Google Sheets, perubahan disimpan lokal:', error);
          // Bisa tambahkan notifikasi ke user bahwa update lokal berhasil tapi sync ke sheets gagal
          alert('Status berhasil diupdate secara lokal. Namun gagal sinkronisasi ke Google Sheets.');
        }
      }

      // Update filtered data juga
      const updatedFiltered = updateLocalData(filteredBusinesses, businessId, updates);
      setFilteredBusinesses(updatedFiltered);

      // Update selected business jika sedang dilihat
      if (selectedBusiness && selectedBusiness.id === businessId) {
        setSelectedBusiness({ ...selectedBusiness, ...updates });
      }

      console.log('Status update completed successfully');

    } catch (error) {
      console.error('Error updating status:', error);
      throw error;
    }
  };

  // Handler untuk close status editor
  const handleCloseStatusEditor = () => {
    setEditingBusiness(null);
  };

  const handleRefresh = () => {
    if (dataSource === 'google-sheets' && customSpreadsheet) {
      loadBusinessData(customSpreadsheet.spreadsheetId, customSpreadsheet.sheetId);
    }
  };

  const resetData = () => {
    setAllBusinesses([]);
    setFilteredBusinesses([]);
    setSelectedBusiness(null);
    setEditingBusiness(null);
    setSearchTerm('');
    setSelectedCategory('all');
    setCategories([]);
    setDataSource(null);
    setCustomSpreadsheet(null);
    setPageLoading(false);
    isDetailOpenRef.current = false;
    setDetailOpen(false);
    resetPagination(true);
    lastFilterStateRef.current = { searchTerm: '', selectedCategory: 'all' };
  };

  useEffect(() => {
    if (pageLoading) {
      const forceHideTimeout = setTimeout(() => {
        console.warn('Paksa sembunyikan loading overlay setelah 5 detik');
        setPageLoading(false);
      }, 5000);

      return () => clearTimeout(forceHideTimeout);
    }
  }, [pageLoading]);

  if (!isInitialized) {
    return (
      <div className="app">
        <div className="loading">
          <div className="spinner-large"></div>
          <p>Memuat aplikasi...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="app">
        <button 
          className="theme-toggle"
          onClick={toggleDarkMode}
          title={darkMode ? 'Beralih ke Mode Terang' : 'Beralih ke Mode Gelap'}
          aria-label={darkMode ? 'Beralih ke Mode Terang' : 'Beralih ke Mode Gelap'}
        >
          {darkMode ? '☀️' : '🌙'}
        </button>

        <div className="loading">
          <div className="spinner-large"></div>
          <p>Memuat data usaha...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <button 
        className="theme-toggle"
        onClick={toggleDarkMode}
        title={darkMode ? 'Beralih ke Mode Terang' : 'Beralih ke Mode Gelap'}
        aria-label={darkMode ? 'Beralih ke Mode Terang' : 'Beralih ke Mode Gelap'}
      >
        {darkMode ? '☀️' : '🌙'}
      </button>

      <LoadingOverlay isLoading={pageLoading} message="Memproses data..." />
      
      <div 
        className={`detail-overlay ${selectedBusiness ? 'open' : ''}`}
        onClick={handleCloseBusiness}
      />
      
      <div className="app-content">
        <header className="app-header">
          <h1>⚡ DIREKTORI USAHA NEXUS</h1>
          <p>
            {allBusinesses.length > 0 
              ? `Sistem intelijen bisnis canggih yang mengelola ${allBusinesses.length.toLocaleString()} entitas usaha dengan teknologi terdepan`
              : 'Platform integrasi data bisnis berbasis cloud generasi terbaru'
            }
          </p>
          
          {customSpreadsheet && (
            <div className="spreadsheet-info">
              📊 Menggunakan spreadsheet: {customSpreadsheet.spreadsheetId}
            </div>
          )}
          
          {dataSource === 'upload' && (
            <div className="spreadsheet-info">
              📂 Menggunakan file CSV lokal
            </div>
          )}
          
          {dataSource && (
            <div className="header-actions">
              {dataSource === 'google-sheets' && customSpreadsheet && (
                <button onClick={handleRefresh} className="refresh-btn">
                  🔄 <span>SINKRONISASI DATA</span>
                </button>
              )}
              <button onClick={resetData} className="reset-btn">
                🔀 <span>GANTI SUMBER</span>
              </button>
            </div>
          )}
        </header>

        {error && (
          <div className="error-banner">
            <p>⚠️ {error}</p>
            <button onClick={() => setError(null)}>✕</button>
          </div>
        )}

        {allBusinesses.length === 0 ? (
          <div className="data-source-selector">
            <div className="source-option">
              <h3>🔗 SPREADSHEET KUSTOM</h3>
              <p>Hubungkan ke Google Sheets Anda sendiri dengan memasukkan link spreadsheet</p>
              <SpreadsheetUrlInput 
                onUrlSubmit={handleSpreadsheetUrl}
                loading={loading}
              />
            </div>
            
            <div className="source-option">
              <h3>📂 IMPOR LOKAL</h3>
              <p>Impor file CSV dari sistem lokal untuk analisis data offline dengan pemrosesan berkecepatan tinggi</p>
              <FileUpload onFileUpload={handleFileUpload} />
            </div>
          </div>
        ) : (
          <>
            <div className="filters-container">
              <SearchBar 
                searchTerm={searchTerm}
                onSearch={handleSearch}
                placeholder="Cari usaha, lokasi, kontak, kategori..."
              />
              
              <CategoryFilter
                categories={categories}
                selectedCategory={selectedCategory}
                onCategoryChange={handleCategoryChange}
              />
            </div>

            {totalPages > 1 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalItems}
                itemsPerPage={itemsPerPage}
                onPageChange={handlePageChange}
              />
            )}

            <div className="results-summary">
              <div className="summary-stats">
                <div className="stat-item">
                  <span className="stat-number">{totalItems.toLocaleString()}</span>
                  <span className="stat-label">TOTAL HASIL</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number">{currentData.length.toLocaleString()}</span>
                  <span className="stat-label">HALAMAN SAAT INI</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number">{currentPage}</span>
                  <span className="stat-label">DARI {totalPages} HALAMAN</span>
                </div>
              </div>
              
              {(searchTerm || selectedCategory !== 'all') && (
                <div className="filter-info">
                  {searchTerm && <span className="filter-tag">🔍 "{searchTerm}"</span>}
                  {selectedCategory !== 'all' && <span className="filter-tag">🏷️ {selectedCategory}</span>}
                </div>
              )}
            </div>

            <div className="content-container">
              <div className="business-list-container">
                <BusinessList
                  businesses={currentData}
                  selectedBusiness={selectedBusiness}
                  onSelectBusiness={handleSelectBusiness}
                  onEditStatus={handleEditStatus}
                />
                
                {currentData.length === 0 && filteredBusinesses.length > 0 && (
                  <div className="empty-page">
                    <p>Tidak ada data tersedia pada halaman ini</p>
                    <button 
                      onClick={() => handlePageChange(1)}
                      className="go-first-btn"
                    >
                      KE HALAMAN PERTAMA
                    </button>
                  </div>
                )}
              </div>
            </div>

            {totalPages > 1 && (
              <div className="pagination-bottom">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={totalItems}
                  itemsPerPage={itemsPerPage}
                  onPageChange={handlePageChange}
                />
              </div>
            )}
          </>
        )}
      </div>

      {/* Detail Panel */}
      <div className={`business-detail-container ${selectedBusiness ? 'open' : ''}`}>
        {selectedBusiness && (
          <BusinessDetail 
            business={selectedBusiness}
            onClose={handleCloseBusiness}
          />
        )}
      </div>

      {/* Status Editor Modal */}
      {editingBusiness && (
        <StatusEditor
          business={editingBusiness}
          onStatusUpdate={handleStatusUpdate}
          onClose={handleCloseStatusEditor}
        />
      )}
    </div>
  );
};

export default App;
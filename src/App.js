import React, { useState, useEffect, useCallback, useRef } from 'react';
import { fetchCSVData } from './services/csvService';
import { 
  processCSVData, 
  searchBusinesses, 
  filterByKecamatan,
  filterByDesa,
  getUniqueKecamatan,
  getUniqueDesa
} from './utils/dataProcessor';
import { DEFAULT_SPREADSHEET_ID, DEFAULT_SHEET_ID } from './services/googleSheetsAPI';
import { usePagination } from './hooks/usePagination';
import { businessService } from './services/businessService';
import { authService } from './services/authService';
import { migrationService } from './services/migrationService';
import { backgroundCache } from './services/backgroundCache';
import BusinessList from './components/BusinessList';
import BusinessDetail from './components/BusinessDetail';
import BusinessForm from './components/BusinessForm';
import SearchBar from './components/SearchBar';
import RegionFilter from './components/RegionFilter';
import Pagination from './components/Pagination';
import LoadingOverlay from './components/LoadingOverlay';
import AuthModal from './components/AuthModal';
import DuplicateManager from './components/DuplicateManager';
import AdminPanel from './components/AdminPanel';
import './App.css';

const App = () => {
  const [allBusinesses, setAllBusinesses] = useState([]);
  const [currentPageData, setCurrentPageData] = useState([]);
  const [selectedBusiness, setSelectedBusiness] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedKecamatan, setSelectedKecamatan] = useState('all');
  const [selectedDesa, setSelectedDesa] = useState('all');
  const [kecamatanList, setKecamatanList] = useState([]);
  const [desaList, setDesaList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(false);
  const [error, setError] = useState(null);
  const [customSpreadsheet, setCustomSpreadsheet] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState({ message: '', progress: 0 });
  const [totalCount, setTotalCount] = useState(0);

  // Database-related states
  const [user, setUser] = useState(null);
  const [useDatabase, setUseDatabase] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showBusinessForm, setShowBusinessForm] = useState(false);
  const [editingBusiness, setEditingBusiness] = useState(null);
  
  // Duplicate Manager state
  const [showDuplicateManager, setShowDuplicateManager] = useState(false);
  
  // Admin Panel state
  const [showAdminPanel, setShowAdminPanel] = useState(false);

  // Ref untuk melacak apakah detail sedang terbuka
  const isDetailOpenRef = useRef(false);

  // Ref untuk mencegah infinite loop
  const isLoadingRef = useRef(false);
  const dataLoadedRef = useRef(false);

  // Pagination hook with server-side support
  const {
    currentPage,
    totalPages,
    totalItems,
    handlePageChange: handlePaginationChange,
    resetPagination,
    itemsPerPage,
    scrollBusinessListToTop,
    setDetailOpen
  } = usePagination(totalCount, 20, async (page) => {
    await loadPageData(page, {
      search: searchTerm,
      kecamatan: selectedKecamatan,
      desa: selectedDesa
    });
  });

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

  // NEW: Load page data with caching
  const loadPageData = useCallback(async (page, filters) => {
    try {
      // Check cache first
      const cached = backgroundCache.getFromCache(page, filters);
      if (cached) {
        console.log(`📦 Using cached data for page ${page}`);
        setCurrentPageData(cached.data);
        setTotalCount(cached.total);
        return;
      }

      setPageLoading(true);
      
      const result = await businessService.getBusinessesPaginated(page, 20, filters);
      setCurrentPageData(result.data);
      setTotalCount(result.total);
      
      // Start background preloading
      setTimeout(() => {
        backgroundCache.preloadNextPages(page, filters, result.totalPages);
      }, 500);
      
    } catch (error) {
      console.error('Error loading page:', error);
      setError(`Gagal memuat data: ${error.message}`);
    } finally {
      setPageLoading(false);
    }
  }, []);

  // NEW: Load initial data quickly
  const loadInitialData = useCallback(async () => {
    if (isLoadingRef.current) return;

    try {
      isLoadingRef.current = true;
      setLoading(true);
      setLoadingProgress({ message: 'Memuat data awal...', progress: 10 });
      
      // Get just the first page and total count
      const result = await businessService.getInitialData(20);
      
      setCurrentPageData(result.businesses);
      setTotalCount(result.totalCount);
      dataLoadedRef.current = true;
      
      setLoadingProgress({ message: 'Memuat opsi filter...', progress: 70 });
      
      // Load filter options in background
      setTimeout(async () => {
        try {
          const [kecamatanList, desaList] = await Promise.all([
            businessService.getUniqueValues('kecamatan'),
            businessService.getUniqueValues('desa')
          ]);
          
          setKecamatanList(kecamatanList);
          setDesaList(desaList);
        } catch (error) {
          console.error('Error loading filter options:', error);
        }
      }, 100);
      
      setLoadingProgress({ message: 'Selesai!', progress: 100 });
      console.log(`✅ Initial load completed: ${result.businesses.length} businesses shown, ${result.totalCount} total`);
      
    } catch (error) {
      console.error('Error in initial load:', error);
      setError(`Gagal memuat data: ${error.message}`);
    } finally {
      setLoading(false);
      isLoadingRef.current = false;
      setTimeout(() => setLoadingProgress({ message: '', progress: 0 }), 1000);
    }
  }, []);

  // Load data from spreadsheet (fallback)
  const loadBusinessDataFromSpreadsheet = useCallback(async (spreadsheetId, sheetId) => {
    if (isLoadingRef.current) return;

    try {
      isLoadingRef.current = true;
      setLoading(true);
      setError(null);
      setLoadingProgress({ message: 'Mengambil data dari spreadsheet...', progress: 10 });
      
      if (!spreadsheetId) {
        throw new Error('Spreadsheet ID diperlukan');
      }
      
      const rawData = await fetchCSVData(spreadsheetId, sheetId);
      setLoadingProgress({ message: 'Memproses data spreadsheet...', progress: 50 });
      
      const processedData = processCSVData(rawData);
      setLoadingProgress({ message: 'Menyelesaikan pemrosesan...', progress: 80 });
      
      setAllBusinesses(processedData);
      setCurrentPageData(processedData.slice(0, 20));
      setTotalCount(processedData.length);
      setKecamatanList(getUniqueKecamatan(processedData));
      setDesaList(getUniqueDesa(processedData));
      setCustomSpreadsheet({ spreadsheetId, sheetId });
      dataLoadedRef.current = true;
      
      setLoadingProgress({ message: 'Selesai!', progress: 100 });
      console.log(`✅ Memuat ${processedData.length} data usaha dari spreadsheet`);
      
    } catch (err) {
      console.error('Error loading business data:', err);
      setError(`Gagal memuat data: ${err.message}`);
    } finally {
      setLoading(false);
      isLoadingRef.current = false;
      setTimeout(() => setLoadingProgress({ message: '', progress: 0 }), 1000);
    }
  }, []);

  // Check database status dan auto-migration
  const checkDatabaseStatus = useCallback(async () => {
    if (isLoadingRef.current || dataLoadedRef.current) return;

    try {
      setLoadingProgress({ message: 'Mengecek status database...', progress: 5 });
      const status = await migrationService.checkDatabaseStatus();
      
      if (status.hasData) {
        console.log('📊 Database has data:', status.count, 'businesses');
        setUseDatabase(true);
        await loadInitialData();
      } else {
        console.log('📭 Database is empty');
        setUseDatabase(true); // Tetap gunakan database mode
        
        // JANGAN auto-import, hanya load data kosong
        setCurrentPageData([]);
        setTotalCount(0);
        dataLoadedRef.current = true;
        
        // Tampilkan pesan bahwa database kosong
        setError('Database kosong. Gunakan fitur Import Data di Admin Panel untuk mengisi data.');
      }
    } catch (error) {
      console.error('Error checking database status:', error);
      setError(`Gagal mengecek database: ${error.message}`);
      setUseDatabase(false);
      // Fallback ke spreadsheet hanya jika benar-benar error
      await loadBusinessDataFromSpreadsheet(DEFAULT_SPREADSHEET_ID, DEFAULT_SHEET_ID);
    } finally {
      setLoading(false);
      setTimeout(() => setLoadingProgress({ message: '', progress: 0 }), 1000);
    }
  }, [loadInitialData, loadBusinessDataFromSpreadsheet]);

  // Authentication effect
  useEffect(() => {
    authService.getCurrentUser().then(setUser);
    
    const { data: { subscription } } = authService.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Check database status on mount
  useEffect(() => {
    if (isInitialized && !dataLoadedRef.current) {
      checkDatabaseStatus();
    }
  }, [isInitialized, checkDatabaseStatus]);

  // Real-time subscription effect
  useEffect(() => {
    if (!useDatabase || !dataLoadedRef.current) return;

    console.log('🔄 Setting up real-time subscription...');
    
    const subscription = businessService.subscribeToChanges((payload) => {
      console.log('📡 Real-time update received:', payload.eventType);
      // Refresh current page data
      loadPageData(currentPage, {
        search: searchTerm,
        kecamatan: selectedKecamatan,
        desa: selectedDesa
      });
    });

    return () => {
      console.log('🔌 Unsubscribing from real-time updates');
      subscription.unsubscribe();
    };
  }, [useDatabase, currentPage, searchTerm, selectedKecamatan, selectedDesa, loadPageData]);

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

  // Update desa list ketika kecamatan berubah
  useEffect(() => {
    if (!dataLoadedRef.current) return;

    if (useDatabase) {
      if (selectedKecamatan !== 'all') {
        businessService.getBusinesses({ kecamatan: selectedKecamatan })
          .then(businesses => {
            const uniqueDesa = [...new Set(businesses.map(b => b.desa).filter(Boolean))].sort();
            setDesaList(uniqueDesa);
          })
          .catch(console.error);
      } else {
        businessService.getUniqueValues('desa')
          .then(setDesaList)
          .catch(console.error);
      }
    } else {
      if (allBusinesses.length > 0) {
        const newDesaList = getUniqueDesa(allBusinesses, selectedKecamatan);
        setDesaList(newDesaList);
        
        if (selectedKecamatan !== 'all' && selectedDesa !== 'all') {
          if (!newDesaList.includes(selectedDesa)) {
            setSelectedDesa('all');
          }
        }
      }
    }
  }, [selectedKecamatan, useDatabase, allBusinesses.length, selectedDesa]);

  const handleCloseBusiness = useCallback(() => {
    console.log('Closing business detail');
    isDetailOpenRef.current = false;
    setDetailOpen(false);
    setSelectedBusiness(null);
  }, [setDetailOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        if (selectedBusiness) {
          handleCloseBusiness();
        }
        if (showBusinessForm) {
          setShowBusinessForm(false);
          setEditingBusiness(null);
        }
        if (showAuthModal) {
          setShowAuthModal(false);
        }
        if (showDuplicateManager) {
          setShowDuplicateManager(false);
        }
        if (showAdminPanel) {
          setShowAdminPanel(false);
        }
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [selectedBusiness, showBusinessForm, showAuthModal, showDuplicateManager, showAdminPanel, handleCloseBusiness]);

  // NEW: Updated filter handlers for server-side pagination
  const handleSearch = useCallback((term) => {
    console.log('Search term changed:', term);
    setSearchTerm(term);
    backgroundCache.clearCache();
    
    // Reset to page 1 and load data
    loadPageData(1, {
      search: term,
      kecamatan: selectedKecamatan,
      desa: selectedDesa
    });
  }, [selectedKecamatan, selectedDesa, loadPageData]);

  const handleKecamatanChange = useCallback((kecamatan) => {
    console.log('Kecamatan changed:', kecamatan);
    setSelectedKecamatan(kecamatan);
    if (kecamatan !== selectedKecamatan) {
      setSelectedDesa('all');
    }
    backgroundCache.clearCache();
    
    loadPageData(1, {
      search: searchTerm,
      kecamatan: kecamatan,
      desa: 'all'
    });
  }, [searchTerm, selectedKecamatan, loadPageData]);

  const handleDesaChange = useCallback((desa) => {
    console.log('Desa changed:', desa);
    setSelectedDesa(desa);
    backgroundCache.clearCache();
    
    loadPageData(1, {
      search: searchTerm,
      kecamatan: selectedKecamatan,
      desa: desa
    });
  }, [searchTerm, selectedKecamatan, loadPageData]);

  const handleSelectBusiness = (business) => {
    console.log('Selecting business:', business.nama_usaha || business.namaUsaha);
    isDetailOpenRef.current = true;
    setDetailOpen(true);
    setSelectedBusiness(business);
  };

  // Manual refresh function
  const handleRefresh = async () => {
    setIsRefreshing(true);
    dataLoadedRef.current = false;
    
    businessService.invalidateCache();
    backgroundCache.clearCache();
    
    try {
      setError(null);
      console.log('🔄 Starting manual refresh...');
      
      if (useDatabase) {
        await loadInitialData();
      } else {
        await loadBusinessDataFromSpreadsheet(DEFAULT_SPREADSHEET_ID, DEFAULT_SHEET_ID);
      }
      
      console.log('✅ Manual refresh completed');
      
    } catch (error) {
      console.error('❌ Error during refresh:', error);
      setError(`Gagal menyinkronkan data: ${error.message}`);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Business CRUD handlers
  const handleAddBusiness = () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    setEditingBusiness(null);
    setShowBusinessForm(true);
  };

  const handleEditBusiness = (business) => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    setEditingBusiness(business);
    setShowBusinessForm(true);
  };

  const handleDeleteBusiness = async (business) => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    if (window.confirm(`Apakah Anda yakin ingin menghapus usaha "${business.nama_usaha || business.namaUsaha}"?`)) {
      try {
        await businessService.deleteBusiness(business.id);
        
        // Refresh current page
        await loadPageData(currentPage, {
          search: searchTerm,
          kecamatan: selectedKecamatan,
          desa: selectedDesa
        });
        
        if (selectedBusiness && selectedBusiness.id === business.id) {
          handleCloseBusiness();
        }
        
        alert('Usaha berhasil dihapus!');
      } catch (error) {
        console.error('Error deleting business:', error);
        alert(`Gagal menghapus usaha: ${error.message}`);
      }
    }
  };

  const handleSaveBusiness = async (savedBusiness) => {
    try {
      // Refresh current page
      await loadPageData(currentPage, {
        search: searchTerm,
        kecamatan: selectedKecamatan,
        desa: selectedDesa
      });
      
      setShowBusinessForm(false);
      setEditingBusiness(null);
      
      const action = editingBusiness ? 'diperbarui' : 'ditambahkan';
      alert(`Usaha "${savedBusiness.nama_usaha}" berhasil ${action}!`);
      
      if (editingBusiness && selectedBusiness && selectedBusiness.id === editingBusiness.id) {
        setSelectedBusiness(savedBusiness);
      }
      
    } catch (error) {
      console.error('Error after saving business:', error);
    }
  };

  // Force hide loading overlay after timeout
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
          <p>{loadingProgress.message || (isRefreshing ? 'Menyinkronkan data...' : 'Memuat data usaha...')}</p>
          {loadingProgress.progress > 0 && (
            <div className="progress-container">
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${loadingProgress.progress}%` }}
                />
              </div>
              <span className="progress-text">{loadingProgress.progress}%</span>
            </div>
          )}
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
          <h1>⚡ DIREKTORI USAHA</h1>
          <p>
            {totalCount > 0 
              ? `Sistem manajemen data usaha berbasis database dengan ${totalCount.toLocaleString()} entitas usaha`
              : 'Platform manajemen data usaha berbasis database real-time'
            }
          </p>
          
          <div className="spreadsheet-info">
            {useDatabase ? (
              <>📊 Sumber data: Database Supabase (Real-time) ⚡ Optimized with Caching</>
            ) : (
              <>📊 Mode Fallback: Google Sheets</>
            )}
          </div>
          
          <div className="header-actions">
            <button 
              onClick={handleRefresh} 
              className="refresh-btn"
              disabled={loading || isRefreshing}
            >
              {isRefreshing ? '⏳' : '🔄'} 
              <span>{isRefreshing ? 'MENYINKRONKAN...' : 'REFRESH DATA'}</span>
            </button>
            
            {user ? (
              <div className="user-menu">
                <span className="user-info">👤 {user.email}</span>
                <button 
                  onClick={() => authService.signOut()}
                  className="auth-btn signout"
                >
                  🚪 Keluar
                </button>
              </div>
            ) : (
              <button 
                onClick={() => setShowAuthModal(true)}
                className="auth-btn signin"
              >
                🔐 Masuk
              </button>
            )}
          </div>

          {user && (
            <div className="admin-actions">
              <button 
                onClick={handleAddBusiness}
                className="add-business-btn"
              >
                ➕ Tambah Usaha
              </button>
              
              <div className="admin-controls">
                <button 
                  onClick={() => setShowAdminPanel(!showAdminPanel)}
                  className={`admin-panel-btn ${showAdminPanel ? 'active' : ''}`}
                >
                  {showAdminPanel ? '❌ Tutup Admin' : '📊 Admin Panel'}
                </button>
                
                <button 
                  onClick={() => setShowDuplicateManager(!showDuplicateManager)}
                  className={`duplicate-manager-btn ${showDuplicateManager ? 'active' : ''}`}
                >
                  {showDuplicateManager ? '❌ Tutup' : '🔍 Kelola Duplikasi'}
                </button>
              </div>
            </div>
          )}
        </header>

        {error && (
          <div className="error-banner">
            <p>⚠️ {error}</p>
            <button onClick={() => setError(null)}>✕</button>
          </div>
        )}

        {showAdminPanel && (
          <AdminPanel 
            onClose={() => setShowAdminPanel(false)}
          />
        )}

        {showDuplicateManager && (
          <DuplicateManager 
            onClose={() => setShowDuplicateManager(false)}
          />
        )}

        {(totalCount > 0 || useDatabase) && (
          <>
            <div className="filters-container">
              <SearchBar 
                searchTerm={searchTerm}
                onSearch={handleSearch}
                placeholder="Cari usaha, lokasi, kontak, kategori..."
              />
              
              <RegionFilter
                kecamatanList={kecamatanList}
                selectedKecamatan={selectedKecamatan}
                onKecamatanChange={handleKecamatanChange}
                desaList={desaList}
                selectedDesa={selectedDesa}
                onDesaChange={handleDesaChange}
              />
            </div>

            {totalCount > 0 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalCount}
                itemsPerPage={itemsPerPage}
                onPageChange={handlePaginationChange}
              />
            )}

            <div className="results-summary">
              <div className="summary-stats">
                <div className="stat-item">
                  <span className="stat-number">{totalCount.toLocaleString()}</span>
                  <span className="stat-label">TOTAL HASIL</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number">{currentPageData.length.toLocaleString()}</span>
                  <span className="stat-label">HALAMAN SAAT INI</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number">{currentPage}</span>
                  <span className="stat-label">DARI {totalPages} HALAMAN</span>
                </div>
              </div>
              
              {(searchTerm || selectedKecamatan !== 'all' || selectedDesa !== 'all') && (
                <div className="filter-info">
                  {searchTerm && <span className="filter-tag">🔍 "{searchTerm}"</span>}
                  {selectedKecamatan !== 'all' && <span className="filter-tag">🏛️ {selectedKecamatan}</span>}
                  {selectedDesa !== 'all' && <span className="filter-tag">🏘️ {selectedDesa}</span>}
                </div>
              )}
            </div>

            <div className="content-container">
              <div className="business-list-container">
                <BusinessList
                  businesses={currentPageData}
                  selectedBusiness={selectedBusiness}
                  onSelectBusiness={handleSelectBusiness}
                  onEditBusiness={handleEditBusiness}
                  onDeleteBusiness={handleDeleteBusiness}
                  canEdit={!!user}
                  useDatabase={useDatabase}
                />
                
                {currentPageData.length === 0 && totalCount > 0 && (
                  <div className="empty-page">
                    <p>Tidak ada data tersedia pada halaman ini</p>
                    <button 
                      onClick={() => handlePaginationChange(1)}
                      className="go-first-btn"
                    >
                      KE HALAMAN PERTAMA
                    </button>
                  </div>
                )}
              </div>
            </div>

            {totalCount > 0 && (
              <div className="pagination-bottom">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={totalCount}
                  itemsPerPage={itemsPerPage}
                  onPageChange={handlePaginationChange}
                />
              </div>
            )}
          </>
        )}
      </div>

      <div className={`business-detail-container ${selectedBusiness ? 'open' : ''}`}>
        {selectedBusiness && (
          <BusinessDetail 
            business={selectedBusiness}
            onClose={handleCloseBusiness}
            onEdit={() => handleEditBusiness(selectedBusiness)}
            onDelete={() => handleDeleteBusiness(selectedBusiness)}
            canEdit={!!user}
            useDatabase={useDatabase}
          />
        )}
      </div>

      <AuthModal 
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onAuthSuccess={() => {
          setShowAuthModal(false);
        }}
      />

      {showBusinessForm && (
        <BusinessForm
          business={editingBusiness}
          onSave={handleSaveBusiness}
          onCancel={() => {
            setShowBusinessForm(false);
            setEditingBusiness(null);
          }}
          kecamatanList={kecamatanList}
          desaList={desaList}
        />
      )}
    </div>
  );
};

export default App;
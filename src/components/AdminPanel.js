import React, { useState, useEffect } from 'react';
import { businessService } from '../services/businessService';
import { migrationService } from '../services/migrationService';
import { parseUploadedCSV } from '../services/csvService';
import { processCSVData } from '../utils/dataProcessor';
import './AdminPanel.css';

const AdminPanel = ({ onClose }) => {
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [resetProgress, setResetProgress] = useState({ message: '', progress: 0 });
  const [importProgress, setImportProgress] = useState({ message: '', progress: 0 });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterKecamatan, setFilterKecamatan] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [kecamatanList, setKecamatanList] = useState([]);
  const [selectedBusinesses, setSelectedBusinesses] = useState(new Set());
  const [showExportOptions, setShowExportOptions] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);

  const itemsPerPage = 50;

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    loadBusinesses();
  }, [currentPage, searchTerm, filterKecamatan, filterStatus]);

  // Handle click outside untuk dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showExportOptions && !event.target.closest('.export-dropdown')) {
        setShowExportOptions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showExportOptions]);

  const loadInitialData = async () => {
    try {
      const kecamatanData = await businessService.getUniqueValues('kecamatan');
      setKecamatanList(kecamatanData);
    } catch (error) {
      console.error('Error loading initial data:', error);
    }
  };

  const loadBusinesses = async () => {
    try {
      setLoading(true);
      
      const filters = {};
      if (searchTerm.trim()) filters.search = searchTerm;
      if (filterKecamatan !== 'all') filters.kecamatan = filterKecamatan;
      if (filterStatus !== 'all') filters.statusToko = filterStatus;

      const result = await businessService.getBusinessesPaginated(currentPage, itemsPerPage, filters);
      
      setBusinesses(result.data);
      setTotalCount(result.total);
      setTotalPages(result.totalPages);
    } catch (error) {
      console.error('Error loading businesses:', error);
      alert(`Error loading data: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // NEW: Import Functions
  const handleImportFromSpreadsheet = async (spreadsheetId, sheetId) => {
    try {
      setImportLoading(true);
      setImportProgress({ message: 'Starting import from spreadsheet...', progress: 0 });
      
      const result = await migrationService.importSpreadsheetToDatabase(
        spreadsheetId,
        sheetId,
        (message, progress) => {
          setImportProgress({ message, progress });
        }
      );
      
      setImportProgress({ message: 'Import completed successfully!', progress: 100 });
      
      alert(`✅ Import completed!\n\n• Imported: ${result.totalImported} new records\n• Total in database: ${result.totalInDatabase} records\n• Duplicates prevented: ${result.rawDataCount - result.totalImported}`);
      
      // Refresh all data
      await loadInitialData();
      await loadBusinesses();
      
    } catch (error) {
      console.error('Error importing from spreadsheet:', error);
      alert(`❌ Error importing data: ${error.message}`);
      setImportProgress({ message: 'Import failed!', progress: 0 });
    } finally {
      setImportLoading(false);
      setTimeout(() => {
        setImportProgress({ message: '', progress: 0 });
      }, 3000);
    }
  };

  const handleImportFromCSV = async (file) => {
    try {
      setImportLoading(true);
      setImportProgress({ message: 'Reading CSV file...', progress: 10 });
      
      // Parse CSV file
      const rawData = await parseUploadedCSV(file);
      console.log(`📊 Parsed ${rawData.length} rows from CSV file`);
      
      setImportProgress({ message: 'Processing CSV data...', progress: 30 });
      
      // Process the data
      const processedData = processCSVData(rawData);
      console.log(`⚙️ Processed ${processedData.length} records`);
      
      setImportProgress({ message: 'Converting to database format...', progress: 50 });
      
      // Convert to database format
      const dbData = migrationService.convertToDbFormat(processedData);
      
      setImportProgress({ message: 'Importing to database...', progress: 70 });
      
      // Import to database
      const importedData = await businessService.bulkImport(dbData);
      
      setImportProgress({ message: 'Import completed!', progress: 100 });
      
      alert(`✅ CSV Import completed!\n\n• Raw data: ${rawData.length} rows\n• Processed: ${processedData.length} records\n• Successfully imported: ${importedData.length} new records\n• Duplicates prevented: ${processedData.length - importedData.length}`);
      
      // Refresh all data
      await loadInitialData();
      await loadBusinesses();
      
    } catch (error) {
      console.error('Error importing CSV:', error);
      alert(`❌ Error importing CSV: ${error.message}`);
      setImportProgress({ message: 'CSV import failed!', progress: 0 });
    } finally {
      setImportLoading(false);
      setTimeout(() => {
        setImportProgress({ message: '', progress: 0 });
      }, 3000);
    }
  };

  // Reset Database Functions
  const handleResetDatabase = async () => {
    if (!window.confirm('⚠️ WARNING: This will DELETE ALL businesses and import fresh data from the default spreadsheet.\n\nThis action CANNOT be undone!\n\nContinue?')) {
      return;
    }
    
    if (!window.confirm('🚨 FINAL CONFIRMATION: All existing data will be PERMANENTLY DELETED and replaced with fresh data.\n\nAre you absolutely sure?')) {
      return;
    }
    
    try {
      setResetLoading(true);
      setResetProgress({ message: 'Starting database reset...', progress: 0 });
      
      const result = await businessService.resetDatabaseWithFreshImport(
        '1GlSR2ISC-B75n5Fml59-9f-bzjj4Ks5r', // Default spreadsheet ID
        '2121251766', // Default sheet ID
        (message, progress) => {
          setResetProgress({ message, progress });
        }
      );
      
      setResetProgress({ message: 'Reset completed successfully!', progress: 100 });
      
      alert(`✅ Database reset completed!\n\n• Deleted: ${result.deleted} old records\n• Imported: ${result.imported} new records\n• Total in database: ${result.total} records`);
      
      // Refresh all data
      await loadInitialData();
      await loadBusinesses();
      setSelectedBusinesses(new Set());
      
    } catch (error) {
      console.error('Error resetting database:', error);
      alert(`❌ Error resetting database: ${error.message}`);
      setResetProgress({ message: 'Reset failed!', progress: 0 });
    } finally {
      setResetLoading(false);
      setTimeout(() => {
        setResetProgress({ message: '', progress: 0 });
      }, 3000);
    }
  };

  const handleDeleteAllData = async () => {
    if (!window.confirm('🚨 DANGER: This will DELETE ALL businesses from the database.\n\nThis action CANNOT be undone!\n\nContinue?')) {
      return;
    }
    
    if (!window.confirm('🚨 FINAL WARNING: ALL DATA WILL BE PERMANENTLY DELETED.\n\nType "DELETE ALL" in the next prompt to confirm.')) {
      return;
    }
    
    const confirmation = prompt('Type "DELETE ALL" to confirm deletion:');
    if (confirmation !== 'DELETE ALL') {
      alert('Confirmation text does not match. Operation cancelled.');
      return;
    }
    
    try {
      setLoading(true);
      
      const result = await businessService.deleteAllBusinesses();
      
      alert(`✅ All data deleted!\n\n• ${result.deleted} businesses removed from database\n• Database is now empty`);
      
      // Refresh all data
      await loadInitialData();
      await loadBusinesses();
      setSelectedBusinesses(new Set());
      
    } catch (error) {
      console.error('Error deleting all data:', error);
      alert(`❌ Error deleting data: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Export Functions (existing code)
  const getAllDataForExport = async (selectedOnly = false) => {
    try {
      setExportLoading(true);
      
      if (selectedOnly) {
        return businesses.filter(b => selectedBusinesses.has(b.id));
      }
      
      console.log('🔄 Fetching ALL data for export...');
      const allData = await businessService.getAllBusinesses();
      
      let filteredData = allData;
      
      if (searchTerm && searchTerm.trim()) {
        const searchTermLower = searchTerm.toLowerCase();
        filteredData = filteredData.filter(business =>
          business.nama_usaha?.toLowerCase().includes(searchTermLower) ||
          business.alamat?.toLowerCase().includes(searchTermLower) ||
          business.kegiatan?.toLowerCase().includes(searchTermLower) ||
          business.jenis_usaha?.toLowerCase().includes(searchTermLower) ||
          business.kecamatan?.toLowerCase().includes(searchTermLower) ||
          business.desa?.toLowerCase().includes(searchTermLower) ||
          business.no_telp?.includes(searchTerm)
        );
      }

      if (filterKecamatan && filterKecamatan !== 'all') {
        filteredData = filteredData.filter(business => 
          business.kecamatan === filterKecamatan
        );
      }
      
      if (filterStatus && filterStatus !== 'all') {
        filteredData = filteredData.filter(business => 
          business.status_toko === filterStatus
        );
      }
      
      console.log(`✅ Fetched ${filteredData.length} records for export (filtered from ${allData.length} total)`);
      return filteredData;
      
    } catch (error) {
      console.error('Error fetching all data for export:', error);
      throw error;
    } finally {
      setExportLoading(false);
    }
  };

  const exportToCSV = async (selectedOnly = false) => {
    try {
      const dataToExport = await getAllDataForExport(selectedOnly);

      if (dataToExport.length === 0) {
        alert('No data to export');
        return;
      }

      console.log(`📊 Exporting ${dataToExport.length} records to CSV`);

      const csvContent = [
        [
          'No',
          'Nama Usaha',
          'Alamat',
          'RT',
          'RW', 
          'Dusun',
          'Desa',
          'Kecamatan',
          'Kabupaten',
          'Provinsi',
          'No Telepon',
          'Email',
          'Website',
          'Jenis Usaha',
          'KBLI',
          'Kegiatan',
          'Status Toko',
          'Nama Petugas',
          'Latitude',
          'Longitude',
          'Jam Operasional',
          'Tahun Berdiri',
          'Jumlah Karyawan',
          'Omzet',
          'Modal',
          'Keuntungan',
          'Deskripsi',
          'Tanggal Dibuat',
          'Terakhir Update'
        ].join(','),
        ...dataToExport.map((b, index) => [
          index + 1,
          b.nama_usaha || '',
          b.alamat || '',
          b.rt || '',
          b.rw || '',
          b.dusun || '',
          b.desa || '',
          b.kecamatan || '',
          b.kabupaten || '',
          b.propinsi || '',
          b.no_telp || '',
          b.email || '',
          b.website || '',
          b.jenis_usaha || '',
          b.kbli || '',
          b.kegiatan || '',
          b.status_toko || '',
          b.nama_petugas || '',
          b.latitude || '',
          b.longitude || '',
          b.jam_operasional || '',
          b.tahun_berdiri || '',
          b.jumlah_karyawan || '',
          b.omzet || '',
          b.modal || '',
          b.keuntungan || '',
          b.deskripsi || '',
          b.created_at ? new Date(b.created_at).toLocaleDateString() : '',
          b.updated_at ? new Date(b.updated_at).toLocaleDateString() : ''
        ].map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      const timestamp = new Date().toISOString().split('T')[0];
      const filterSuffix = searchTerm || filterKecamatan !== 'all' || filterStatus !== 'all' ? '-filtered' : '';
      const selectionSuffix = selectedOnly ? '-selected' : '';
      
      a.download = `businesses${filterSuffix}${selectionSuffix}-${timestamp}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      
      setShowExportOptions(false);
      setSelectedBusinesses(new Set());
      
      alert(`✅ Successfully exported ${dataToExport.length} records to CSV!`);
      
    } catch (error) {
      console.error('Error exporting to CSV:', error);
      alert(`Error exporting to CSV: ${error.message}`);
    }
  };

  const exportToJSON = async (selectedOnly = false) => {
    try {
      const dataToExport = await getAllDataForExport(selectedOnly);

      if (dataToExport.length === 0) {
        alert('No data to export');
        return;
      }

      console.log(`📊 Exporting ${dataToExport.length} records to JSON`);

      const jsonContent = JSON.stringify({
        metadata: {
          exportDate: new Date().toISOString(),
          totalRecords: dataToExport.length,
          filters: {
            search: searchTerm || null,
            kecamatan: filterKecamatan !== 'all' ? filterKecamatan : null,
            status: filterStatus !== 'all' ? filterStatus : null
          },
          selectedOnly: selectedOnly
        },
        data: dataToExport
      }, null, 2);
      
      const blob = new Blob([jsonContent], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      const timestamp = new Date().toISOString().split('T')[0];
      const filterSuffix = searchTerm || filterKecamatan !== 'all' || filterStatus !== 'all' ? '-filtered' : '';
      const selectionSuffix = selectedOnly ? '-selected' : '';
      
      a.download = `businesses${filterSuffix}${selectionSuffix}-${timestamp}.json`;
      a.click();
      window.URL.revokeObjectURL(url);
      
      setShowExportOptions(false);
      setSelectedBusinesses(new Set());
      
      alert(`✅ Successfully exported ${dataToExport.length} records to JSON!`);
      
    } catch (error) {
      console.error('Error exporting to JSON:', error);
      alert(`Error exporting to JSON: ${error.message}`);
    }
  };

  // Other handlers
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleKecamatanFilter = (e) => {
    setFilterKecamatan(e.target.value);
    setCurrentPage(1);
  };

  const handleStatusFilter = (e) => {
    setFilterStatus(e.target.value);
    setCurrentPage(1);
  };

  const handleSelectBusiness = (businessId) => {
    const newSelected = new Set(selectedBusinesses);
    if (newSelected.has(businessId)) {
      newSelected.delete(businessId);
    } else {
      newSelected.add(businessId);
    }
    setSelectedBusinesses(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedBusinesses.size === businesses.length) {
      setSelectedBusinesses(new Set());
    } else {
      setSelectedBusinesses(new Set(businesses.map(b => b.id)));
    }
  };

  const bulkDelete = async () => {
    if (selectedBusinesses.size === 0) {
      alert('Please select businesses to delete');
      return;
    }

    const confirmMessage = `Are you sure you want to delete ${selectedBusinesses.size} selected businesses? This action cannot be undone.`;
    
    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      setLoading(true);
      
      for (const businessId of selectedBusinesses) {
        await businessService.deleteBusiness(businessId);
      }
      
      alert(`Successfully deleted ${selectedBusinesses.size} businesses`);
      setSelectedBusinesses(new Set());
      await loadBusinesses();
      await loadInitialData();
      
    } catch (error) {
      console.error('Error deleting businesses:', error);
      alert(`Error deleting businesses: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    await Promise.all([
      loadBusinesses(),
      loadInitialData()
    ]);
  };

  const getExportCount = async () => {
    try {
      if (!searchTerm && filterKecamatan === 'all' && filterStatus === 'all') {
        const totalInDb = await businessService.getTotalCount();
        return totalInDb;
      }
      
      const filters = {};
      if (searchTerm.trim()) filters.search = searchTerm;
      if (filterKecamatan !== 'all') filters.kecamatan = filterKecamatan;
      if (filterStatus !== 'all') filters.statusToko = filterStatus;
      
      const result = await businessService.getBusinessesPaginated(1, 1, filters);
      return result.total;
    } catch (error) {
      console.error('Error getting export count:', error);
      return totalCount;
    }
  };

  // Import Modal Component
  const ImportModal = ({ isOpen, onClose }) => {
    const [importType, setImportType] = useState('spreadsheet');
    const [spreadsheetId, setSpreadsheetId] = useState('');
    const [sheetId, setSheetId] = useState('0');
    const [selectedFile, setSelectedFile] = useState(null);

    const handleFileSelect = (event) => {
      const file = event.target.files[0];
      if (file) {
        if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
          setSelectedFile(file);
        } else {
          alert('Please select a valid CSV file');
          event.target.value = '';
        }
      }
    };

    const handleImportSubmit = () => {
      if (importType === 'spreadsheet') {
        if (!spreadsheetId.trim()) {
          alert('Please enter a valid Spreadsheet ID');
          return;
        }
        handleImportFromSpreadsheet(spreadsheetId.trim(), sheetId.trim() || '0');
      } else {
        if (!selectedFile) {
          alert('Please select a CSV file');
          return;
        }
        handleImportFromCSV(selectedFile);
      }
      onClose();
    };

    const handleQuickImport = () => {
      handleImportFromSpreadsheet('1GlSR2ISC-B75n5Fml59-9f-bzjj4Ks5r', '2121251766');
      onClose();
    };

    if (!isOpen) return null;

    return (
      <div className="import-modal-overlay">
        <div className="import-modal">
          <div className="import-modal-header">
            <h3>📥 Import Data (Full Import Mode)</h3>
            <button onClick={onClose} className="close-btn">✕</button>
          </div>
          
          <div className="import-modal-content">
            {/* Quick Import */}
            <div className="import-option-group">
              <h4>🚀 Quick Import (Default Spreadsheet)</h4>
              <p>Import semua data dari spreadsheet tanpa deteksi duplikasi</p>
              <div className="import-notice">
                <strong>⚠️ Mode Full Import:</strong> Semua data valid akan diimport, termasuk yang mungkin duplikat. Hanya data dengan nama usaha kosong yang akan difilter.
              </div>
              <button 
                onClick={handleQuickImport}
                disabled={importLoading}
                className="import-quick-btn"
              >
                {importLoading ? '⏳ Importing...' : '🚀 Import Semua Data'}
              </button>
            </div>

            <div className="import-divider">OR</div>

            {/* Import Type Selection */}
            <div className="import-type-selection">
              <h4>📊 Custom Import</h4>
              <div className="import-type-tabs">
                <button 
                  className={`import-tab ${importType === 'spreadsheet' ? 'active' : ''}`}
                  onClick={() => setImportType('spreadsheet')}
                >
                  📊 Google Sheets
                </button>
                <button 
                  className={`import-tab ${importType === 'csv' ? 'active' : ''}`}
                  onClick={() => setImportType('csv')}
                >
                  📄 CSV File
                </button>
              </div>
            </div>

            {/* Google Sheets Import */}
            {importType === 'spreadsheet' && (
              <div className="import-option-group">
                <h4>📊 Import from Google Sheets</h4>
                <div className="import-form">
                  <div className="form-group">
                    <label>Spreadsheet ID *</label>
                    <input
                      type="text"
                      value={spreadsheetId}
                      onChange={(e) => setSpreadsheetId(e.target.value)}
                      placeholder="1GlSR2ISC-B75n5Fml59-9f-bzjj4Ks5r"
                      className="import-input"
                    />
                    <small>Get this from the Google Sheets URL</small>
                  </div>
                  <div className="form-group">
                    <label>Sheet ID (Optional)</label>
                    <input
                      type="text"
                      value={sheetId}
                      onChange={(e) => setSheetId(e.target.value)}
                      placeholder="0"
                      className="import-input"
                    />
                    <small>Leave as "0" for the first sheet</small>
                  </div>
                </div>
              </div>
            )}

            {/* CSV File Import */}
            {importType === 'csv' && (
              <div className="import-option-group">
                <h4>📄 Import from CSV File</h4>
                <div className="import-form">
                  <div className="form-group">
                    <label>Select CSV File *</label>
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleFileSelect}
                      className="import-file-input"
                    />
                    {selectedFile && (
                      <div className="selected-file">
                        ✅ Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                      </div>
                    )}
                    <small>File must be in CSV format with headers in the first row</small>
                  </div>
                </div>
              </div>
            )}

            {/* Import Button */}
            <div className="import-actions">
              <button 
                onClick={handleImportSubmit}
                disabled={importLoading || (importType === 'spreadsheet' && !spreadsheetId.trim()) || (importType === 'csv' && !selectedFile)}
                className="import-submit-btn"
              >
                {importLoading ? '⏳ Importing...' : '📥 Start Full Import'}
              </button>
            </div>

            {/* Import Instructions */}
            <div className="import-instructions">
              <h4>📋 Import Instructions (Full Mode)</h4>
              <ul>
                <li><strong>Full Import:</strong> Semua data valid akan diimport tanpa pengecekan duplikasi</li>
                <li><strong>Google Sheets:</strong> Pastikan spreadsheet dapat diakses publik</li>
                <li><strong>CSV Format:</strong> Baris pertama harus berisi header kolom</li>
                <li><strong>Data Cleaning:</strong> Hanya data dengan nama usaha kosong yang akan difilter</li>
                <li><strong>Performance:</strong> File besar akan diproses dalam batch untuk stabilitas</li>
                <li><strong>Backup:</strong> Disarankan export data existing sebelum import besar</li>
                <li><strong>Duplicates:</strong> Data duplikat dapat dikelola nanti menggunakan Duplicate Manager</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Export Modal Component
  const ExportModal = ({ isOpen, onClose, onExport, selectedCount }) => {
    const [exportCount, setExportCount] = useState(totalCount);

    useEffect(() => {
      if (isOpen) {
        getExportCount().then(setExportCount);
      }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
      <div className="export-modal-overlay">
        <div className="export-modal">
          <div className="export-modal-header">
            <h3>📥 Export Data</h3>
            <button onClick={onClose} className="close-btn">✕</button>
          </div>
          
          <div className="export-modal-content">
            <div className="export-option-group">
              <h4>Export All Data ({exportCount.toLocaleString()} records)</h4>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '0 0 12px 0' }}>
                {searchTerm || filterKecamatan !== 'all' || filterStatus !== 'all' 
                  ? 'Will export all data matching current filters' 
                  : 'Will export ALL data from database'
                }
              </p>
              {exportCount > 10000 && (
                <p style={{ fontSize: '11px', color: 'var(--danger-color)', margin: '0 0 12px 0' }}>
                  ⚠️ Large dataset detected. Export may take several minutes.
                </p>
              )}
              <div className="export-buttons">
                <button 
                  onClick={() => { onExport('csv', false); onClose(); }} 
                  className="export-modal-btn"
                  disabled={exportLoading}
                >
                  {exportLoading ? '⏳ Preparing...' : '📄 CSV Format'}
                </button>
                <button 
                  onClick={() => { onExport('json', false); onClose(); }} 
                  className="export-modal-btn"
                  disabled={exportLoading}
                >
                  {exportLoading ? '⏳ Preparing...' : '📄 JSON Format'}
                </button>
              </div>
            </div>
            
            {selectedCount > 0 && (
              <div className="export-option-group">
                <h4>Export Selected ({selectedCount} records)</h4>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '0 0 12px 0' }}>
                  Will export only the selected records from current page
                </p>
                <div className="export-buttons">
                  <button 
                    onClick={() => { onExport('csv', true); onClose(); }} 
                    className="export-modal-btn"
                    disabled={exportLoading}
                  >
                    {exportLoading ? '⏳ Preparing...' : '📄 CSV Format'}
                  </button>
                  <button 
                    onClick={() => { onExport('json', true); onClose(); }} 
                    className="export-modal-btn"
                    disabled={exportLoading}
                  >
                    {exportLoading ? '⏳ Preparing...' : '📄 JSON Format'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="admin-panel-overlay">
      <div className="admin-panel">
        <div className="admin-header">
          <div className="header-left">
            <h2>📊 Admin Panel - Database Management</h2>
            <p>Manage and view all business data</p>
          </div>
          <button onClick={onClose} className="close-btn">✕</button>
        </div>

        {/* Filters */}
        <div className="admin-filters">
          <div className="filter-group">
            <input
              type="text"
              placeholder="Search businesses..."
              value={searchTerm}
              onChange={handleSearch}
              className="search-input"
            />
          </div>
          
          <div className="filter-group">
            <select value={filterKecamatan} onChange={handleKecamatanFilter} className="filter-select">
              <option value="all">All Kecamatan</option>
              {kecamatanList.map(kec => (
                <option key={kec} value={kec}>{kec}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <select value={filterStatus} onChange={handleStatusFilter} className="filter-select">
              <option value="all">All Status</option>
              <option value="BUKA">BUKA</option>
              <option value="TUTUP">TUTUP</option>
            </select>
          </div>

          <button onClick={refreshData} className="refresh-btn" disabled={loading}>
            🔄 Refresh
          </button>
        </div>

        {/* Actions */}
        <div className="admin-actions">
          <div className="action-group">
            <span className="selection-info">
              {selectedBusinesses.size > 0 ? `${selectedBusinesses.size} selected` : `${totalCount.toLocaleString()} total results`}
            </span>
          </div>

          <div className="action-group">
            {/* NEW: Import Button */}
            <button 
              onClick={() => setShowImportModal(true)}
              disabled={loading || importLoading || resetLoading}
              className="import-btn"
              style={{ 
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: 'white'
              }}
            >
              {importLoading ? '⏳ Importing...' : '📥 Import Data'}
            </button>

            {selectedBusinesses.size > 0 && (
              <button onClick={bulkDelete} className="delete-btn" disabled={loading}>
                🗑️ Delete Selected ({selectedBusinesses.size})
              </button>
            )}
            
            <div className="export-dropdown">
              <button 
                onClick={() => setShowExportOptions(!showExportOptions)} 
                className="export-btn"
                disabled={loading || exportLoading}
              >
                {exportLoading ? '⏳ Preparing...' : '📤 Export Data'}
              </button>
              
              {showExportOptions && (
                <div className="export-options">
                  <button onClick={() => exportToCSV(false)} disabled={exportLoading}>
                    📄 Export All to CSV
                  </button>
                  <button onClick={() => exportToJSON(false)} disabled={exportLoading}>
                    📄 Export All to JSON
                  </button>
                  {selectedBusinesses.size > 0 && (
                    <>
                      <button onClick={() => exportToCSV(true)} disabled={exportLoading}>
                        📄 Export Selected to CSV ({selectedBusinesses.size} records)
                      </button>
                      <button onClick={() => exportToJSON(true)} disabled={exportLoading}>
                        📄 Export Selected to JSON ({selectedBusinesses.size} records)
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Database Management Buttons */}
            <button 
              onClick={handleResetDatabase}
              disabled={loading || resetLoading || exportLoading || importLoading}
              className="reset-btn"
              style={{ 
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                color: 'white',
                marginLeft: '8px'
              }}
            >
              {resetLoading ? '⏳ Resetting...' : '🔄 Reset Database'}
            </button>

            <button 
              onClick={handleDeleteAllData}
              disabled={loading || resetLoading || exportLoading || importLoading}
              className="delete-all-btn"
              style={{ 
                background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
                color: 'white',
                marginLeft: '8px'
              }}
            >
              {loading ? '⏳ Deleting...' : '🗑️ Delete All Data'}
            </button>
          </div>
        </div>

        {/* Progress Indicators */}
        {resetLoading && (
          <div className="progress-banner reset-progress">
            <div className="progress-content">
              <div className="progress-info">
                <span className="progress-text">Database Reset Progress</span>
                <span className="progress-message">{resetProgress.message}</span>
              </div>
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${resetProgress.progress}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {importLoading && (
          <div className="progress-banner import-progress">
            <div className="progress-content">
              <div className="progress-info">
                <span className="progress-text">Import Progress</span>
                <span className="progress-message">{importProgress.message}</span>
              </div>
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${importProgress.progress}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {exportLoading && (
          <div style={{ 
            padding: '12px 32px', 
            background: 'var(--bg-secondary)', 
            borderBottom: '1px solid var(--border-primary)',
            textAlign: 'center',
            color: 'var(--primary-color)',
            fontWeight: '600'
          }}>
            ⏳ Preparing export data... This may take a moment for large datasets.
          </div>
        )}

        {/* Table */}
        <div className="table-container">
          {loading && <div className="table-loading">Loading...</div>}
          
          <table className="business-table">
            <thead>
              <tr>
                <th>
                  <input
                    type="checkbox"
                    checked={selectedBusinesses.size === businesses.length && businesses.length > 0}
                    onChange={handleSelectAll}
                  />
                </th>
                <th>No</th>
                <th>Nama Usaha</th>
                <th>Alamat</th>
                <th>Kecamatan</th>
                <th>Desa</th>
                <th>No Telp</th>
                <th>Email</th>
                <th>Jenis Usaha</th>
                <th>Status Toko</th>
                <th>Petugas</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {businesses.map((business, index) => (
                <tr key={business.id} className={selectedBusinesses.has(business.id) ? 'selected' : ''}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedBusinesses.has(business.id)}
                      onChange={() => handleSelectBusiness(business.id)}
                    />
                  </td>
                  <td>{(currentPage - 1) * itemsPerPage + index + 1}</td>
                  <td className="business-name" title={business.nama_usaha}>
                    {business.nama_usaha}
                  </td>
                  <td className="address" title={business.alamat}>
                    {business.alamat || '-'}
                  </td>
                  <td>{business.kecamatan || '-'}</td>
                  <td>{business.desa || '-'}</td>
                  <td>{business.no_telp || '-'}</td>
                  <td>{business.email || '-'}</td>
                  <td>{business.jenis_usaha || '-'}</td>
                  <td>
                    <span className={`status-badge ${(business.status_toko || 'buka').toLowerCase()}`}>
                      {business.status_toko || 'BUKA'}
                    </span>
                  </td>
                  <td>{business.nama_petugas || '-'}</td>
                  <td>{business.created_at ? new Date(business.created_at).toLocaleDateString() : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="admin-pagination">
          <div className="pagination-info">
            Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount.toLocaleString()} entries
          </div>
          
          <div className="pagination-controls">
            <button 
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1 || loading}
              className="pagination-btn"
            >
              First
            </button>
            <button 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1 || loading}
              className="pagination-btn"
            >
              Previous
            </button>
            
            <span className="page-info">
              Page {currentPage} of {totalPages}
            </span>
            
            <button 
              onClick={() => setCurrentPage(p => p + 1)}
              disabled={currentPage >= totalPages || loading}
              className="pagination-btn"
            >
              Next
            </button>
            <button 
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages || loading}
              className="pagination-btn"
            >
              Last
            </button>
          </div>
        </div>

        {/* Modals */}
        <ImportModal 
          isOpen={showImportModal}
          onClose={() => setShowImportModal(false)}
        />

        <ExportModal 
          isOpen={showExportModal}
          onClose={() => setShowExportModal(false)}
          onExport={(format, selectedOnly) => {
            if (format === 'csv') {
              exportToCSV(selectedOnly);
            } else {
              exportToJSON(selectedOnly);
            }
          }}
          selectedCount={selectedBusinesses.size}
        />
      </div>
    </div>
  );
};

export default AdminPanel;
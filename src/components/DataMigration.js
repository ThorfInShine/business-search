import React, { useState, useEffect } from 'react'
import { migrationService } from '../services/migrationService'
import { businessService } from '../services/businessService'
import { DEFAULT_SPREADSHEET_ID, DEFAULT_SHEET_ID } from '../services/googleSheetsAPI'
import './DataMigration.css'

const DataMigration = ({ onMigrationComplete }) => {
  const [dbStatus, setDbStatus] = useState(null)
  const [isImporting, setIsImporting] = useState(false)
  const [progress, setProgress] = useState(0)
  const [progressMessage, setProgressMessage] = useState('')
  const [error, setError] = useState(null)
  const [customSpreadsheet, setCustomSpreadsheet] = useState({
    id: '',
    sheetId: ''
  })

  // Check database status on mount
  useEffect(() => {
    checkDbStatus()
  }, [])

  const checkDbStatus = async () => {
    try {
      const status = await migrationService.checkDatabaseStatus()
      const stats = await businessService.getStatistics()
      setDbStatus({
        ...status,
        stats
      })
    } catch (error) {
      console.error('Error checking database status:', error)
      setError(error.message)
    }
  }

  const handleImportDefault = async () => {
    await handleImport(DEFAULT_SPREADSHEET_ID, DEFAULT_SHEET_ID)
  }

  const handleImportCustom = async () => {
    if (!customSpreadsheet.id.trim()) {
      setError('Spreadsheet ID tidak boleh kosong')
      return
    }
    
    await handleImport(customSpreadsheet.id, customSpreadsheet.sheetId || '0')
  }

  const handleImport = async (spreadsheetId, sheetId) => {
    setIsImporting(true)
    setError(null)
    setProgress(0)
    setProgressMessage('Memulai import...')

    try {
      const result = await migrationService.importSpreadsheetToDatabase(
        spreadsheetId,
        sheetId,
        (message, progressValue) => {
          setProgressMessage(message)
          setProgress(progressValue)
        }
      )

      // Refresh database status
      await checkDbStatus()

      // Notify parent component
      if (onMigrationComplete) {
        onMigrationComplete(result)
      }

      setProgressMessage(`✅ Import berhasil! ${result.totalImported} data tersimpan.`)

    } catch (error) {
      console.error('Import error:', error)
      setError(error.message)
      setProgressMessage('❌ Import gagal')
    } finally {
      setIsImporting(false)
    }
  }

  const handleSyncFromSpreadsheet = async () => {
    setIsImporting(true)
    setError(null)
    setProgress(0)
    setProgressMessage('Menyinkronkan dari spreadsheet...')

    try {
      const result = await migrationService.syncFromSpreadsheet(
        DEFAULT_SPREADSHEET_ID,
        DEFAULT_SHEET_ID,
        (message, progressValue) => {
          setProgressMessage(message)
          setProgress(progressValue)
        }
      )

      await checkDbStatus()

      if (onMigrationComplete) {
        onMigrationComplete(result)
      }

      setProgressMessage(`✅ Sinkronisasi berhasil! ${result.totalSynced} data diperbarui.`)

    } catch (error) {
      console.error('Sync error:', error)
      setError(error.message)
      setProgressMessage('❌ Sinkronisasi gagal')
    } finally {
      setIsImporting(false)
    }
  }

  return (
    <div className="data-migration">
      <div className="migration-header">
        <h2>🔄 Manajemen Data Database</h2>
        <p>Import dan sinkronisasi data dari Google Sheets ke Database</p>
      </div>

      {/* Database Status */}
      <div className="db-status">
        <h3>📊 Status Database</h3>
        {dbStatus ? (
          <div className={`status-card ${dbStatus.hasData ? 'has-data' : 'empty'}`}>
            {dbStatus.hasData ? (
              <>
                <div className="status-icon">✅</div>
                <div className="status-info">
                  <strong>Database berisi data</strong>
                  <p>{dbStatus.count.toLocaleString()} usaha tersimpan</p>
                  {dbStatus.stats && (
                    <div className="stats-summary">
                      <small>
                        Status: {Object.entries(dbStatus.stats.byStatus).map(([status, count]) => 
                          `${status}: ${count}`
                        ).join(', ')}
                      </small>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="status-icon">📭</div>
                <div className="status-info">
                  <strong>Database kosong</strong>
                  <p>Belum ada data yang diimport</p>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="status-loading">Memeriksa status database...</div>
        )}
      </div>

      {/* Quick Actions */}
      {dbStatus?.hasData && (
        <div className="quick-actions">
          <h3>🚀 Aksi Cepat</h3>
          <div className="action-buttons">
            <button 
              onClick={handleSyncFromSpreadsheet}
              disabled={isImporting}
              className="action-btn primary"
            >
              {isImporting ? '⏳ Syncing...' : '🔄 Sync dari Spreadsheet'}
            </button>
            <button 
              onClick={checkDbStatus}
              disabled={isImporting}
              className="action-btn secondary"
            >
              🔍 Refresh Status
            </button>
          </div>
        </div>
      )}

      {/* Import Options */}
      <div className="import-options">
        <h3>📥 Opsi Import</h3>
        
        {/* Default Spreadsheet */}
        <div className="import-option">
          <h4>1. Import dari Spreadsheet Default</h4>
          <p>Import dari spreadsheet utama yang sudah dikonfigurasi</p>
          <button 
            onClick={handleImportDefault}
            disabled={isImporting}
            className="import-btn primary"
          >
            {isImporting ? '⏳ Importing...' : '🚀 Import Data Default'}
          </button>
        </div>

        {/* Custom Spreadsheet */}
        <div className="import-option">
          <h4>2. Import dari Spreadsheet Custom</h4>
          <p>Import dari Google Sheets lain dengan memasukkan ID spreadsheet</p>
          
          <div className="custom-form">
            <div className="form-group">
              <label>Spreadsheet ID:</label>
              <input
                type="text"
                value={customSpreadsheet.id}
                onChange={(e) => setCustomSpreadsheet({...customSpreadsheet, id: e.target.value})}
                placeholder="1GlSR2ISC-B75n5Fml59-9f-bzjj4Ks5r"
                disabled={isImporting}
              />
            </div>
            
            <div className="form-group">
              <label>Sheet ID (opsional):</label>
              <input
                type="text"
                value={customSpreadsheet.sheetId}
                onChange={(e) => setCustomSpreadsheet({...customSpreadsheet, sheetId: e.target.value})}
                placeholder="0"
                disabled={isImporting}
              />
            </div>
            
            <button 
              onClick={handleImportCustom}
              disabled={isImporting || !customSpreadsheet.id.trim()}
              className="import-btn secondary"
            >
              {isImporting ? '⏳ Importing...' : '📊 Import Custom Data'}
            </button>
          </div>
        </div>
      </div>

      {/* Progress */}
      {isImporting && (
        <div className="import-progress">
          <div className="progress-header">
            <h4>⏳ Progress</h4>
            <span>{progress}%</span>
          </div>
          
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${progress}%` }}
            />
          </div>
          
          <div className="progress-message">
            {progressMessage}
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="error-message">
          <h4>❌ Error</h4>
          <p>{error}</p>
          <button onClick={() => setError(null)} className="dismiss-btn">
            Tutup
          </button>
        </div>
      )}

      {/* Success Message */}
      {!isImporting && progressMessage.includes('✅') && (
        <div className="success-message">
          <h4>🎉 Berhasil!</h4>
          <p>{progressMessage}</p>
          <button onClick={() => setProgressMessage('')} className="dismiss-btn">
            Tutup
          </button>
        </div>
      )}

      {/* Instructions */}
      <div className="instructions">
        <h3>📋 Petunjuk</h3>
        <ol>
          <li><strong>Database-First:</strong> Aplikasi sekarang menggunakan database sebagai sumber utama</li>
          <li><strong>Import:</strong> Gunakan untuk migrasi awal dari spreadsheet ke database</li>
          <li><strong>Sync:</strong> Gunakan untuk memperbarui data dari spreadsheet ke database</li>
          <li><strong>Real-time:</strong> Perubahan data akan langsung tersinkron antar pengguna</li>
          <li><strong>Backup:</strong> Data spreadsheet tetap bisa diakses sebagai fallback</li>
        </ol>
      </div>
    </div>
  )
}

export default DataMigration
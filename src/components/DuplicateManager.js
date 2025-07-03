import React, { useState, useEffect } from 'react'
import { businessService } from '../services/businessService'
import './DuplicateManager.css'

const DuplicateManager = ({ onClose }) => {
  const [duplicates, setDuplicates] = useState([])
  const [duplicateStats, setDuplicateStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [bulkProcessing, setBulkProcessing] = useState(false)
  const [bulkProgress, setBulkProgress] = useState({ current: 0, total: 0, message: '' })
  const [currentPage, setCurrentPage] = useState(0)
  const [hasMoreData, setHasMoreData] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)

  const ITEMS_PER_PAGE = 50

  useEffect(() => {
    loadInitialData()
  }, [])

  const loadInitialData = async () => {
    try {
      setLoading(true)
      
      // Load statistics with error handling
      let statsData = {
        totalGroups: 0,
        totalDuplicates: 0,
        largestGroup: 0,
        groupsWithManyDuplicates: 0
      };
      
      try {
        statsData = await businessService.getDuplicateStatistics();
      } catch (statsError) {
        console.warn('Failed to load duplicate statistics:', statsError);
        // Continue with default stats
      }
      
      setDuplicateStats(statsData);
      
      // Load first batch of duplicates
      await loadDuplicates(0, true);
      
      console.log('📊 Initial duplicate data loaded:', statsData);
    } catch (error) {
      console.error('Error loading initial data:', error);
      // Set default stats instead of showing alert
      setDuplicateStats({
        totalGroups: 0,
        totalDuplicates: 0,
        largestGroup: 0,
        groupsWithManyDuplicates: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const loadDuplicates = async (page = 0, replace = false) => {
    try {
      if (!replace) setLoadingMore(true);
      
      const offset = page * ITEMS_PER_PAGE;
      let duplicatesData = [];
      
      try {
        duplicatesData = await businessService.getPotentialDuplicates(ITEMS_PER_PAGE, offset);
      } catch (duplicatesError) {
        console.warn('Failed to load duplicates:', duplicatesError);
        // Continue with empty array
      }
      
      if (replace) {
        setDuplicates(duplicatesData);
        setCurrentPage(0);
      } else {
        setDuplicates(prev => [...prev, ...duplicatesData]);
        setCurrentPage(page);
      }
      
      setHasMoreData(duplicatesData.length === ITEMS_PER_PAGE);
      
    } catch (error) {
      console.error('Error loading duplicates:', error);
      // Don't show alert, just log error
    } finally {
      setLoadingMore(false);
    }
  };

  const loadMoreDuplicates = () => {
    if (!loadingMore && hasMoreData) {
      loadDuplicates(currentPage + 1, false)
    }
  }

  const handleMerge = async (keepId, mergeIds) => {
    if (!window.confirm(`Merge ${mergeIds.length} duplicate records?`)) {
      return
    }

    try {
      setProcessing(true)
      await businessService.mergeDuplicates(keepId, mergeIds)
      alert('Duplicates merged successfully!')
      await loadInitialData() // Reload all data
    } catch (error) {
      console.error('Error merging duplicates:', error)
      alert(`Error: ${error.message}`)
    } finally {
      setProcessing(false)
    }
  }

  // NEW: Add batch merge option
  const handleBatchMerge = async () => {
    if (!duplicateStats || duplicateStats.totalGroups === 0) {
      alert('No duplicates found to merge!')
      return
    }

    try {
      setProcessing(true)
      
      const result = await businessService.mergeDuplicatesBatch(10);
      
      alert(`✅ Batch merge completed!\n\n• ${result.processedGroups} groups processed\n• ${result.mergedRecords} duplicates merged\n• Processing time: ${result.processingTime}`)
      
      await loadInitialData() // Reload data
      
    } catch (error) {
      console.error('Error in batch merge:', error)
      alert(`Error during batch merge: ${error.message}`)
    } finally {
      setProcessing(false)
    }
  }

  const handleBulkMergeAll = async () => {
    if (!duplicateStats || duplicateStats.totalGroups === 0) {
      alert('No duplicates found to merge!')
      return
    }

    const confirmMessage = `
⚠️ BULK MERGE ALL DUPLICATES ⚠️

This will automatically merge duplicate groups:
• ${duplicateStats.totalGroups} duplicate groups found
• ${duplicateStats.totalDuplicates} total duplicates will be merged
• Processing will be done in small batches for stability
• For each group, the OLDEST record will be kept
• This action CANNOT be undone

Are you sure you want to proceed?
    `.trim()

    if (!window.confirm(confirmMessage)) {
      return
    }

    // Double confirmation for safety
    if (!window.confirm('This is your FINAL confirmation. Proceed with bulk merge?')) {
      return
    }

    try {
      setBulkProcessing(true)
      setBulkProgress({ 
        current: 0, 
        total: duplicateStats.totalGroups, 
        message: 'Starting progressive bulk merge...' 
      })
      
      // Use progressive bulk merge for better stability
      const result = await businessService.progressiveBulkMerge((message, progress) => {
        setBulkProgress({ 
          current: Math.floor((progress / 100) * duplicateStats.totalGroups), 
          total: duplicateStats.totalGroups, 
          message: message 
        });
      });
      
      setBulkProgress({ 
        current: result.processedGroups, 
        total: result.processedGroups, 
        message: `Completed! Merged ${result.mergedRecords} duplicate records in ${result.batches} batches.` 
      })
      
      // Reload data after bulk merge
      setTimeout(async () => {
        await loadInitialData()
        setBulkProcessing(false)
        setBulkProgress({ current: 0, total: 0, message: '' })
        
        alert(`✅ Progressive bulk merge completed!\n\n• ${result.processedGroups} groups processed\n• ${result.mergedRecords} duplicate records merged\n• Processed in ${result.batches} stable batches`)
      }, 2000)
      
    } catch (error) {
      console.error('Error in bulk merge:', error)
      alert(`Error during bulk merge: ${error.message}\n\nTry using smaller batches or manual merge for remaining duplicates.`)
      setBulkProcessing(false)
      setBulkProgress({ current: 0, total: 0, message: '' })
    }
  }

  if (loading) {
    return (
      <div className="duplicate-manager-overlay">
        <div className="duplicate-manager">
          <div className="loading">
            <div className="spinner"></div>
            <p>Loading duplicates...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="duplicate-manager-overlay">
      <div className="duplicate-manager">
        <div className="header">
          <h2>🔍 Duplicate Manager (Stable)</h2>
          <button onClick={onClose} className="close-btn">✕</button>
        </div>

        <div className="content">
          {duplicateStats && duplicateStats.totalGroups === 0 ? (
            <div className="no-duplicates">
              <h3>✅ No Duplicates Found</h3>
              <p>All businesses appear to be unique!</p>
            </div>
          ) : (
            <>
              {/* Duplicate Statistics */}
              <div className="duplicate-stats">
                <h3>📊 Duplicate Statistics</h3>
                <div className="stats-grid">
                  <div className="stat-card">
                    <span className="stat-number">{duplicateStats?.totalGroups || 0}</span>
                    <span className="stat-label">Duplicate Groups</span>
                  </div>
                  <div className="stat-card">
                    <span className="stat-number">{duplicateStats?.totalDuplicates || 0}</span>
                    <span className="stat-label">Total Duplicates</span>
                  </div>
                  <div className="stat-card">
                    <span className="stat-number">{duplicateStats?.largestGroup || 0}</span>
                    <span className="stat-label">Largest Group</span>
                  </div>
                  <div className="stat-card">
                    <span className="stat-number">{duplicateStats?.groupsWithManyDuplicates || 0}</span>
                    <span className="stat-label">Groups with 5+ Dupes</span>
                  </div>
                </div>
              </div>

              {/* Bulk Actions */}
              <div className="bulk-actions">
                <h3>⚡ Bulk Actions (Stable)</h3>
                <div className="bulk-buttons">
                  <button 
                    onClick={handleBatchMerge}
                    disabled={bulkProcessing || processing}
                    className="bulk-merge-btn"
                    style={{ background: 'linear-gradient(135deg, var(--secondary-color) 0%, var(--secondary-dark) 100%)' }}
                  >
                    {processing ? '⏳ Processing...' : '🔥 Merge 10 Groups (Safe)'}
                  </button>
                  
                  <button 
                    onClick={handleBulkMergeAll}
                    disabled={bulkProcessing || processing}
                    className="bulk-merge-btn"
                  >
                    {bulkProcessing ? '⏳ Processing...' : '⚡ Progressive Merge All'}
                  </button>
                  
                  <div className="bulk-warning">
                    <small>⚠️ Uses progressive batching for maximum stability. Safe for large datasets.</small>
                  </div>
                </div>
              </div>

              {/* Bulk Progress */}
              {bulkProcessing && (
                <div className="bulk-progress">
                  <h4>🔄 Progressive Bulk Merge Progress</h4>
                  <div className="progress-bar">
                    <div 
                      className="progress-fill" 
                      style={{ width: `${bulkProgress.total > 0 ? (bulkProgress.current / bulkProgress.total) * 100 : 0}%` }}
                    />
                  </div>
                  <div className="progress-text">
                    {bulkProgress.current} / {bulkProgress.total} groups processed
                  </div>
                  <div className="progress-message">
                    {bulkProgress.message}
                  </div>
                </div>
              )}

              {/* Individual Duplicate Groups */}
              <div className="duplicate-groups">
                <h3>🔍 Manual Review ({duplicates.length} Groups Loaded)</h3>
                <div className="groups-container">
                  {duplicates.map((group, index) => (
                    <DuplicateGroup
                      key={`${group.clean_name}-${index}`}
                      group={group}
                      onMerge={handleMerge}
                      processing={processing || bulkProcessing}
                    />
                  ))}
                  
                  {/* Load More Button */}
                  {hasMoreData && (
                    <div className="load-more-container">
                      <button 
                        onClick={loadMoreDuplicates}
                        disabled={loadingMore}
                        className="load-more-btn"
                      >
                        {loadingMore ? '⏳ Loading...' : '📄 Load More Groups'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

const DuplicateGroup = ({ group, onMerge, processing }) => {
  const [selectedKeep, setSelectedKeep] = useState(group.business_ids[0])

  const handleMerge = () => {
    const mergeIds = group.business_ids.filter(id => id !== selectedKeep)
    onMerge(selectedKeep, mergeIds)
  }

  return (
    <div className="duplicate-group">
      <div className="group-header">
        <h4>"{group.clean_name}" - {group.count} duplicates</h4>
        <p>Location: {group.clean_address}, {group.clean_kecamatan}</p>
      </div>

      <div className="businesses">
        {group.business_ids.map((id, index) => (
          <div key={id} className="business-item">
            <label>
              <input
                type="radio"
                name={`keep-${group.clean_name}-${index}`}
                value={id}
                checked={selectedKeep === id}
                onChange={(e) => setSelectedKeep(e.target.value)}
                disabled={processing}
              />
              <div className="business-info">
                <strong>{group.original_names[index]}</strong>
                <small>Created: {new Date(group.created_dates[index]).toLocaleDateString()}</small>
              </div>
            </label>
          </div>
        ))}
      </div>

      <div className="actions">
        <button 
          onClick={handleMerge}
          disabled={processing}
          className="merge-btn"
        >
          {processing ? 'Processing...' : `Merge (Keep Selected)`}
        </button>
      </div>
    </div>
  )
}

export default DuplicateManager
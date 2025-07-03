import { businessService } from './businessService'
import { fetchCSVData } from './csvService'
import { processCSVData } from '../utils/dataProcessor'
import { supabase } from './supabaseClient'

export const migrationService = {
  // Convert processed data to database format with unique identifier
  convertToDbFormat(processedData) {
    return processedData.map((business, index) => ({
      nama_usaha: business.namaUsaha,
      alamat: business.alamat,
      alamat_lengkap: business.alamatLengkap,
      rt: business.rt,
      rw: business.rw,
      dusun: business.dusun,
      kode_wilayah: business.kodeWilayah,
      propinsi: business.propinsi,
      kabupaten: business.kabupaten,
      kecamatan: business.kecamatan,
      desa: business.desa,
      nmsls: business.nmsls,
      nmsls_parsed: business.nmslsParsed,
      no_telp: business.noTelp,
      latitude: business.latitude || null,
      longitude: business.longitude || null,
      jenis_usaha: business.jenisUsaha,
      kbli: business.kbli,
      kegiatan: business.kegiatan,
      status_toko: business.statusToko,
      nama_petugas: business.namaPetugas,
      email: business.email,
      website: business.website,
      jam_operasional: business.jamOperasional,
      tahun_berdiri: business.tahunBerdiri,
      jumlah_karyawan: business.jumlahKaryawan,
      omzet: business.omzet,
      modal: business.modal,
      keuntungan: business.keuntungan,
      kelompok_usaha: business.kelompokUsaha,
      status_usaha: business.statusUsaha,
      bentuk_usaha: business.bentukUsaha,
      rating: business.rating || 0,
      deskripsi: business.deskripsi,
      raw_data: business.rawData,
      // Add unique identifier for each import to avoid conflicts
      source_identifier: `import_${Date.now()}_${index}_${Math.random().toString(36).substring(7)}`
    }))
  },

  // UPDATED: Import tanpa deteksi duplikasi
  async importSpreadsheetToDatabase(spreadsheetId, sheetId, onProgress = null) {
    try {
      console.log('🚀 Starting FULL import (NO DUPLICATION DETECTION) to database...')
      console.log(`📋 Import parameters: SpreadsheetID=${spreadsheetId}, SheetID=${sheetId}`)
      
      // Step 1: Fetch raw data from spreadsheet
      console.log('📥 STEP 1: Fetching raw data from spreadsheet...')
      if (onProgress) onProgress('Mengambil data dari spreadsheet...', 10)
      
      const rawData = await fetchCSVData(spreadsheetId, sheetId)
      console.log(`📊 RAW DATA FETCHED: ${rawData.length} records from spreadsheet`)
      
      // Log sample raw data
      if (rawData.length > 0) {
        console.log(`📋 Sample raw data structure:`, Object.keys(rawData[0]))
        console.log(`📋 First raw record:`, rawData[0])
      }
      
      // Step 2: Process the data WITHOUT duplicate removal
      console.log('⚙️ STEP 2: Processing data (NO DUPLICATE DETECTION)...')
      if (onProgress) onProgress('Memproses data tanpa deteksi duplikasi...', 25)
      
      const processedData = processCSVData(rawData, { skipDeduplication: true })
      console.log(`⚙️ PROCESSED DATA: ${processedData.length} records after processing`)
      console.log(`🗑️ PROCESSING LOSS: ${rawData.length - processedData.length} records (only empty names filtered)`)
      
      // Step 3: Convert to database format WITHOUT removing duplicates
      console.log('🔄 STEP 3: Converting to database format (NO DEDUP)...')
      if (onProgress) onProgress('Mengkonversi format data...', 40)
      
      const dbData = this.convertToDbFormat(processedData)
      console.log(`🔄 DB FORMAT READY: ${dbData.length} records prepared for database`)
      
      // Log sample DB data
      if (dbData.length > 0) {
        console.log(`📋 Sample DB record:`, dbData[0])
      }
      
      // Step 4: Import to database without duplicate constraints
      console.log('💾 STEP 4: Importing to database (NO DUPLICATE CONSTRAINTS)...')
      if (onProgress) onProgress('Menyimpan ke database (mode tanpa deteksi duplikasi)...', 50)
      
      const importResult = await this.bulkImportWithoutDuplicateDetection(dbData, (message, progress) => {
        // Map progress from 50-95
        const adjustedProgress = 50 + (progress * 0.45)
        if (onProgress) onProgress(message, adjustedProgress)
      })
      
      console.log(`💾 DATABASE IMPORT RESULT (NO DUPLICATE DETECTION):`)
      console.log(`   - Records sent to database: ${dbData.length}`)
      console.log(`   - Records actually inserted: ${importResult.totalInserted}`)
      console.log(`   - Failed insertions: ${importResult.failed || 0}`)
      
      // Step 5: Verify import
      console.log('✅ STEP 5: Verifying import...')
      if (onProgress) onProgress('Memverifikasi import...', 98)
      
      const totalInDb = await businessService.getTotalCount()
      
      if (onProgress) onProgress('Import selesai!', 100)
      
      // COMPREHENSIVE SUMMARY
      console.log(`\n📊 ===== FULL IMPORT SUMMARY (NO DUPLICATE DETECTION) =====`)
      console.log(`📥 Raw data from spreadsheet: ${rawData.length}`)
      console.log(`⚙️ After processing (no dedup): ${processedData.length}`)
      console.log(`🔄 Converted for database: ${dbData.length}`)
      console.log(`💾 Actually inserted to database: ${importResult.totalInserted}`)
      console.log(`📊 Total in database now: ${totalInDb}`)
      
      console.log(`\n📉 ===== DATA RETENTION ANALYSIS =====`)
      const processingLoss = rawData.length - processedData.length
      const insertionFailed = dbData.length - importResult.totalInserted
      const successRate = ((importResult.totalInserted / rawData.length) * 100).toFixed(1)
      
      console.log(`🗑️ Processing loss (empty names only): ${processingLoss} (${((processingLoss/rawData.length)*100).toFixed(1)}%)`)
      console.log(`💾 Insertion failures: ${insertionFailed} (${((insertionFailed/rawData.length)*100).toFixed(1)}%)`)
      console.log(`✅ Success rate: ${successRate}%`)
      console.log(`🎯 Expected import: ~${rawData.length - processingLoss} records`)
      
      return {
        totalImported: importResult.totalInserted,
        totalInDatabase: totalInDb,
        rawDataCount: rawData.length,
        processedCount: processedData.length,
        noDuplicateDetection: true,
        insertionFailed: insertionFailed,
        breakdown: {
          processingLoss,
          insertionFailed,
          successRate,
          expectedCount: rawData.length - processingLoss
        }
      }
      
    } catch (error) {
      console.error('❌ FULL import (no duplicate detection) failed:', error)
      throw new Error(`Import gagal: ${error.message}`)
    }
  },

  // NEW: Bulk import tanpa deteksi duplikasi
  // NEW: Pure INSERT tanpa constraint checking
async bulkImportWithoutDuplicateDetection(businesses, onProgress = null) {
  try {
    console.log(`🚀 Starting PURE INSERT (NO CONSTRAINTS) of ${businesses.length} businesses...`)
    
    const { data: { user } } = await supabase.auth.getUser()
    const BATCH_SIZE = 1000 // Bisa lebih besar karena tidak ada constraint checking
    let totalInserted = 0
    let totalErrors = 0
    
    if (onProgress) onProgress('Preparing data for pure insert...', 5)
    
    // Prepare data dengan minimal validation
    const preparedData = businesses.map((business, index) => ({
      nama_usaha: business.nama_usaha || '',
      alamat: business.alamat || null,
      alamat_lengkap: business.alamat_lengkap || null,
      rt: business.rt || null,
      rw: business.rw || null,
      dusun: business.dusun || null,
      kode_wilayah: business.kode_wilayah || null,
      propinsi: business.propinsi || 'Jawa Timur',
      kabupaten: business.kabupaten || 'Malang',
      kecamatan: business.kecamatan || null,
      desa: business.desa || null,
      nmsls: business.nmsls || null,
      nmsls_parsed: business.nmsls_parsed || null,
      no_telp: business.no_telp || null,
      latitude: business.latitude || null,
      longitude: business.longitude || null,
      jenis_usaha: business.jenis_usaha || null,
      kbli: business.kbli || null,
      kegiatan: business.kegiatan || null,
      status_toko: business.status_toko || 'BUKA',
      nama_petugas: business.nama_petugas || null,
      email: business.email || null,
      website: business.website || null,
      jam_operasional: business.jam_operasional || null,
      tahun_berdiri: business.tahun_berdiri || null,
      jumlah_karyawan: business.jumlah_karyawan || null,
      omzet: business.omzet || null,
      modal: business.modal || null,
      keuntungan: business.keuntungan || null,
      kelompok_usaha: business.kelompok_usaha || null,
      status_usaha: business.status_usaha || null,
      bentuk_usaha: business.bentuk_usaha || null,
      rating: business.rating || 0,
      deskripsi: business.deskripsi || null,
      raw_data: business.raw_data || null,
      source_identifier: `pure_insert_${Date.now()}_${index}_${Math.random().toString(36).substring(7)}`,
      created_by: user?.id,
      updated_by: user?.id
    }))
    
    const totalBatches = Math.ceil(preparedData.length / BATCH_SIZE)
    console.log(`📦 Processing ${preparedData.length} records in ${totalBatches} batches (PURE INSERT)...`)
    
    // Process in batches with pure INSERT
    for (let i = 0; i < preparedData.length; i += BATCH_SIZE) {
      const batch = preparedData.slice(i, i + BATCH_SIZE)
      const batchNumber = Math.floor(i / BATCH_SIZE) + 1
      
      console.log(`🔄 Processing batch ${batchNumber}/${totalBatches} (${batch.length} records) - PURE INSERT...`)
      
      try {
        // Use pure INSERT - no conflict checking
        const { data, error } = await supabase
          .from('businesses')
          .insert(batch)
          .select('id')
        
        if (error) {
          console.error(`❌ Batch ${batchNumber} INSERT error:`, error)
          totalErrors += batch.length
        } else {
          const count = data?.length || 0
          totalInserted += count
          console.log(`✅ Batch ${batchNumber}/${totalBatches} SUCCESS: ${count} records inserted`)
        }
        
        if (onProgress) {
          const progress = Math.min(90, (batchNumber / totalBatches) * 85 + 10)
          onProgress(`Batch ${batchNumber}/${totalBatches} completed (PURE INSERT)`, progress)
        }
        
      } catch (batchError) {
        console.error(`❌ Batch ${batchNumber} exception:`, batchError)
        totalErrors += batch.length
      }
      
      // Small delay between batches
      if (i + BATCH_SIZE < preparedData.length) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    }
    
    if (onProgress) onProgress('Pure insert completed!', 100)
    
    console.log(`🚀 PURE INSERT (NO CONSTRAINTS) completed:`)
    console.log(`   - Total processed: ${preparedData.length}`)
    console.log(`   - Successfully inserted: ${totalInserted}`)
    console.log(`   - Errors: ${totalErrors}`)
    console.log(`   - Success rate: ${((totalInserted / preparedData.length) * 100).toFixed(1)}%`)
    
    businessService.invalidateCache()
    
    return { 
      totalProcessed: preparedData.length,
      totalInserted: totalInserted,
      failed: totalErrors
    }
    
  } catch (error) {
    console.error('❌ Error in pure insert:', error)
    throw error
  }
},

  // Enhanced sync with duplicate prevention (keep existing for backward compatibility)
  async syncFromSpreadsheet(spreadsheetId, sheetId, onProgress = null) {
    try {
      console.log('🔄 Starting FULL sync from spreadsheet to database (no duplicate detection)...')
      
      // Step 1: Get current database count
      if (onProgress) onProgress('Mengecek database saat ini...', 5)
      const currentCount = await businessService.getTotalCount()
      console.log(`📊 Current database has ${currentCount} businesses`)
      
      // Step 2: Fetch fresh data from spreadsheet
      if (onProgress) onProgress('Mengambil data terbaru dari spreadsheet...', 20)
      const rawData = await fetchCSVData(spreadsheetId, sheetId)
      console.log(`📊 Fetched ${rawData.length} raw records from spreadsheet`)
      
      // Step 3: Process the data WITHOUT deduplication for sync
      if (onProgress) onProgress('Memproses data tanpa deteksi duplikasi...', 40)
      const processedData = processCSVData(rawData, { skipDeduplication: true })
      console.log(`⚙️ Processed ${processedData.length} records`)
      
      // Step 4: Convert to database format
      if (onProgress) onProgress('Mengkonversi format data...', 60)
      const dbData = this.convertToDbFormat(processedData)
      
      // Step 5: Import to database (all data will be imported)
      if (onProgress) onProgress('Menyinkronkan ke database...', 80)
      const importResult = await this.bulkImportWithoutDuplicateDetection(dbData, (message, progress) => {
        const adjustedProgress = 80 + (progress * 0.15)
        if (onProgress) onProgress(message, adjustedProgress)
      })
      
      // Step 6: Verify sync
      const newCount = await businessService.getTotalCount()
      
      if (onProgress) onProgress('Sinkronisasi selesai!', 100)
      
      console.log(`✅ FULL SYNC completed:`)
      console.log(`   - Previous count: ${currentCount}`)
      console.log(`   - New data processed: ${processedData.length}`)
      console.log(`   - New data imported: ${importResult.totalInserted}`)
      console.log(`   - Current total: ${newCount}`)
      
      return {
        totalSynced: importResult.totalInserted,
        previousCount: currentCount,
        newCount: newCount,
        imported: importResult.totalInserted,
        failed: importResult.failed || 0
      }
      
    } catch (error) {
      console.error('❌ FULL SYNC failed:', error)
      throw new Error(`Sinkronisasi gagal: ${error.message}`)
    }
  },

  // Check database status
  async checkDatabaseStatus() {
    try {
      const totalCount = await businessService.getTotalCount()
      const stats = totalCount > 0 ? await businessService.getStatistics() : null
      
      console.log(`📊 Database status: ${totalCount} total businesses`)
      
      return {
        hasData: totalCount > 0,
        count: totalCount,
        stats: stats
      }
    } catch (error) {
      console.error('Error checking database status:', error)
      return {
        hasData: false,
        count: 0,
        error: error.message
      }
    }
  }
}
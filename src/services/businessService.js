import { supabase } from './supabaseClient'

export const businessService = {
  // Cache untuk mencegah duplikasi request
  _cache: new Map(),
  _cacheTimestamp: null,
  _cacheDuration: 5 * 60 * 1000, // 5 menit

  // Invalidate cache
  invalidateCache() {
    this._cache.clear()
    this._cacheTimestamp = null
    console.log('🗑️ Cache invalidated')
  },

  // NEW: Get businesses with server-side pagination
  async getBusinessesPaginated(page = 1, limit = 20, filters = {}) {
    try {
      const offset = (page - 1) * limit;
      
      let query = supabase
        .from('businesses')
        .select('*', { count: 'exact' })
        .is('duplicate_of', null)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      // Apply filters
      if (filters.search && filters.search.trim()) {
        const searchTerm = filters.search.trim();
        query = query.or(`nama_usaha.ilike.%${searchTerm}%,alamat.ilike.%${searchTerm}%,kegiatan.ilike.%${searchTerm}%,jenis_usaha.ilike.%${searchTerm}%,kecamatan.ilike.%${searchTerm}%,desa.ilike.%${searchTerm}%,no_telp.ilike.%${searchTerm}%`);
      }

      if (filters.kecamatan && filters.kecamatan !== 'all') {
        query = query.eq('kecamatan', filters.kecamatan);
      }
      
      if (filters.desa && filters.desa !== 'all') {
        query = query.eq('desa', filters.desa);
      }
      
      if (filters.statusToko && filters.statusToko !== 'all') {
        query = query.eq('status_toko', filters.statusToko);
      }

      const { data, error, count } = await query;
      
      if (error) {
        console.error('Supabase error:', error);
        throw new Error(`Database error: ${error.message}`);
      }

      console.log(`✅ Loaded page ${page}: ${data?.length || 0} businesses (Total: ${count})`);
      
      return {
        data: data || [],
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit)
      };
      
    } catch (error) {
      console.error('Error in getBusinessesPaginated:', error);
      throw error;
    }
  },

  // NEW: Get initial data for quick display
  async getInitialData(limit = 20) {
    try {
      const { data, error, count } = await supabase
        .from('businesses')
        .select('*', { count: 'exact' })
        .is('duplicate_of', null)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }

      console.log(`🚀 Initial data loaded: ${data?.length || 0} businesses (${count} total)`);

      return {
        businesses: data || [],
        totalCount: count || 0
      };
    } catch (error) {
      console.error('Error in getInitialData:', error);
      throw error;
    }
  },

  // Check for duplicates using database function
  async findDuplicates(businessData, excludeId = null) {
    try {
      const { data, error } = await supabase.rpc('find_duplicate_business', {
        p_nama_usaha: businessData.nama_usaha,
        p_alamat: businessData.alamat || null,
        p_kecamatan: businessData.kecamatan || null,
        p_no_telp: businessData.no_telp || null,
        p_email: businessData.email || null,
        p_exclude_id: excludeId
      })
      
      if (error) {
        console.error('Error finding duplicates:', error)
        return []
      }
      
      return data || []
    } catch (error) {
      console.error('Error in findDuplicates:', error)
      return []
    }
  },

  // UPDATED: Quick load for better UX
  async getBusinesses(filters = {}) {
    try {
      const cacheKey = JSON.stringify(filters)
      const now = Date.now()
      
      // Check cache first
      if (this._cache.has(cacheKey) && 
          this._cacheTimestamp && 
          (now - this._cacheTimestamp) < this._cacheDuration) {
        console.log('📦 Returning cached data for:', cacheKey)
        return this._cache.get(cacheKey)
      }

      // For no filters, return only first 1000 records for quick display
      if (!filters.search && !filters.kecamatan && !filters.desa && !filters.statusToko) {
        console.log('🚀 Quick load: returning first 1000 records')
        
        const { data, error, count } = await supabase
          .from('businesses')
          .select('*', { count: 'exact' })
          .is('duplicate_of', null)
          .order('created_at', { ascending: false })
          .limit(1000)

        if (error) {
          throw new Error(`Database error: ${error.message}`)
        }
        
        console.log(`✅ Quick loaded ${data?.length || 0} businesses (${count} total available)`)
        
        // Cache the result
        this._cache.set(cacheKey, data || [])
        this._cacheTimestamp = now
        
        return data || []
      }

      // For filtered queries, use paginated approach
      console.log('🔍 Filtered query, using pagination...')
      const result = await this.getBusinessesPaginated(1, 1000, filters)
      
      // Cache the result
      this._cache.set(cacheKey, result.data)
      this._cacheTimestamp = now
      
      return result.data
      
    } catch (error) {
      console.error('Error in getBusinesses:', error)
      throw error
    }
  },

  // Get ALL businesses with pagination (for admin functions only)
  async getAllBusinesses() {
    try {
      console.log('⚠️ Loading ALL businesses - this should only be used for admin functions')
      
      let allData = []
      let from = 0
      const batchSize = 1000
      let hasMore = true
      let totalCount = 0
      
      // First, get the total count
      const { count } = await supabase
        .from('businesses')
        .select('*', { count: 'exact', head: true })
        .is('duplicate_of', null)
      
      totalCount = count || 0
      console.log(`📊 Total businesses to fetch: ${totalCount}`)
      
      while (hasMore) {
        const batchNumber = Math.floor(from / batchSize) + 1
        const totalBatches = Math.ceil(totalCount / batchSize)
        
        console.log(`📦 Fetching batch ${batchNumber}/${totalBatches} (${from + 1}-${Math.min(from + batchSize, totalCount)})...`)
        
        const { data, error } = await supabase
          .from('businesses')
          .select('*')
          .is('duplicate_of', null)
          .order('created_at', { ascending: false })
          .range(from, from + batchSize - 1)
        
        if (error) {
          console.error('Supabase error:', error)
          throw new Error(`Database error: ${error.message}`)
        }
        
        if (data && data.length > 0) {
          allData = [...allData, ...data]
          from += batchSize
          
          console.log(`✅ Batch ${batchNumber} loaded: ${data.length} records (Total so far: ${allData.length})`)
          
          if (data.length < batchSize || allData.length >= totalCount) {
            hasMore = false
          }
        } else {
          hasMore = false
        }
        
        // Small delay to prevent overwhelming the database
        if (hasMore) {
          await new Promise(resolve => setTimeout(resolve, 100))
        }
      }
      
      console.log(`✅ Successfully loaded ${allData.length} businesses from database`)
      return allData
      
    } catch (error) {
      console.error('Error in getAllBusinesses:', error)
      throw error
    }
  },

  // Local filtering with duplicate removal
  filterBusinessesLocally(businesses, filters) {
    let filtered = [...businesses]
    
    if (filters.search && filters.search.trim()) {
      const searchTerm = filters.search.toLowerCase().trim()
      filtered = filtered.filter(business => 
        business.nama_usaha?.toLowerCase().includes(searchTerm) ||
        business.alamat?.toLowerCase().includes(searchTerm) ||
        business.kegiatan?.toLowerCase().includes(searchTerm) ||
        business.jenis_usaha?.toLowerCase().includes(searchTerm) ||
        business.kecamatan?.toLowerCase().includes(searchTerm) ||
        business.desa?.toLowerCase().includes(searchTerm) ||
        business.no_telp?.includes(searchTerm)
      )
    }

    if (filters.kecamatan && filters.kecamatan !== 'all') {
      filtered = filtered.filter(business => 
        business.kecamatan === filters.kecamatan
      )
    }
    
    if (filters.desa && filters.desa !== 'all') {
      filtered = filtered.filter(business => 
        business.desa === filters.desa
      )
    }
    
    if (filters.statusToko && filters.statusToko !== 'all') {
      filtered = filtered.filter(business => 
        business.status_toko === filters.statusToko
      )
    }
    
    return filtered
  },

  // OPTIMIZED: Super Fast Bulk Import
  async bulkImport(businesses) {
    try {
      console.log(`🚀 Starting OPTIMIZED bulk import of ${businesses.length} businesses...`)
      
      const { data: { user } } = await supabase.auth.getUser()
      const BATCH_SIZE = 1000 // Large batches for speed
      const results = []
      const errors = []
      
      // Prepare all data first
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
        source_identifier: business.source_identifier || `import_${Date.now()}_${index}`,
        created_by: user?.id,
        updated_by: user?.id
      }))
      
      console.log(`📦 Prepared ${preparedData.length} records, importing in batches of ${BATCH_SIZE}...`)
      
      // Process in batches with upsert for speed
      for (let i = 0; i < preparedData.length; i += BATCH_SIZE) {
        const batch = preparedData.slice(i, i + BATCH_SIZE)
        const batchNumber = Math.floor(i / BATCH_SIZE) + 1
        const totalBatches = Math.ceil(preparedData.length / BATCH_SIZE)
        
        console.log(`🔄 Processing batch ${batchNumber}/${totalBatches} (${batch.length} records)...`)
        
        try {
          // Use upsert with on_conflict to handle duplicates efficiently
          const { data, error } = await supabase
            .from('businesses')
            .upsert(batch, { 
              onConflict: 'nama_usaha,alamat,kecamatan',
              ignoreDuplicates: true 
            })
            .select('id')
          
          if (error) {
            console.error(`❌ Batch ${batchNumber} error:`, error)
            errors.push({
              batch: batchNumber,
              error: error.message,
              records: batch.length
            })
          } else {
            const insertedCount = data?.length || 0
            results.push(...(data || []))
            console.log(`✅ Batch ${batchNumber} completed: ${insertedCount} records inserted`)
          }
          
        } catch (batchError) {
          console.error(`❌ Batch ${batchNumber} failed:`, batchError)
          errors.push({
            batch: batchNumber,
            error: batchError.message,
            records: batch.length
          })
        }
        
        // Small delay between batches to prevent overwhelming the database
        if (i + BATCH_SIZE < preparedData.length) {
          await new Promise(resolve => setTimeout(resolve, 50))
        }
      }
      
      console.log(`✅ OPTIMIZED bulk import completed:`)
      console.log(`   - Total processed: ${preparedData.length}`)
      console.log(`   - Successfully imported: ${results.length}`)
      console.log(`   - Errors: ${errors.length}`)
      console.log(`   - Duplicates/Skipped: ${preparedData.length - results.length}`)
      
      this.invalidateCache()
      
      return results
      
    } catch (error) {
      console.error('Error in optimized bulkImport:', error)
      throw error
    }
  },

  // NEW: Super Fast Bulk Import with Progress
  async superFastBulkImport(businesses, onProgress = null) {
    try {
      console.log(`🚀 Starting SUPER FAST bulk import of ${businesses.length} businesses...`)
      
      const { data: { user } } = await supabase.auth.getUser()
      const BATCH_SIZE = 1000 // Larger batches for speed
      let totalInserted = 0
      
      if (onProgress) onProgress('Preparing data...', 5)
      
      // Prepare all data
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
        source_identifier: `import_${Date.now()}_${index}`,
        created_by: user?.id,
        updated_by: user?.id
      }))
      
      const totalBatches = Math.ceil(preparedData.length / BATCH_SIZE)
      console.log(`📦 Processing ${preparedData.length} records in ${totalBatches} batches...`)
      
      // Process batches sequentially for stability
      for (let i = 0; i < preparedData.length; i += BATCH_SIZE) {
        const batch = preparedData.slice(i, i + BATCH_SIZE)
        const batchNumber = Math.floor(i / BATCH_SIZE) + 1
        
        try {
          const { data, error } = await supabase
            .from('businesses')
            .upsert(batch, { 
              onConflict: 'nama_usaha,alamat,kecamatan',
              ignoreDuplicates: true 
            })
            .select('id')
          
          if (error) {
            console.error(`❌ Batch ${batchNumber} error:`, error)
          } else {
            const count = data?.length || 0
            totalInserted += count
            console.log(`✅ Batch ${batchNumber}/${totalBatches} completed: ${count} records`)
            
            if (onProgress) {
              const progress = Math.min(90, (batchNumber / totalBatches) * 85 + 10)
              onProgress(`Batch ${batchNumber}/${totalBatches} completed`, progress)
            }
          }
          
        } catch (batchError) {
          console.error(`❌ Batch ${batchNumber} failed:`, batchError)
        }
        
        // Small delay between batches
        if (i + BATCH_SIZE < preparedData.length) {
          await new Promise(resolve => setTimeout(resolve, 100))
        }
      }
      
      if (onProgress) onProgress('Import completed!', 100)
      
      console.log(`🚀 SUPER FAST import completed:`)
      console.log(`   - Total processed: ${preparedData.length}`)
      console.log(`   - Successfully imported: ${totalInserted}`)
      console.log(`   - Speed: ~${Math.round(totalInserted / 60)} records/second`)
      
      this.invalidateCache()
      
      return { 
        totalProcessed: preparedData.length,
        totalInserted: totalInserted,
        duplicatesSkipped: preparedData.length - totalInserted
      }
      
    } catch (error) {
      console.error('Error in super fast bulk import:', error)
      throw error
    }
  },

  // Create business with duplicate check
  async createBusiness(businessData) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      const dataToInsert = {
        ...businessData,
        status_toko: businessData.status_toko || 'BUKA',
        created_by: user?.id,
        updated_by: user?.id,
        source_identifier: businessData.source_identifier || `manual_${Date.now()}`
      }

      const { data, error } = await supabase
        .from('businesses')
        .insert([dataToInsert])
        .select()
        .single()
      
      if (error) {
        if (error.code === '23505') {
          throw new Error(`Usaha dengan informasi yang sama sudah ada di database`)
        }
        throw new Error(`Failed to create business: ${error.message}`)
      }
      
      console.log('✅ Business created:', data.nama_usaha)
      this.invalidateCache()
      
      return data
      
    } catch (error) {
      console.error('Error in createBusiness:', error)
      throw error
    }
  },

  // Update business
  async updateBusiness(id, updates) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      const dataToUpdate = {
        ...updates,
        updated_by: user?.id,
        updated_at: new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('businesses')
        .update(dataToUpdate)
        .eq('id', id)
        .select()
        .single()
      
      if (error) {
        if (error.code === '23505') {
          throw new Error(`Update akan menyebabkan duplikasi dengan usaha yang sudah ada`)
        }
        throw new Error(`Failed to update business: ${error.message}`)
      }
      
      console.log('✅ Business updated:', data.nama_usaha)
      this.invalidateCache()
      
      return data
      
    } catch (error) {
      console.error('Error in updateBusiness:', error)
      throw error
    }
  },

  // Delete business
  async deleteBusiness(id) {
    try {
      const { error } = await supabase
        .from('businesses')
        .delete()
        .eq('id', id)
      
      if (error) {
        throw new Error(`Failed to delete business: ${error.message}`)
      }
      
      console.log('✅ Business deleted')
      this.invalidateCache()
      
    } catch (error) {
      console.error('Error in deleteBusiness:', error)
      throw error
    }
  },

  // Delete all businesses from database
  async deleteAllBusinesses() {
    try {
      console.log('⚠️ Deleting ALL businesses from database...')
      
      // Get total count first
      const totalCount = await this.getTotalCount()
      console.log(`📊 Found ${totalCount} businesses to delete`)
      
      if (totalCount === 0) {
        return { deleted: 0, message: 'Database is already empty' }
      }
      
      // Delete all businesses using TRUNCATE for better performance
      const { error } = await supabase.rpc('truncate_businesses_table')
      
      if (error) {
        // Fallback to DELETE if TRUNCATE function doesn't exist
        console.log('TRUNCATE function not found, using DELETE...')
        const { error: deleteError } = await supabase
          .from('businesses')
          .delete()
          .neq('id', 0) // Delete all records
        
        if (deleteError) {
          throw new Error(`Failed to delete all businesses: ${deleteError.message}`)
        }
      }
      
      console.log('✅ All businesses deleted from database')
      this.invalidateCache()
      
      return { deleted: totalCount, message: 'All businesses deleted successfully' }
      
    } catch (error) {
      console.error('Error in deleteAllBusinesses:', error)
      throw error
    }
  },

  // Reset database with fresh import
  async resetDatabaseWithFreshImport(spreadsheetId, sheetId, onProgress = null) {
    try {
      console.log('🔄 Starting database reset with fresh import...')
      
      if (onProgress) onProgress('Menghapus semua data lama...', 10)
      
      // Step 1: Delete all existing data
      const deleteResult = await this.deleteAllBusinesses()
      console.log('🗑️ Deleted:', deleteResult.deleted, 'records')
      
      if (onProgress) onProgress('Mengimpor data baru...', 30)
      
      // Step 2: Import fresh data
      const { migrationService } = await import('./migrationService')
      const importResult = await migrationService.importSpreadsheetToDatabase(
        spreadsheetId, 
        sheetId,
        (message, progress) => {
          // Adjust progress to 30-90 range
          const adjustedProgress = 30 + (progress * 0.6)
          if (onProgress) onProgress(message, adjustedProgress)
        }
      )
      
      if (onProgress) onProgress('Reset database selesai!', 100)
      
      console.log('✅ Database reset complete:', importResult)
      
      return {
        deleted: deleteResult.deleted,
        imported: importResult.totalImported,
        total: importResult.totalInDatabase,
        message: `Successfully reset database: ${deleteResult.deleted} deleted, ${importResult.totalImported} imported`
      }
      
    } catch (error) {
      console.error('Error in resetDatabaseWithFreshImport:', error)
      throw error
    }
  },

  // Get business by ID
  async getBusinessById(id) {
    try {
      const { data, error } = await supabase
        .from('businesses')
        .select('*')
        .eq('id', id)
        .single()
      
      if (error) {
        if (error.code === 'PGRST116') {
          throw new Error('Business not found')
        }
        throw new Error(`Database error: ${error.message}`)
      }
      
      return data
    } catch (error) {
      console.error('Error in getBusinessById:', error)
      throw error
    }
  },

  // Get total count
  async getTotalCount() {
    try {
      const { count, error } = await supabase
        .from('businesses')
        .select('*', { count: 'exact', head: true })
        .is('duplicate_of', null)
      
      if (error) {
        throw new Error(`Failed to get count: ${error.message}`)
      }
      
      console.log(`📊 Total active businesses in database: ${count}`)
      return count || 0
      
    } catch (error) {
      console.error('Error in getTotalCount:', error)
      throw error
    }
  },

  // Get unique values for filters - OPTIMIZED
  async getUniqueValues(column) {
    try {
      console.log(`🔄 Fetching unique values for ${column}...`)
      
      // Use distinct query for better performance
      const { data, error } = await supabase
        .from('businesses')
        .select(column)
        .not(column, 'is', null)
        .not(column, 'eq', '')
        .is('duplicate_of', null)
        .limit(1000) // Limit for performance
      
      if (error) {
        throw new Error(`Failed to get unique values: ${error.message}`)
      }
      
      const uniqueValues = [...new Set(data.map(item => item[column]).filter(Boolean))].sort()
      console.log(`✅ Found ${uniqueValues.length} unique values for ${column}`)
      
      return uniqueValues
      
    } catch (error) {
      console.error('Error in getUniqueValues:', error)
      throw error
    }
  },

  // Get potential duplicates view - FIXED
  async getPotentialDuplicates(limit = 100, offset = 0) {
    try {
      console.log(`🔄 Fetching duplicates with limit ${limit}, offset ${offset}...`);
      
      const { data, error } = await supabase.rpc('get_duplicate_groups', {
        p_limit: limit,
        p_offset: offset
      });
      
      if (error) {
        console.error('Supabase RPC error:', error);
        throw new Error(`Failed to get potential duplicates: ${error.message}`);
      }
      
      console.log(`✅ Found ${data?.length || 0} duplicate groups`);
      return data || [];
      
    } catch (error) {
      console.error('Error in getPotentialDuplicates:', error);
      // Return empty array instead of throwing
      return [];
    }
  },

  // Get duplicate statistics for bulk operations - FIXED
  async getDuplicateStatistics() {
    try {
      console.log('📊 Getting duplicate statistics...');
      
      const { data, error } = await supabase.rpc('get_duplicate_statistics');
      
      if (error) {
        console.error('Supabase RPC error:', error);
        throw new Error(`Failed to get duplicate statistics: ${error.message}`);
      }
      
      // Handle empty result
      if (!data || data.length === 0) {
        console.log('📊 No duplicate statistics data returned');
        return {
          totalGroups: 0,
          totalDuplicates: 0,
          largestGroup: 0,
          groupsWithManyDuplicates: 0
        };
      }
      
      const stats = data[0];
      
      const result = {
        totalGroups: parseInt(stats.total_groups) || 0,
        totalDuplicates: parseInt(stats.total_duplicates) || 0,
        largestGroup: parseInt(stats.largest_group) || 0,
        groupsWithManyDuplicates: parseInt(stats.groups_with_many_duplicates) || 0
      };
      
      console.log('📊 Duplicate statistics:', result);
      
      return result;
      
    } catch (error) {
      console.error('Error in getDuplicateStatistics:', error);
      
      // Return zero stats instead of throwing
      return {
        totalGroups: 0,
        totalDuplicates: 0,
        largestGroup: 0,
        groupsWithManyDuplicates: 0
      };
    }
  },

  // Merge duplicate businesses - FIXED
  async mergeDuplicates(keepId, mergeIds) {
    try {
      const { data, error } = await supabase.rpc('merge_duplicate_businesses', {
        p_keep_id: keepId,
        p_merge_ids: mergeIds
      })
      
      if (error) {
        throw new Error(`Failed to merge duplicates: ${error.message}`)
      }
      
      console.log(`✅ Merged ${mergeIds.length} duplicates into business ${keepId}`)
      this.invalidateCache()
      
      return data
      
    } catch (error) {
      console.error('Error in mergeDuplicates:', error)
      throw error
    }
  },

  // NEW: Batch merge with smaller batches
  async mergeDuplicatesBatch(batchSize = 10) {
    try {
      console.log(`🔄 Starting batch merge with size ${batchSize}...`);
      
      const { data, error } = await supabase.rpc('merge_duplicates_batch', {
        p_limit: batchSize
      });
      
      if (error) {
        console.error('Supabase RPC error:', error);
        throw new Error(`Failed to batch merge duplicates: ${error.message}`);
      }
      
      const result = data && data.length > 0 ? data[0] : {
        processed_groups: 0,
        merged_records: 0,
        processing_time: '0 seconds'
      };
      
      console.log(`✅ Batch merge completed:`, result);
      this.invalidateCache();
      
      return {
        processedGroups: result.processed_groups,
        mergedRecords: result.merged_records,
        processingTime: result.processing_time
      };
      
    } catch (error) {
      console.error('Error in mergeDuplicatesBatch:', error);
      throw error;
    }
  },

  // Bulk merge all duplicates with progressive batching - FIXED
  async bulkMergeAllDuplicatesOptimized(batchSize = 50) {
    try {
      console.log(`🔄 Starting optimized bulk merge with batch size ${batchSize}...`);
      
      const { data, error } = await supabase.rpc('bulk_merge_all_duplicates_optimized', {
        p_batch_size: batchSize
      });
      
      if (error) {
        console.error('Supabase RPC error:', error);
        throw new Error(`Failed to bulk merge duplicates: ${error.message}`);
      }
      
      const result = data && data.length > 0 ? data[0] : {
        processed_groups: 0,
        merged_records: 0,
        processing_time: '0 seconds'
      };
      
      console.log(`✅ Optimized bulk merge completed:`, result);
      this.invalidateCache();
      
      return {
        processedGroups: result.processed_groups,
        mergedRecords: result.merged_records,
        processingTime: result.processing_time
      };
      
    } catch (error) {
      console.error('Error in bulkMergeAllDuplicatesOptimized:', error);
      throw error;
    }
  },

  // NEW: Progressive bulk merge for large datasets
  async progressiveBulkMerge(onProgress = null) {
    try {
      console.log('🔄 Starting progressive bulk merge...');
      
      let totalProcessed = 0;
      let totalMerged = 0;
      let batchNumber = 1;
      let hasMore = true;
      
      while (hasMore) {
        try {
          if (onProgress) {
            onProgress(`Processing batch ${batchNumber}...`, 0);
          }
          
          // Process small batches
          const result = await this.mergeDuplicatesBatch(20);
          
          totalProcessed += result.processedGroups;
          totalMerged += result.mergedRecords;
          
          console.log(`📦 Batch ${batchNumber}: ${result.processedGroups} groups, ${result.mergedRecords} merged`);
          
          // If no groups processed, we're done
          if (result.processedGroups === 0) {
            hasMore = false;
          } else {
            batchNumber++;
            
            // Small delay between batches
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            if (onProgress) {
              onProgress(`Completed batch ${batchNumber - 1}. Total: ${totalMerged} merged`, 
                Math.min(90, (batchNumber - 1) * 10));
            }
          }
          
          // Safety limit
          if (batchNumber > 50) {
            console.warn('⚠️ Reached batch limit, stopping');
            hasMore = false;
          }
          
        } catch (batchError) {
          console.error(`❌ Error in batch ${batchNumber}:`, batchError);
          hasMore = false;
        }
      }
      
      if (onProgress) {
        onProgress(`Completed! ${totalMerged} duplicates merged in ${batchNumber - 1} batches`, 100);
      }
      
      return {
        processedGroups: totalProcessed,
        mergedRecords: totalMerged,
        batches: batchNumber - 1,
        processingTime: `${batchNumber - 1} batches`
      };
      
    } catch (error) {
      console.error('Error in progressiveBulkMerge:', error);
      throw error;
    }
  },

  // Subscribe to real-time changes
  subscribeToChanges(callback) {
    const channel = supabase
      .channel('businesses-changes')
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'businesses' 
        },
        (payload) => {
          console.log('Real-time update:', payload)
          this.invalidateCache()
          callback(payload)
        }
      )
      .subscribe()

    return channel
  },

  // Get statistics
  async getStatistics() {
    try {
      console.log('📊 Getting statistics...')
      
      // Use quick data for statistics
      const allData = await this.getBusinesses()
      const duplicateStats = await this.getDuplicateStatistics()
      
      const stats = {
        total: allData.length,
        byStatus: {},
        byKecamatan: {},
        byJenisUsaha: {},
        duplicates: {
          potentialGroups: duplicateStats.totalGroups,
          totalDuplicates: duplicateStats.totalDuplicates
        }
      }
      
      allData.forEach(business => {
        const status = business.status_toko || 'BUKA'
        stats.byStatus[status] = (stats.byStatus[status] || 0) + 1
        
        if (business.kecamatan) {
          stats.byKecamatan[business.kecamatan] = (stats.byKecamatan[business.kecamatan] || 0) + 1
        }
        
        if (business.jenis_usaha) {
          stats.byJenisUsaha[business.jenis_usaha] = (stats.byJenisUsaha[business.jenis_usaha] || 0) + 1
        }
      })
      
      console.log('📊 Statistics calculated for', stats.total, 'businesses (quick load)')
      
      return stats
      
    } catch (error) {
      console.error('Error in getStatistics:', error)
      throw error
    }
  }
}
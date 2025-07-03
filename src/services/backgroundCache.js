// services/backgroundCache.js
import { businessService } from './businessService';

class BackgroundCache {
  constructor() {
    this.cache = new Map();
    this.preloadQueue = [];
    this.isPreloading = false;
  }

  async preloadNextPages(currentPage, filters, totalPages) {
    if (this.isPreloading) return;
    
    this.isPreloading = true;
    
    // Preload next 2-3 pages in background
    const pagesToPreload = [currentPage + 1, currentPage + 2].filter(page => page <= totalPages);
    
    for (const page of pagesToPreload) {
      try {
        const cacheKey = `${page}_${JSON.stringify(filters)}`;
        
        if (!this.cache.has(cacheKey)) {
          const result = await businessService.getBusinessesPaginated(page, 20, filters);
          this.cache.set(cacheKey, result);
          console.log(`📦 Preloaded page ${page}`);
        }
      } catch (error) {
        console.warn(`Failed to preload page ${page}:`, error);
      }
    }
    
    this.isPreloading = false;
  }

  getFromCache(page, filters) {
    const cacheKey = `${page}_${JSON.stringify(filters)}`;
    return this.cache.get(cacheKey);
  }

  clearCache() {
    this.cache.clear();
    console.log('🗑️ Background cache cleared');
  }

  getCacheSize() {
    return this.cache.size;
  }
}

export const backgroundCache = new BackgroundCache();
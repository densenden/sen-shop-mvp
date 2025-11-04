/**
 * Content Cache Service
 * Task 4.5: Caching layer for AI-generated content
 */

interface CacheEntry {
  value: any;
  expiresAt: Date;
  createdAt: Date;
}

interface CacheServiceInterface {
  get(key: string): Promise<any> | any;
  set(key: string, value: any, ttl?: number): Promise<void>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
}

/**
 * In-Memory Cache Service
 * For production, this should be replaced with Redis or database-backed cache
 */
export class MemoryCacheService implements CacheServiceInterface {
  private cache = new Map<string, CacheEntry>();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Clean up expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  async get(key: string): Promise<any> {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check if expired
    if (entry.expiresAt < new Date()) {
      this.cache.delete(key);
      return null;
    }

    return entry.value;
  }

  async set(key: string, value: any, ttlMs?: number): Promise<void> {
    const defaultTtl = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    const ttl = ttlMs || defaultTtl;

    const entry: CacheEntry = {
      value,
      expiresAt: new Date(Date.now() + ttl),
      createdAt: new Date()
    };

    this.cache.set(key, entry);
  }

  async delete(key: string): Promise<void> {
    this.cache.delete(key);
  }

  async clear(): Promise<void> {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats(): { size: number; entries: Array<{ key: string; createdAt: Date; expiresAt: Date }> } {
    const entries = Array.from(this.cache.entries()).map(([key, entry]) => ({
      key,
      createdAt: entry.createdAt,
      expiresAt: entry.expiresAt
    }));

    return {
      size: this.cache.size,
      entries
    };
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = new Date();
    const expiredKeys: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiresAt < now) {
        expiredKeys.push(key);
      }
    }

    expiredKeys.forEach(key => this.cache.delete(key));

    if (expiredKeys.length > 0) {
      console.log(`Cleaned up ${expiredKeys.length} expired cache entries`);
    }
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.cache.clear();
  }
}

/**
 * Database Cache Service (for production use)
 * This would store cache entries in a database table
 */
export class DatabaseCacheService implements CacheServiceInterface {
  // This would be implemented with actual database operations
  // For now, using memory cache as fallback
  private memoryCache = new MemoryCacheService();

  async get(key: string): Promise<any> {
    // TODO: Implement database query
    // SELECT value FROM ai_content_cache WHERE key = ? AND expires_at > NOW()
    return this.memoryCache.get(key);
  }

  async set(key: string, value: any, ttlMs?: number): Promise<void> {
    // TODO: Implement database insert/update
    // INSERT INTO ai_content_cache (key, value, expires_at, created_at) VALUES (?, ?, ?, ?)
    // ON CONFLICT (key) DO UPDATE SET value = ?, expires_at = ?, updated_at = NOW()
    return this.memoryCache.set(key, value, ttlMs);
  }

  async delete(key: string): Promise<void> {
    // TODO: Implement database delete
    // DELETE FROM ai_content_cache WHERE key = ?
    return this.memoryCache.delete(key);
  }

  async clear(): Promise<void> {
    // TODO: Implement database truncate
    // DELETE FROM ai_content_cache
    return this.memoryCache.clear();
  }
}

// Export singleton instances
export const memoryCacheService = new MemoryCacheService();
export const databaseCacheService = new DatabaseCacheService();

// Default export for easy importing
export default memoryCacheService;
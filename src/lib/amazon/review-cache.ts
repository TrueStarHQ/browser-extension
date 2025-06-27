import type { ReviewData } from '../../services/truestar-api';

interface CacheEntry {
  reviews: ReviewData[];
  timestamp: number;
}

interface CacheOptions {
  ttlMinutes?: number;
}

interface CacheStats {
  entries: number;
  totalReviews: number;
  oldestEntry: Date | null;
  newestEntry: Date | null;
}

export class ReviewCache {
  private cache: Map<string, CacheEntry> = new Map();
  private ttlMs: number;

  constructor(options: CacheOptions = {}) {
    const { ttlMinutes = 60 } = options;
    this.ttlMs = ttlMinutes * 60 * 1000;
  }

  set(productId: string, reviews: ReviewData[]): void {
    this.cache.set(productId, {
      reviews,
      timestamp: Date.now(),
    });
  }

  get(productId: string): ReviewData[] | null {
    const entry = this.cache.get(productId);

    if (!entry) {
      return null;
    }

    // Check if entry has expired
    if (Date.now() - entry.timestamp > this.ttlMs) {
      this.cache.delete(productId);
      return null;
    }

    return entry.reviews;
  }

  has(productId: string): boolean {
    const entry = this.cache.get(productId);

    if (!entry) {
      return false;
    }

    // Check expiration
    if (Date.now() - entry.timestamp > this.ttlMs) {
      this.cache.delete(productId);
      return false;
    }

    return true;
  }

  delete(productId: string): void {
    this.cache.delete(productId);
  }

  clear(): void {
    this.cache.clear();
  }

  getStats(): CacheStats {
    let totalReviews = 0;
    let oldestTimestamp: number | null = null;
    let newestTimestamp: number | null = null;

    // Clean up expired entries first
    const now = Date.now();
    for (const [productId, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.ttlMs) {
        this.cache.delete(productId);
      }
    }

    // Calculate stats from remaining entries
    for (const entry of this.cache.values()) {
      totalReviews += entry.reviews.length;

      if (oldestTimestamp === null || entry.timestamp < oldestTimestamp) {
        oldestTimestamp = entry.timestamp;
      }

      if (newestTimestamp === null || entry.timestamp > newestTimestamp) {
        newestTimestamp = entry.timestamp;
      }
    }

    return {
      entries: this.cache.size,
      totalReviews,
      oldestEntry: oldestTimestamp ? new Date(oldestTimestamp) : null,
      newestEntry: newestTimestamp ? new Date(newestTimestamp) : null,
    };
  }
}

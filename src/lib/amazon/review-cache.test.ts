import type { AmazonReview } from '@truestarhq/shared-types';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ReviewCache } from './review-cache';

describe('ReviewCache', () => {
  let cache: ReviewCache;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-06-26T10:00:00Z'));
    cache = new ReviewCache();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('set and get', () => {
    it('store and retrieve reviews by product ID', () => {
      const productId = 'B08N5WRWNW';
      const reviews: AmazonReview[] = [
        {
          id: 'R1TEST',
          rating: 5,
          text: 'Great product!',
          author: 'User1',
          verified: true,
        },
      ];

      cache.set(productId, reviews);
      const retrieved = cache.get(productId);

      expect(retrieved).toEqual(reviews);
    });

    it('return null for non-existent product ID', () => {
      const result = cache.get('NONEXISTENT');
      expect(result).toBeNull();
    });

    it('overwrite existing cache entry', () => {
      const productId = 'B08N5WRWNW';
      const reviews1: AmazonReview[] = [
        {
          id: 'R1',
          rating: 5,
          text: 'First',
          author: 'User1',
          verified: true,
        },
      ];
      const reviews2: AmazonReview[] = [
        {
          id: 'R2',
          rating: 4,
          text: 'Second',
          author: 'User2',
          verified: false,
        },
      ];

      cache.set(productId, reviews1);
      cache.set(productId, reviews2);

      expect(cache.get(productId)).toEqual(reviews2);
    });
  });

  describe('expiration', () => {
    it('return null for expired entries', () => {
      const productId = 'B08N5WRWNW';
      const reviews: AmazonReview[] = [
        {
          id: 'R1',
          rating: 5,
          text: 'Test',
          author: 'User',
          verified: true,
        },
      ];

      cache.set(productId, reviews);

      // Advance time beyond TTL (default 1 hour)
      vi.advanceTimersByTime(61 * 60 * 1000); // 61 minutes

      expect(cache.get(productId)).toBeNull();
    });

    it('respect custom TTL', () => {
      const customCache = new ReviewCache({ ttlMinutes: 30 });
      const productId = 'B08N5WRWNW';
      const reviews: AmazonReview[] = [
        {
          id: 'R1',
          rating: 5,
          text: 'Test',
          author: 'User',
          verified: true,
        },
      ];

      customCache.set(productId, reviews);

      // Advance time to just before expiry
      vi.advanceTimersByTime(29 * 60 * 1000); // 29 minutes
      expect(customCache.get(productId)).toEqual(reviews);

      // Advance past expiry
      vi.advanceTimersByTime(2 * 60 * 1000); // 2 more minutes
      expect(customCache.get(productId)).toBeNull();
    });
  });

  describe('has method', () => {
    it('return true for existing valid entries', () => {
      const productId = 'B08N5WRWNW';
      cache.set(productId, []);

      expect(cache.has(productId)).toBe(true);
    });

    it('return false for non-existent entries', () => {
      expect(cache.has('NONEXISTENT')).toBe(false);
    });

    it('return false for expired entries', () => {
      const productId = 'B08N5WRWNW';
      cache.set(productId, []);

      vi.advanceTimersByTime(61 * 60 * 1000); // 61 minutes

      expect(cache.has(productId)).toBe(false);
    });
  });

  describe('clear method', () => {
    it('remove all entries', () => {
      cache.set('PRODUCT1', []);
      cache.set('PRODUCT2', []);
      cache.set('PRODUCT3', []);

      expect(cache.has('PRODUCT1')).toBe(true);
      expect(cache.has('PRODUCT2')).toBe(true);
      expect(cache.has('PRODUCT3')).toBe(true);

      cache.clear();

      expect(cache.has('PRODUCT1')).toBe(false);
      expect(cache.has('PRODUCT2')).toBe(false);
      expect(cache.has('PRODUCT3')).toBe(false);
    });
  });

  describe('delete method', () => {
    it('remove specific entry', () => {
      cache.set('PRODUCT1', []);
      cache.set('PRODUCT2', []);

      cache.delete('PRODUCT1');

      expect(cache.has('PRODUCT1')).toBe(false);
      expect(cache.has('PRODUCT2')).toBe(true);
    });
  });

  describe('getStats method', () => {
    it('return cache statistics', () => {
      const reviews1: AmazonReview[] = [
        {
          id: 'R1',
          rating: 5,
          text: 'Test',
          author: 'User',
          verified: true,
        },
      ];
      const reviews2: AmazonReview[] = [
        {
          id: 'R2',
          rating: 4,
          text: 'Another',
          author: 'User2',
          verified: false,
        },
        {
          id: 'R3',
          rating: 3,
          text: 'Third',
          author: 'User3',
          verified: true,
        },
      ];

      cache.set('PRODUCT1', reviews1);
      cache.set('PRODUCT2', reviews2);

      const stats = cache.getStats();

      expect(stats.entries).toBe(2);
      expect(stats.totalReviews).toBe(3);
      expect(stats.oldestEntry).toBeInstanceOf(Date);
      expect(stats.newestEntry).toBeInstanceOf(Date);
    });

    it('handle empty cache stats', () => {
      const stats = cache.getStats();

      expect(stats.entries).toBe(0);
      expect(stats.totalReviews).toBe(0);
      expect(stats.oldestEntry).toBeNull();
      expect(stats.newestEntry).toBeNull();
    });
  });
});

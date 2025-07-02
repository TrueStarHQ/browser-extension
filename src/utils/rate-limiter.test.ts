import { afterEach,beforeEach, describe, expect, it, vi } from 'vitest';

import { RateLimiter } from './rate-limiter';

describe('RateLimiter', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('constructor', () => {
    it('should create a rate limiter with specified max requests and time window', () => {
      const limiter = new RateLimiter({ maxRequests: 5, windowMs: 1000 });
      expect(limiter).toBeDefined();
    });
  });

  describe('acquire', () => {
    it('should allow requests up to the limit', async () => {
      const limiter = new RateLimiter({ maxRequests: 3, windowMs: 1000 });

      const promises = [
        limiter.acquire(),
        limiter.acquire(),
        limiter.acquire(),
      ];

      // All should resolve immediately
      const results = await Promise.all(promises);
      expect(results).toHaveLength(3);
      results.forEach((result) => expect(result).toBeUndefined());
    });

    it('should delay requests that exceed the limit', async () => {
      const limiter = new RateLimiter({ maxRequests: 2, windowMs: 1000 });

      // First two should be immediate
      await limiter.acquire();
      await limiter.acquire();

      // Third should be delayed
      const acquirePromise = limiter.acquire();

      // Check that the promise is pending
      let resolved = false;
      acquirePromise.then(() => {
        resolved = true;
      });

      // Advance time slightly to check it's still pending
      await vi.advanceTimersByTimeAsync(100);
      expect(resolved).toBe(false);

      // Advance time to allow the request
      await vi.advanceTimersByTimeAsync(900);
      await acquirePromise;
      expect(resolved).toBe(true);
    });

    it('should reset the window after the time period', async () => {
      const limiter = new RateLimiter({ maxRequests: 2, windowMs: 1000 });

      // Use up the limit
      await limiter.acquire();
      await limiter.acquire();

      // Advance time past the window
      vi.advanceTimersByTime(1100);

      // Should allow new requests immediately
      const startTime = Date.now();
      await limiter.acquire();
      await limiter.acquire();
      const elapsed = Date.now() - startTime;

      expect(elapsed).toBeLessThan(100);
    });

    it('should handle concurrent requests properly', async () => {
      const limiter = new RateLimiter({ maxRequests: 3, windowMs: 1000 });

      // Make 5 concurrent requests
      const promises = Array(5)
        .fill(null)
        .map(() => limiter.acquire());

      // Track which promises have resolved
      const resolved = new Array(5).fill(false);
      promises.forEach((p, i) => {
        p.then(() => {
          resolved[i] = true;
        });
      });

      // Check first 3 resolve immediately
      await vi.advanceTimersByTimeAsync(0);
      expect(resolved.slice(0, 3).every((r) => r)).toBe(true);
      expect(resolved.slice(3).every((r) => !r)).toBe(true);

      // Last 2 should resolve after delay
      await vi.advanceTimersByTimeAsync(1000);
      await Promise.all(promises);
      expect(resolved.every((r) => r)).toBe(true);
    });
  });

  describe('executeWithLimit', () => {
    it('should execute function after acquiring rate limit', async () => {
      const limiter = new RateLimiter({ maxRequests: 1, windowMs: 1000 });
      const mockFn = vi.fn().mockResolvedValue('result');

      const result = await limiter.executeWithLimit(mockFn);

      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(result).toBe('result');
    });

    it('should propagate function errors', async () => {
      const limiter = new RateLimiter({ maxRequests: 1, windowMs: 1000 });
      const error = new Error('Function failed');
      const mockFn = vi.fn().mockRejectedValue(error);

      await expect(limiter.executeWithLimit(mockFn)).rejects.toThrow(
        'Function failed'
      );
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should apply rate limiting to function execution', async () => {
      const limiter = new RateLimiter({ maxRequests: 2, windowMs: 1000 });
      let callCount = 0;
      const mockFn = vi.fn(() => Promise.resolve(++callCount));

      // Execute 3 functions
      const promises = [
        limiter.executeWithLimit(mockFn),
        limiter.executeWithLimit(mockFn),
        limiter.executeWithLimit(mockFn),
      ];

      // Track execution
      let completed = 0;
      promises.forEach((p) => p.then(() => completed++));

      // First 2 should complete immediately
      await vi.advanceTimersByTimeAsync(0);
      expect(completed).toBe(2);
      expect(mockFn).toHaveBeenCalledTimes(2);

      // Third should be delayed
      await vi.advanceTimersByTimeAsync(1000);
      await Promise.all(promises);
      expect(completed).toBe(3);
      expect(mockFn).toHaveBeenCalledTimes(3);
    });
  });
});

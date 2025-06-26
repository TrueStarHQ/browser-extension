import { describe, it, expect, vi } from 'vitest';
import { retryWithBackoff } from './retry-helper';

describe('Retry Helper', () => {
  describe('retryWithBackoff', () => {
    it('should succeed on first try if function succeeds', async () => {
      const mockFn = vi.fn().mockResolvedValue('success');

      const result = await retryWithBackoff(mockFn);

      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should retry on failure and eventually succeed', async () => {
      const mockFn = vi
        .fn()
        .mockRejectedValueOnce(new Error('First failure'))
        .mockRejectedValueOnce(new Error('Second failure'))
        .mockResolvedValue('success');

      const result = await retryWithBackoff(mockFn, { maxRetries: 3 });

      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(3);
    });

    it('should throw after max retries exceeded', async () => {
      const mockFn = vi.fn().mockRejectedValue(new Error('Always fails'));

      await expect(retryWithBackoff(mockFn, { maxRetries: 2 })).rejects.toThrow(
        'Always fails'
      );

      expect(mockFn).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });

    it('should use exponential backoff delays', async () => {
      vi.useFakeTimers();

      const mockFn = vi
        .fn()
        .mockRejectedValueOnce(new Error('First'))
        .mockRejectedValueOnce(new Error('Second'))
        .mockResolvedValue('success');

      const promise = retryWithBackoff(mockFn, {
        maxRetries: 2,
        initialDelay: 100,
        maxDelay: 1000,
      });

      // Initial call
      expect(mockFn).toHaveBeenCalledTimes(1);

      // First retry after 100ms
      await vi.advanceTimersByTimeAsync(100);
      expect(mockFn).toHaveBeenCalledTimes(2);

      // Second retry after 200ms (exponential backoff)
      await vi.advanceTimersByTimeAsync(200);
      expect(mockFn).toHaveBeenCalledTimes(3);

      const result = await promise;
      expect(result).toBe('success');

      vi.useRealTimers();
    });

    it('should respect max delay', async () => {
      vi.useFakeTimers();

      const mockFn = vi
        .fn()
        .mockRejectedValueOnce(new Error('1'))
        .mockRejectedValueOnce(new Error('2'))
        .mockRejectedValueOnce(new Error('3'))
        .mockRejectedValueOnce(new Error('4'))
        .mockResolvedValue('success');

      const promise = retryWithBackoff(mockFn, {
        maxRetries: 4,
        initialDelay: 100,
        maxDelay: 300,
      });

      // Initial call
      expect(mockFn).toHaveBeenCalledTimes(1);

      // Delays: 100, 200, 300 (capped), 300 (capped)
      await vi.advanceTimersByTimeAsync(100);
      expect(mockFn).toHaveBeenCalledTimes(2);

      await vi.advanceTimersByTimeAsync(200);
      expect(mockFn).toHaveBeenCalledTimes(3);

      await vi.advanceTimersByTimeAsync(300);
      expect(mockFn).toHaveBeenCalledTimes(4);

      await vi.advanceTimersByTimeAsync(300);
      expect(mockFn).toHaveBeenCalledTimes(5);

      const result = await promise;
      expect(result).toBe('success');

      vi.useRealTimers();
    });

    it('should allow custom shouldRetry function', async () => {
      const retryableError = new Error('Retry this');
      const nonRetryableError = new Error('Do not retry');

      const mockFn = vi
        .fn()
        .mockRejectedValueOnce(retryableError)
        .mockRejectedValueOnce(nonRetryableError);

      const shouldRetry = (error: Error) => error.message === 'Retry this';

      await expect(
        retryWithBackoff(mockFn, {
          maxRetries: 3,
          shouldRetry,
        })
      ).rejects.toThrow('Do not retry');

      expect(mockFn).toHaveBeenCalledTimes(2);
    });
  });
});

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { generateFallbackId } from './review-id-generator';

describe('Review ID Generator', () => {
  describe('generateFallbackId', () => {
    beforeEach(() => {
      // Mock Date.now() to return a consistent timestamp
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2025-06-26T10:30:00Z'));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should generate a fallback ID with UNKNOWN prefix', () => {
      const id = generateFallbackId(0);
      expect(id).toMatch(/^UNKNOWN_/);
    });

    it('should include timestamp in the ID', () => {
      const expectedTimestamp = Date.now();
      const id = generateFallbackId(0);
      expect(id).toBe(`UNKNOWN_${expectedTimestamp}_0`);
    });

    it('should include the index in the ID', () => {
      const id1 = generateFallbackId(0);
      const id2 = generateFallbackId(1);
      const id3 = generateFallbackId(42);

      expect(id1).toMatch(/_0$/);
      expect(id2).toMatch(/_1$/);
      expect(id3).toMatch(/_42$/);
    });

    it('should generate unique IDs for different indices at the same timestamp', () => {
      const id1 = generateFallbackId(0);
      const id2 = generateFallbackId(1);

      expect(id1).not.toBe(id2);
    });

    it('should generate different IDs at different timestamps', () => {
      const id1 = generateFallbackId(0);

      // Advance time by 1 second
      vi.advanceTimersByTime(1000);

      const id2 = generateFallbackId(0);

      expect(id1).not.toBe(id2);
    });
  });
});

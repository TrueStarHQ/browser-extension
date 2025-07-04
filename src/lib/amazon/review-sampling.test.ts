import { describe, expect, it } from 'vitest';

import { selectPagesToFetch } from './review-sampling';

describe('Review Sampling Strategy', () => {
  describe('selectPagesToFetch', () => {
    it('return all pages when total pages <= 8', () => {
      const totalPages = 5;

      const pages = selectPagesToFetch(totalPages);

      expect(pages).toEqual([1, 2, 3, 4, 5]);
    });

    it('sample pages when total pages > 8: first 5, last 3', () => {
      const totalPages = 20;

      const pages = selectPagesToFetch(totalPages);

      // Should include first 5 pages (1-5) and last 3 pages (18-20)
      expect(pages).toContain(1);
      expect(pages).toContain(2);
      expect(pages).toContain(3);
      expect(pages).toContain(4);
      expect(pages).toContain(5);
      expect(pages).toContain(18);
      expect(pages).toContain(19);
      expect(pages).toContain(20);
      expect(pages.length).toBe(8);
    });

    it('include middle samples for very large page counts', () => {
      const totalPages = 100;

      const pages = selectPagesToFetch(totalPages);

      // Should include first 5, last 3, and some middle samples
      expect(pages).toContain(1);
      expect(pages).toContain(5);
      expect(pages).toContain(98);
      expect(pages).toContain(100);

      // Should have middle samples
      const middlePages = pages.filter((p) => p > 5 && p < 98);
      expect(middlePages.length).toBeGreaterThan(0);

      // Total should still be limited
      expect(pages.length).toBeLessThanOrEqual(12); // Allow some flexibility for middle samples
    });
  });
});

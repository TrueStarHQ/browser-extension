import { describe, expect, it } from 'vitest';

import { selectPagesToFetch } from './review-sampling';

describe('Amazon review sampling strategy', () => {
  describe('selectPagesToFetch', () => {
    it('returns all pages when total pages <= 8', () => {
      const totalPages = 5;

      const pages = selectPagesToFetch(totalPages);

      expect(pages).toEqual([1, 2, 3, 4, 5]);
    });

    it('samples pages when total pages > 8: first 5, last 3', () => {
      const totalPages = 20;

      const pages = selectPagesToFetch(totalPages);

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

    it('includes middle samples for very large page counts', () => {
      const totalPages = 100;

      const pages = selectPagesToFetch(totalPages);

      expect(pages).toContain(1);
      expect(pages).toContain(5);
      expect(pages).toContain(98);
      expect(pages).toContain(100);

      const middlePages = pages.filter((p) => p > 5 && p < 98);
      expect(middlePages.length).toBeGreaterThan(0);

      expect(pages.length).toBeLessThanOrEqual(12);
    });
  });
});

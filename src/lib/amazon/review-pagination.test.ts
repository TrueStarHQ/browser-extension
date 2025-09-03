import { describe, expect, it } from 'vitest';

import { extractPaginationInfo } from './review-pagination';

describe('Amazon pagination', () => {
  describe('extractPaginationInfo', () => {
    it('extracts total review count from data-hook attribute', () => {
      const html = `
        <span data-hook="total-review-count" class="a-size-base a-color-secondary">
          30,230 global ratings
        </span>
      `;

      const result = extractPaginationInfo(html);

      expect(result.totalReviews).toBe(30230);
      expect(result.totalPages).toBe(3023);
    });

    it('handles European number format with periods as thousands separators', () => {
      const html = `
        <span data-hook="total-review-count">
          1.234.567 Bewertungen
        </span>
      `;

      const result = extractPaginationInfo(html);

      expect(result.totalReviews).toBe(1234567);
      expect(result.totalPages).toBe(123457);
    });

    it('handles mixed format with spaces', () => {
      const html = `
        <span data-hook="total-review-count">
          89 customer reviews
        </span>
      `;

      const result = extractPaginationInfo(html);

      expect(result.totalReviews).toBe(89);
    });

    it('calculates total pages based on reviews per page', () => {
      const html = `
        <span data-hook="total-review-count">
          2,156 customer reviews
        </span>
      `;

      const result = extractPaginationInfo(html);

      expect(result.totalPages).toBe(216);
    });
  });

  describe('edge cases', () => {
    it('handles single page of reviews (less than 10)', () => {
      const html = `
        <span data-hook="total-review-count">7 customer reviews</span>
      `;

      const result = extractPaginationInfo(html);

      expect(result.totalReviews).toBe(7);
      expect(result.totalPages).toBe(1);
    });

    it('handles exactly 10 reviews (one full page)', () => {
      const html = `
        <span data-hook="total-review-count">10 customer reviews</span>
      `;

      const result = extractPaginationInfo(html);

      expect(result.totalReviews).toBe(10);
      expect(result.totalPages).toBe(1);
    });

    it('handles exactly 11 reviews (requires 2 pages)', () => {
      const html = `
        <span data-hook="total-review-count">11 customer reviews</span>
      `;

      const result = extractPaginationInfo(html);

      expect(result.totalReviews).toBe(11);
      expect(result.totalPages).toBe(2);
    });

    it('handles zero reviews', () => {
      const html = `
        <span data-hook="total-review-count">0 customer reviews</span>
      `;

      const result = extractPaginationInfo(html);

      expect(result.totalReviews).toBe(0);
      expect(result.totalPages).toBe(0);
    });

    it('handles missing review count element gracefully', () => {
      const html = `
        <div>
          <span>Some other content</span>
        </div>
      `;

      const result = extractPaginationInfo(html);

      expect(result.totalReviews).toBe(0);
      expect(result.totalPages).toBe(0);
    });

    it('handles reviews with commas in large numbers', () => {
      const html = `
        <span data-hook="total-review-count">23,567 customer reviews</span>
      `;

      const result = extractPaginationInfo(html);

      expect(result.totalReviews).toBe(23567);
      expect(result.totalPages).toBe(2357);
    });

    it('returns zero when data-hook attribute is not found', () => {
      const html = `
        <p>Some other content without the specific data-hook</p>
        <span>30,230 ratings</span>
      `;

      const result = extractPaginationInfo(html);

      expect(result.totalReviews).toBe(0);
      expect(result.totalPages).toBe(0);
    });
  });
});

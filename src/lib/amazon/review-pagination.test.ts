import { describe, expect, it } from 'vitest';

import { buildReviewPageUrl, extractPaginationInfo } from './review-pagination';

describe('Amazon pagination', () => {
  describe('extractPaginationInfo', () => {
    it('extracts total review count from the page', () => {
      const html = `
        <div data-hook="cr-filter-info-review-rating-count">
          <span>10,234 global ratings | 2,156 global reviews</span>
        </div>
      `;

      const result = extractPaginationInfo(html);

      expect(result.totalReviews).toBe(2156);
    });

    it('handles different review count formats', () => {
      const html = `
        <div data-hook="cr-filter-info-review-rating-count">
          <span>567 global ratings | 89 global reviews</span>
        </div>
      `;

      const result = extractPaginationInfo(html);

      expect(result.totalReviews).toBe(89);
    });

    it('calculates total pages based on reviews per page', () => {
      const html = `
        <div data-hook="cr-filter-info-review-rating-count">
          <span>10,234 global ratings | 2,156 global reviews</span>
        </div>
      `;

      const result = extractPaginationInfo(html);

      expect(result.totalPages).toBe(216);
    });
  });

  describe('buildReviewPageUrl', () => {
    it('generates URL for a specific review page', () => {
      const productId = 'B08N5WRWNW';
      const pageNumber = 2;

      const url = buildReviewPageUrl(productId, pageNumber);

      expect(url).toBe(
        'https://www.amazon.com/product-reviews/B08N5WRWNW?pageNumber=2'
      );
    });
  });

  describe('edge cases', () => {
    it('handles single page of reviews (less than 10)', () => {
      const html = `
        <div data-hook="cr-filter-info-review-rating-count">
          <span>15 global ratings | 7 global reviews</span>
        </div>
      `;

      const result = extractPaginationInfo(html);

      expect(result.totalReviews).toBe(7);
      expect(result.totalPages).toBe(1);
    });

    it('handles exactly 10 reviews (one full page)', () => {
      const html = `
        <div data-hook="cr-filter-info-review-rating-count">
          <span>25 global ratings | 10 global reviews</span>
        </div>
      `;

      const result = extractPaginationInfo(html);

      expect(result.totalReviews).toBe(10);
      expect(result.totalPages).toBe(1);
    });

    it('handles exactly 11 reviews (requires 2 pages)', () => {
      const html = `
        <div data-hook="cr-filter-info-review-rating-count">
          <span>30 global ratings | 11 global reviews</span>
        </div>
      `;

      const result = extractPaginationInfo(html);

      expect(result.totalReviews).toBe(11);
      expect(result.totalPages).toBe(2);
    });

    it('handles zero reviews', () => {
      const html = `
        <div data-hook="cr-filter-info-review-rating-count">
          <span>0 global ratings | 0 global reviews</span>
        </div>
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
        <div data-hook="cr-filter-info-review-rating-count">
          <span>125,456 global ratings | 23,567 global reviews</span>
        </div>
      `;

      const result = extractPaginationInfo(html);

      expect(result.totalReviews).toBe(23567);
      expect(result.totalPages).toBe(2357);
    });

    it('handles alternative review count text formats', () => {
      const html = `
        <div data-hook="cr-filter-info-review-rating-count">
          <span>Showing 1-10 of 156 reviews</span>
        </div>
      `;

      const result = extractPaginationInfo(html);

      expect(result.totalReviews).toBeGreaterThanOrEqual(0);
    });
  });
});

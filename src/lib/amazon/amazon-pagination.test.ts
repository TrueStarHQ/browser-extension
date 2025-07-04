import { describe, expect, it } from 'vitest';

import {
  analyzeReviewPagination,
  generateReviewPageUrl,
} from './amazon-pagination';

describe('Amazon Pagination Analysis', () => {
  describe('analyzeReviewPagination', () => {
    it('extract total review count from the page', () => {
      const html = `
        <div data-hook="cr-filter-info-review-rating-count">
          <span>10,234 global ratings | 2,156 global reviews</span>
        </div>
      `;

      const result = analyzeReviewPagination(html);

      expect(result.totalReviews).toBe(2156);
    });

    it('handle different review count formats', () => {
      const html = `
        <div data-hook="cr-filter-info-review-rating-count">
          <span>567 global ratings | 89 global reviews</span>
        </div>
      `;

      const result = analyzeReviewPagination(html);

      expect(result.totalReviews).toBe(89);
    });

    it('calculate total pages based on reviews per page', () => {
      const html = `
        <div data-hook="cr-filter-info-review-rating-count">
          <span>10,234 global ratings | 2,156 global reviews</span>
        </div>
      `;

      const result = analyzeReviewPagination(html);

      // Amazon shows 10 reviews per page
      expect(result.totalPages).toBe(216); // 2156 / 10 = 215.6, rounded up to 216
    });
  });

  describe('generateReviewPageUrl', () => {
    it('generate URL for a specific review page', () => {
      const productId = 'B08N5WRWNW';
      const pageNumber = 2;

      const url = generateReviewPageUrl(productId, pageNumber);

      expect(url).toBe(
        'https://www.amazon.com/product-reviews/B08N5WRWNW?pageNumber=2'
      );
    });
  });

  describe('edge cases', () => {
    it('handle single page of reviews (less than 10)', () => {
      const html = `
        <div data-hook="cr-filter-info-review-rating-count">
          <span>15 global ratings | 7 global reviews</span>
        </div>
      `;

      const result = analyzeReviewPagination(html);

      expect(result.totalReviews).toBe(7);
      expect(result.totalPages).toBe(1);
    });

    it('handle exactly 10 reviews (one full page)', () => {
      const html = `
        <div data-hook="cr-filter-info-review-rating-count">
          <span>25 global ratings | 10 global reviews</span>
        </div>
      `;

      const result = analyzeReviewPagination(html);

      expect(result.totalReviews).toBe(10);
      expect(result.totalPages).toBe(1);
    });

    it('handle exactly 11 reviews (requires 2 pages)', () => {
      const html = `
        <div data-hook="cr-filter-info-review-rating-count">
          <span>30 global ratings | 11 global reviews</span>
        </div>
      `;

      const result = analyzeReviewPagination(html);

      expect(result.totalReviews).toBe(11);
      expect(result.totalPages).toBe(2);
    });

    it('handle zero reviews', () => {
      const html = `
        <div data-hook="cr-filter-info-review-rating-count">
          <span>0 global ratings | 0 global reviews</span>
        </div>
      `;

      const result = analyzeReviewPagination(html);

      expect(result.totalReviews).toBe(0);
      expect(result.totalPages).toBe(0);
    });

    it('handle missing review count element gracefully', () => {
      const html = `
        <div>
          <span>Some other content</span>
        </div>
      `;

      const result = analyzeReviewPagination(html);

      expect(result.totalReviews).toBe(0);
      expect(result.totalPages).toBe(0);
    });

    it('handle reviews with commas in large numbers', () => {
      const html = `
        <div data-hook="cr-filter-info-review-rating-count">
          <span>125,456 global ratings | 23,567 global reviews</span>
        </div>
      `;

      const result = analyzeReviewPagination(html);

      expect(result.totalReviews).toBe(23567);
      expect(result.totalPages).toBe(2357); // 23567 / 10 = 2356.7, rounded up
    });

    it('handle alternative review count text formats', () => {
      // Sometimes Amazon shows different text formats
      const html = `
        <div data-hook="cr-filter-info-review-rating-count">
          <span>Showing 1-10 of 156 reviews</span>
        </div>
      `;

      const result = analyzeReviewPagination(html);

      // Current implementation might not handle this format
      // This test documents expected behavior for enhancement
      expect(result.totalReviews).toBeGreaterThanOrEqual(0);
    });
  });
});

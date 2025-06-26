import { describe, it, expect } from 'vitest';
import {
  analyzeReviewPagination,
  generateReviewPageUrl,
} from './amazon-pagination';

describe('Amazon Pagination Analysis', () => {
  describe('analyzeReviewPagination', () => {
    it('should extract total review count from the page', () => {
      const html = `
        <div data-hook="cr-filter-info-review-rating-count">
          <span>10,234 global ratings | 2,156 global reviews</span>
        </div>
      `;

      const result = analyzeReviewPagination(html);

      expect(result.totalReviews).toBe(2156);
    });

    it('should handle different review count formats', () => {
      const html = `
        <div data-hook="cr-filter-info-review-rating-count">
          <span>567 global ratings | 89 global reviews</span>
        </div>
      `;

      const result = analyzeReviewPagination(html);

      expect(result.totalReviews).toBe(89);
    });

    it('should calculate total pages based on reviews per page', () => {
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
    it('should generate URL for a specific review page', () => {
      const productId = 'B08N5WRWNW';
      const pageNumber = 2;

      const url = generateReviewPageUrl(productId, pageNumber);

      expect(url).toBe(
        'https://www.amazon.com/product-reviews/B08N5WRWNW?pageNumber=2'
      );
    });
  });
});

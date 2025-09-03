import { describe, expect, it, vi } from 'vitest';

import { parseReviewsFromHtml } from './review-parser';

vi.mock('$lib/utils/logger', () => ({
  log: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe('Amazon review parser', () => {
  describe('parseReviewsFromHtml', () => {
    it('parses a complete review with all fields', () => {
      const html = `
        <li id="R1JPYVAX0YZCWD" data-hook="review" class="review aok-relative">
          <div class="a-profile-content">
            <span class="a-profile-name">Test User</span>
          </div>
          <a data-hook="review-title" class="review-title">
            <i data-hook="review-star-rating" class="a-icon a-icon-star a-star-5 review-rating">
              <span class="a-icon-alt">5.0 out of 5 stars</span>
            </i>
            <span>Excellent Product!</span>
          </a>
          <span data-hook="review-date">Reviewed in the United States on January 1, 2024</span>
          <span data-hook="avp-badge">Verified Purchase</span>
          <span data-hook="vine-badge">Customer review from the Amazon Vine program</span>
          <span data-hook="review-body">
            <span>This product exceeded my expectations in every way.</span>
          </span>
          <span data-hook="helpful-vote-statement">42 people found this helpful</span>
          <div class="review-data">
            <span class="a-color-secondary">Color: Blue</span>
          </div>
        </li>
      `;

      const reviews = parseReviewsFromHtml(html);

      expect(reviews).toHaveLength(1);
      const review = reviews[0]!;
      expect(review).toEqual({
        id: 'R1JPYVAX0YZCWD',
        authorName: 'Test User',
        rating: 5,
        title: 'Excellent Product!',
        text: 'This product exceeded my expectations in every way.',
        isVerifiedPurchase: true,
        isVineReview: true,
        date: 'Reviewed in the United States on January 1, 2024',
        helpfulVotes: 42,
        productVariation: 'Color: Blue',
      });
    });

    it('parses minimal review with only required fields', () => {
      const html = `
        <li id="RMINIMAL" data-hook="review">
          <span class="a-profile-name">Anonymous User</span>
          <i data-hook="review-star-rating">
            <span class="a-icon-alt">3.0 out of 5 stars</span>
          </i>
          <a data-hook="review-title">
            <span>OK Product</span>
          </a>
          <span data-hook="review-body">
            <span>It's acceptable.</span>
          </span>
          <span data-hook="review-date">Reviewed on January 1, 2024</span>
        </li>
      `;

      const reviews = parseReviewsFromHtml(html);

      expect(reviews).toHaveLength(1);
      const review = reviews[0]!;
      expect(review.id).toBe('RMINIMAL');
      expect(review.authorName).toBe('Anonymous User');
      expect(review.rating).toBe(3);
      expect(review.title).toBe('OK Product');
      expect(review.text).toBe("It's acceptable.");
      expect(review.isVerifiedPurchase).toBe(false);
      expect(review.isVineReview).toBe(false);
      expect(review.date).toBe('Reviewed on January 1, 2024');
      expect(review.helpfulVotes).toBeUndefined();
      expect(review.productVariation).toBeUndefined();
    });

    it('skips reviews without ID', () => {
      const html = `
        <li data-hook="review">
          <span class="a-profile-name">No ID User</span>
          <i data-hook="review-star-rating">
            <span class="a-icon-alt">4.0 out of 5 stars</span>
          </i>
          <a data-hook="review-title">
            <span>Good but no ID</span>
          </a>
          <span data-hook="review-body">
            <span>This review has no ID.</span>
          </span>
        </li>
        <li id="RVALID123" data-hook="review">
          <span class="a-profile-name">Valid User</span>
          <i data-hook="review-star-rating">
            <span class="a-icon-alt">5.0 out of 5 stars</span>
          </i>
          <a data-hook="review-title">
            <span>Valid Review</span>
          </a>
          <span data-hook="review-body">
            <span>This review has an ID.</span>
          </span>
          <span data-hook="review-date">Reviewed on January 2, 2024</span>
        </li>
      `;

      const reviews = parseReviewsFromHtml(html);

      expect(reviews).toHaveLength(1);
      expect(reviews[0]!.id).toBe('RVALID123');
    });

    it('skips reviews missing required fields', () => {
      const html = `
        <!-- Missing rating -->
        <li id="R1" data-hook="review">
          <a data-hook="review-title"><span>No Rating</span></a>
          <span data-hook="review-body"><span>Text here</span></span>
        </li>
        
        <!-- Missing title -->
        <li id="R2" data-hook="review">
          <i data-hook="review-star-rating">
            <span class="a-icon-alt">4.0 out of 5 stars</span>
          </i>
          <span data-hook="review-body"><span>Text here</span></span>
        </li>
        
        <!-- Missing text -->
        <li id="R3" data-hook="review">
          <i data-hook="review-star-rating">
            <span class="a-icon-alt">4.0 out of 5 stars</span>
          </i>
          <a data-hook="review-title"><span>Title here</span></a>
        </li>
        
        <!-- Valid review -->
        <li id="R4" data-hook="review">
          <span class="a-profile-name">Valid Author</span>
          <i data-hook="review-star-rating">
            <span class="a-icon-alt">4.0 out of 5 stars</span>
          </i>
          <a data-hook="review-title"><span>Complete Review</span></a>
          <span data-hook="review-body"><span>This one is valid</span></span>
          <span data-hook="review-date">Reviewed on January 3, 2024</span>
        </li>
      `;

      const reviews = parseReviewsFromHtml(html);

      expect(reviews).toHaveLength(1);
      expect(reviews[0]!.id).toBe('R4');
    });

    it('skips reviews with missing author', () => {
      const html = `
        <li id="RNOAUTHOR" data-hook="review">
          <i data-hook="review-star-rating">
            <span class="a-icon-alt">4.0 out of 5 stars</span>
          </i>
          <a data-hook="review-title">
            <span>No Author</span>
          </a>
          <span data-hook="review-body">
            <span>Review without author name</span>
          </span>
          <span data-hook="review-date">Reviewed on January 4, 2024</span>
        </li>
      `;

      const reviews = parseReviewsFromHtml(html);

      // Should skip because author is missing
      expect(reviews).toHaveLength(0);
    });

    it('parses helpful votes in various formats', () => {
      const htmlWithNumbers = `
        <li id="R1" data-hook="review">
          <span class="a-profile-name">User 1</span>
          <i data-hook="review-star-rating">
            <span class="a-icon-alt">5.0 out of 5 stars</span>
          </i>
          <a data-hook="review-title"><span>Review 1</span></a>
          <span data-hook="review-body"><span>Text</span></span>
          <span data-hook="helpful-vote-statement">2,500 people found this helpful</span>
          <span data-hook="review-date">Reviewed on January 5, 2024</span>
        </li>
      `;

      const htmlWithOne = `
        <li id="R2" data-hook="review">
          <span class="a-profile-name">User 2</span>
          <i data-hook="review-star-rating">
            <span class="a-icon-alt">5.0 out of 5 stars</span>
          </i>
          <a data-hook="review-title"><span>Review 2</span></a>
          <span data-hook="review-body"><span>Text</span></span>
          <span data-hook="helpful-vote-statement">One person found this helpful</span>
          <span data-hook="review-date">Reviewed on January 6, 2024</span>
        </li>
      `;

      const reviews1 = parseReviewsFromHtml(htmlWithNumbers);
      expect(reviews1[0]!.helpfulVotes).toBe(2500);

      const reviews2 = parseReviewsFromHtml(htmlWithOne);
      expect(reviews2[0]!.helpfulVotes).toBe(1);
    });

    it('extracts product variations correctly', () => {
      const html = `
        <li id="RVARIATION" data-hook="review">
          <span class="a-profile-name">Variation User</span>
          <i data-hook="review-star-rating">
            <span class="a-icon-alt">4.0 out of 5 stars</span>
          </i>
          <a data-hook="review-title"><span>Variation Test</span></a>
          <span data-hook="review-body"><span>Testing variations</span></span>
          <div class="review-data">
            <span class="a-color-secondary">Size: Large</span>
          </div>
          <span data-hook="review-date">Reviewed on January 7, 2024</span>
        </li>
      `;

      const reviews = parseReviewsFromHtml(html);

      expect(reviews[0]!.productVariation).toBe('Size: Large');
    });

    it('handles decimal ratings correctly', () => {
      const html = `
        <li id="RDECIMAL" data-hook="review">
          <span class="a-profile-name">Decimal User</span>
          <i data-hook="review-star-rating">
            <span class="a-icon-alt">4.5 out of 5 stars</span>
          </i>
          <a data-hook="review-title"><span>Decimal Rating</span></a>
          <span data-hook="review-body"><span>Testing decimal ratings</span></span>
          <span data-hook="review-date">Reviewed on January 8, 2024</span>
        </li>
      `;

      const reviews = parseReviewsFromHtml(html);

      expect(reviews[0]!.rating).toBe(4.5);
    });

    it('handles empty HTML gracefully', () => {
      const reviews = parseReviewsFromHtml('');
      expect(reviews).toEqual([]);
    });

    it('handles HTML without any reviews', () => {
      const html = '<div>No reviews here</div>';
      const reviews = parseReviewsFromHtml(html);
      expect(reviews).toEqual([]);
    });

    it('handles malformed HTML gracefully', () => {
      const html = `
        <li id="RMALFORMED" data-hook="review">
          <i data-hook="review-star-rating">
            <span class="a-icon-alt">not a valid rating</span>
          </i>
          <a data-hook="review-title"><span>Malformed</span></a>
          <span data-hook="review-body"><span>Testing malformed data</span></span>
        </li>
      `;

      const reviews = parseReviewsFromHtml(html);

      // Should skip due to invalid rating (0)
      expect(reviews).toHaveLength(0);
    });

    it('parses multiple reviews correctly', () => {
      const html = `
        <li id="R1" data-hook="review">
          <span class="a-profile-name">User 1</span>
          <i data-hook="review-star-rating">
            <span class="a-icon-alt">5.0 out of 5 stars</span>
          </i>
          <a data-hook="review-title"><span>Review 1</span></a>
          <span data-hook="review-body"><span>First review</span></span>
          <span data-hook="review-date">Reviewed on January 9, 2024</span>
        </li>
        <li id="R2" data-hook="review">
          <span class="a-profile-name">User 2</span>
          <i data-hook="review-star-rating">
            <span class="a-icon-alt">3.0 out of 5 stars</span>
          </i>
          <a data-hook="review-title"><span>Review 2</span></a>
          <span data-hook="review-body"><span>Second review</span></span>
          <span data-hook="avp-badge">Verified</span>
          <span data-hook="review-date">Reviewed on January 10, 2024</span>
        </li>
        <li id="R3" data-hook="review">
          <span class="a-profile-name">User 3</span>
          <i data-hook="review-star-rating">
            <span class="a-icon-alt">1.0 out of 5 stars</span>
          </i>
          <a data-hook="review-title"><span>Review 3</span></a>
          <span data-hook="review-body"><span>Third review</span></span>
          <span data-hook="vine-badge">Vine</span>
          <span data-hook="review-date">Reviewed on January 11, 2024</span>
        </li>
      `;

      const reviews = parseReviewsFromHtml(html);

      expect(reviews).toHaveLength(3);
      expect(reviews[0]!.id).toBe('R1');
      expect(reviews[0]!.isVerifiedPurchase).toBe(false);
      expect(reviews[0]!.isVineReview).toBe(false);

      expect(reviews[1]!.id).toBe('R2');
      expect(reviews[1]!.isVerifiedPurchase).toBe(true);
      expect(reviews[1]!.isVineReview).toBe(false);

      expect(reviews[2]!.id).toBe('R3');
      expect(reviews[2]!.isVerifiedPurchase).toBe(false);
      expect(reviews[2]!.isVineReview).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('handles reviews with alternative selector structures', () => {
      const html = `
        <li id="RALT" data-hook="review">
          <span class="a-profile-name">Alternative User</span>
          <div class="review-rating">
            <span class="a-icon-alt">4.0 out of 5 stars</span>
          </div>
          <a data-hook="review-title"><span>Alternative Structure</span></a>
          <div class="review-text-content">
            <span>Alternative review text location</span>
          </div>
          <span data-hook="review-date">Reviewed on January 12, 2024</span>
        </li>
      `;

      const reviews = parseReviewsFromHtml(html);

      expect(reviews).toHaveLength(1);
      expect(reviews[0]!.rating).toBe(4);
      expect(reviews[0]!.text).toBe('Alternative review text location');
    });

    it('handles reviews with nested title spans', () => {
      const html = `
        <li id="RNESTED" data-hook="review">
          <span class="a-profile-name">Nested User</span>
          <i data-hook="review-star-rating">
            <span class="a-icon-alt">4.0 out of 5 stars</span>
          </i>
          <a data-hook="review-title">
            <span>First span</span>
            <span>Actual Title</span>
          </a>
          <span data-hook="review-body"><span>Review text</span></span>
          <span data-hook="review-date">Reviewed on January 13, 2024</span>
        </li>
      `;

      const reviews = parseReviewsFromHtml(html);

      expect(reviews).toHaveLength(1);
      // Should get the last span as per the selector
      expect(reviews[0]!.title).toBe('Actual Title');
    });
  });
});

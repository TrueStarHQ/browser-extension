import { describe, it, expect, vi } from 'vitest';
import { parseReviewsFromHtml } from './review-parser';

describe('Review Parser', () => {
  describe('parseReviewsFromHtml', () => {
    it('should extract reviews from Amazon review page HTML', () => {
      const html = `
        <div id="RQ1XFNZ96Y1ST" data-hook="review" class="review">
          <div class="a-profile-content">
            <span class="a-profile-name">John Doe</span>
          </div>
          <div class="review-rating">
            <i class="a-icon-star-5"><span class="a-icon-alt">5.0 out of 5 stars</span></i>
          </div>
          <span class="review-text-content">
            <span>Great product! Works exactly as described.</span>
          </span>
          <span data-hook="avp-badge" class="a-size-mini">Verified Purchase</span>
        </div>
      `;

      const reviews = parseReviewsFromHtml(html);

      expect(reviews).toHaveLength(1);
      expect(reviews[0]).toEqual({
        id: 'RQ1XFNZ96Y1ST',
        rating: 5,
        text: 'Great product! Works exactly as described.',
        author: 'John Doe',
        verified: true,
      });
    });

    it('should parse multiple reviews from HTML', () => {
      const html = `
        <div id="R2FGE3K2H5J3BV" data-hook="review" class="review">
          <div class="a-profile-content">
            <span class="a-profile-name">Alice</span>
          </div>
          <div class="review-rating">
            <i class="a-icon-star-4"><span class="a-icon-alt">4.0 out of 5 stars</span></i>
          </div>
          <span class="review-text-content">
            <span>Good product, but could be better.</span>
          </span>
        </div>
        <div id="R3MRNXWE5378WB" data-hook="review" class="review">
          <div class="a-profile-content">
            <span class="a-profile-name">Bob</span>
          </div>
          <div class="review-rating">
            <i class="a-icon-star-1"><span class="a-icon-alt">1.0 out of 5 stars</span></i>
          </div>
          <span class="review-text-content">
            <span>Terrible quality!</span>
          </span>
          <span data-hook="avp-badge" class="a-size-mini">Verified Purchase</span>
        </div>
      `;

      const reviews = parseReviewsFromHtml(html);

      expect(reviews).toHaveLength(2);
      expect(reviews[0]).toEqual({
        id: 'R2FGE3K2H5J3BV',
        rating: 4,
        text: 'Good product, but could be better.',
        author: 'Alice',
        verified: false,
      });
      expect(reviews[1]).toEqual({
        id: 'R3MRNXWE5378WB',
        rating: 1,
        text: 'Terrible quality!',
        author: 'Bob',
        verified: true,
      });
    });

    it('should generate fallback ID when review element has no ID', () => {
      // Mock Date.now() and console.warn
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2025-06-26T10:30:00Z'));
      const consoleWarnSpy = vi
        .spyOn(console, 'warn')
        .mockImplementation(() => {});

      const html = `
        <div data-hook="review" class="review">
          <div class="a-profile-content">
            <span class="a-profile-name">Charlie</span>
          </div>
          <div class="review-rating">
            <i class="a-icon-star-3"><span class="a-icon-alt">3.0 out of 5 stars</span></i>
          </div>
          <span class="review-text-content">
            <span>Average product.</span>
          </span>
        </div>
      `;

      const reviews = parseReviewsFromHtml(html);
      const expectedTimestamp = Date.now();

      expect(reviews).toHaveLength(1);
      expect(reviews[0].id).toBe(`UNKNOWN_${expectedTimestamp}_0`);
      expect(reviews[0].rating).toBe(3);
      expect(reviews[0].text).toBe('Average product.');
      expect(reviews[0].author).toBe('Charlie');
      expect(reviews[0].verified).toBe(false);

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Review element missing ID attribute, using fallback:',
        `UNKNOWN_${expectedTimestamp}_0`
      );

      // Cleanup
      consoleWarnSpy.mockRestore();
      vi.useRealTimers();
    });
  });
});

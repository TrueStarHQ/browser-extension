import { describe, expect, it, vi } from 'vitest';

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
      expect(reviews[0]!).toEqual({
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
      expect(reviews[0]!).toEqual({
        id: 'R2FGE3K2H5J3BV',
        rating: 4,
        text: 'Good product, but could be better.',
        author: 'Alice',
        verified: false,
      });
      expect(reviews[1]!).toEqual({
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
      expect(reviews[0]!.id).toBe(`UNKNOWN_${expectedTimestamp}_0`);
      expect(reviews[0]!.rating).toBe(3);
      expect(reviews[0]!.text).toBe('Average product.');
      expect(reviews[0]!.author).toBe('Charlie');
      expect(reviews[0]!.verified).toBe(false);

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'TrueStar: Review element missing ID attribute, using fallback:',
        `UNKNOWN_${expectedTimestamp}_0`
      );

      // Cleanup
      consoleWarnSpy.mockRestore();
      vi.useRealTimers();
    });

    it('should extract review metadata including dates and helpful votes', () => {
      const html = `
        <div id="R1ABC123DEF456" data-hook="review" class="review">
          <div class="a-profile-content">
            <span class="a-profile-name">Emma Wilson</span>
          </div>
          <div class="review-rating">
            <i class="a-icon-star-5"><span class="a-icon-alt">5.0 out of 5 stars</span></i>
          </div>
          <span data-hook="review-date">Reviewed in the United States on December 15, 2024</span>
          <span class="review-text-content">
            <span>Excellent quality and fast shipping!</span>
          </span>
          <span data-hook="avp-badge" class="a-size-mini">Verified Purchase</span>
          <span data-hook="helpful-statement">47 of 52 people found this helpful</span>
        </div>
      `;

      const reviews = parseReviewsFromHtml(html);

      expect(reviews).toHaveLength(1);
      expect(reviews[0]!).toEqual({
        id: 'R1ABC123DEF456',
        rating: 5,
        text: 'Excellent quality and fast shipping!',
        author: 'Emma Wilson',
        verified: true,
        date: 'Reviewed in the United States on December 15, 2024',
        helpfulVotes: 47,
        totalVotes: 52,
      });
    });

    it('should extract product variation information', () => {
      const html = `
        <div id="R2XYZ789GHI012" data-hook="review" class="review">
          <div class="a-profile-content">
            <span class="a-profile-name">Michael Chen</span>
          </div>
          <div class="review-rating">
            <i class="a-icon-star-4"><span class="a-icon-alt">4.0 out of 5 stars</span></i>
          </div>
          <div class="review-data">
            <span class="a-color-secondary">Size: Large</span>
          </div>
          <span class="review-text-content">
            <span>Fits well, good material quality</span>
          </span>
        </div>
        <div id="R3QRS345TUV678" data-hook="review" class="review">
          <div class="a-profile-content">
            <span class="a-profile-name">Sarah Johnson</span>
          </div>
          <div class="review-rating">
            <i class="a-icon-star-3"><span class="a-icon-alt">3.0 out of 5 stars</span></i>
          </div>
          <div class="review-data">
            <span class="a-color-secondary">Color: Blue</span>
          </div>
          <span class="review-text-content">
            <span>Color is different from the picture</span>
          </span>
        </div>
      `;

      const reviews = parseReviewsFromHtml(html);

      expect(reviews).toHaveLength(2);
      expect(reviews[0]!).toMatchObject({
        id: 'R2XYZ789GHI012',
        productVariation: 'Large',
      });
      expect(reviews[1]!).toMatchObject({
        id: 'R3QRS345TUV678',
        productVariation: 'Blue',
      });
    });

    it('should handle reviews with partial helpful vote information', () => {
      const html = `
        <div id="R4MNO901PQR234" data-hook="review" class="review">
          <div class="a-profile-content">
            <span class="a-profile-name">David Park</span>
          </div>
          <div class="review-rating">
            <i class="a-icon-star-2"><span class="a-icon-alt">2.0 out of 5 stars</span></i>
          </div>
          <span class="review-text-content">
            <span>Not what I expected</span>
          </span>
          <span data-hook="helpful-statement">3 people found this helpful</span>
        </div>
      `;

      const reviews = parseReviewsFromHtml(html);

      expect(reviews).toHaveLength(1);
      expect(reviews[0]!).toMatchObject({
        id: 'R4MNO901PQR234',
        helpfulVotes: 3,
        // totalVotes should be undefined when not present
      });
      expect(reviews[0]!.totalVotes).toBeUndefined();
    });

    describe('edge cases', () => {
      it('should handle reviews with empty text content', () => {
        const html = `
          <div id="R5EMPTY001" data-hook="review" class="review">
            <div class="a-profile-content">
              <span class="a-profile-name">Empty Reviewer</span>
            </div>
            <div class="review-rating">
              <i class="a-icon-star-3"><span class="a-icon-alt">3.0 out of 5 stars</span></i>
            </div>
            <span class="review-text-content">
              <span></span>
            </span>
          </div>
        `;

        const reviews = parseReviewsFromHtml(html);
        expect(reviews).toHaveLength(0); // Should skip reviews without text
      });

      it('should handle reviews with special characters and HTML entities', () => {
        const html = `
          <div id="R6SPECIAL002" data-hook="review" class="review">
            <div class="a-profile-content">
              <span class="a-profile-name">José García-López</span>
            </div>
            <div class="review-rating">
              <i class="a-icon-star-4"><span class="a-icon-alt">4.0 out of 5 stars</span></i>
            </div>
            <span class="review-text-content">
              <span>Great product! It's really "awesome" &amp; works well with my setup &lt;3. Cost was ~$50 (50% off!)</span>
            </span>
          </div>
        `;

        const reviews = parseReviewsFromHtml(html);
        expect(reviews).toHaveLength(1);
        expect(reviews[0]!.author).toBe('José García-López');
        expect(reviews[0]!.text).toBe(
          'Great product! It\'s really "awesome" & works well with my setup <3. Cost was ~$50 (50% off!)'
        );
      });

      it('should handle very long review text', () => {
        const longText = 'This is an extremely detailed review. '.repeat(100);
        const html = `
          <div id="R7LONG003" data-hook="review" class="review">
            <div class="a-profile-content">
              <span class="a-profile-name">Verbose Reviewer</span>
            </div>
            <div class="review-rating">
              <i class="a-icon-star-5"><span class="a-icon-alt">5.0 out of 5 stars</span></i>
            </div>
            <span class="review-text-content">
              <span>${longText}</span>
            </span>
          </div>
        `;

        const reviews = parseReviewsFromHtml(html);
        expect(reviews).toHaveLength(1);
        expect(reviews[0]!.text).toBe(longText.trim());
        expect(reviews[0]!.text.length).toBeGreaterThan(3000);
      });

      it('should handle multi-paragraph reviews', () => {
        const html = `
          <div id="R8MULTI004" data-hook="review" class="review">
            <div class="a-profile-content">
              <span class="a-profile-name">Detailed Writer</span>
            </div>
            <div class="review-rating">
              <i class="a-icon-star-4"><span class="a-icon-alt">4.0 out of 5 stars</span></i>
            </div>
            <span class="review-text-content">
              <span>First paragraph about the product quality.
              
              Second paragraph about the shipping experience.
              
              Third paragraph with final thoughts.</span>
            </span>
          </div>
        `;

        const reviews = parseReviewsFromHtml(html);
        expect(reviews).toHaveLength(1);
        expect(reviews[0]!.text).toContain('First paragraph');
        expect(reviews[0]!.text).toContain('Second paragraph');
        expect(reviews[0]!.text).toContain('Third paragraph');
      });

      it('should handle reviews with invalid ratings', () => {
        const html = `
          <div id="R9BADRATING005" data-hook="review" class="review">
            <div class="a-profile-content">
              <span class="a-profile-name">Bad Rating User</span>
            </div>
            <div class="review-rating">
              <i class="a-icon-star"><span class="a-icon-alt">stars</span></i>
            </div>
            <span class="review-text-content">
              <span>This review has a malformed rating</span>
            </span>
          </div>
        `;

        const reviews = parseReviewsFromHtml(html);
        expect(reviews).toHaveLength(0); // Should skip reviews with invalid ratings
      });

      it('should handle reviews with missing author names', () => {
        const html = `
          <div id="R10NOAUTHOR006" data-hook="review" class="review">
            <div class="a-profile-content">
              <span class="a-profile-name"></span>
            </div>
            <div class="review-rating">
              <i class="a-icon-star-3"><span class="a-icon-alt">3.0 out of 5 stars</span></i>
            </div>
            <span class="review-text-content">
              <span>Anonymous review</span>
            </span>
          </div>
        `;

        const reviews = parseReviewsFromHtml(html);
        expect(reviews).toHaveLength(1);
        expect(reviews[0]!.author).toBe('Anonymous');
      });

      it('should handle malformed HTML structure gracefully', () => {
        const html = `
          <div id="R11MALFORMED007" data-hook="review" class="review">
            <!-- Missing profile content wrapper -->
            <span class="a-profile-name">Broken Structure</span>
            <div class="review-rating">
              <!-- Nested incorrectly -->
              <span class="a-icon-alt">2.0 out of 5 stars</span>
            </div>
            <span class="review-text-content">
              <span>Review with broken HTML</span>
            </span>
          </div>
        `;

        const reviews = parseReviewsFromHtml(html);
        // Parser should handle gracefully, extracting what it can
        expect(reviews.length).toBeLessThanOrEqual(1);
      });
    });

    describe('special review types', () => {
      it('should detect Vine reviews', () => {
        const html = `
          <div id="RVINE001" data-hook="review" class="review">
            <div class="a-profile-content">
              <span class="a-profile-name">Vine Reviewer</span>
            </div>
            <div class="review-rating">
              <i class="a-icon-star-5"><span class="a-icon-alt">5.0 out of 5 stars</span></i>
            </div>
            <span class="review-text-content">
              <span>Great product, received for free through Vine program</span>
            </span>
            <span data-hook="vine-badge" class="a-size-mini">Vine Customer Review of Free Product</span>
          </div>
        `;

        const reviews = parseReviewsFromHtml(html);
        expect(reviews).toHaveLength(1);
        expect(reviews[0]!.isVineReview).toBe(true);
        expect(reviews[0]!.verified).toBe(false); // Vine reviews are not "verified purchases"
      });

      it('should extract reviewer badges', () => {
        const html = `
          <div id="RBADGE001" data-hook="review" class="review">
            <div class="a-profile-content">
              <span class="a-profile-name">Expert Reviewer</span>
            </div>
            <div class="review-rating">
              <i class="a-icon-star-4"><span class="a-icon-alt">4.0 out of 5 stars</span></i>
            </div>
            <span class="review-text-content">
              <span>Detailed technical review</span>
            </span>
            <div class="badge-wrapper">
              <span class="a-size-mini">Top 1000 Reviewer</span>
            </div>
            <span class="c7y-badge-text">Hall of Fame</span>
          </div>
        `;

        const reviews = parseReviewsFromHtml(html);
        expect(reviews).toHaveLength(1);
        expect(reviews[0]!.badges).toEqual([
          'Top 1000 Reviewer',
          'Hall of Fame',
        ]);
      });

      it('should handle reviews with both Vine and verified purchase badges', () => {
        const html = `
          <div id="RBOTH001" data-hook="review" class="review">
            <div class="a-profile-content">
              <span class="a-profile-name">Mixed Badge User</span>
            </div>
            <div class="review-rating">
              <i class="a-icon-star-3"><span class="a-icon-alt">3.0 out of 5 stars</span></i>
            </div>
            <span class="review-text-content">
              <span>This shouldn't normally happen</span>
            </span>
            <span data-hook="avp-badge" class="a-size-mini">Verified Purchase</span>
            <span data-hook="vine-badge" class="a-size-mini">Vine Customer Review of Free Product</span>
          </div>
        `;

        const reviews = parseReviewsFromHtml(html);
        expect(reviews).toHaveLength(1);
        expect(reviews[0]!.verified).toBe(true);
        expect(reviews[0]!.isVineReview).toBe(true);
      });

      it('should handle multiple badges without duplicating standard badges', () => {
        const html = `
          <div id="RMULTI001" data-hook="review" class="review">
            <div class="a-profile-content">
              <span class="a-profile-name">Badge Collector</span>
            </div>
            <div class="review-rating">
              <i class="a-icon-star-5"><span class="a-icon-alt">5.0 out of 5 stars</span></i>
            </div>
            <span class="review-text-content">
              <span>Review from experienced reviewer</span>
            </span>
            <span data-hook="avp-badge" class="a-size-mini">Verified Purchase</span>
            <div class="badge-wrapper">
              <span class="a-size-mini">Top 500 Reviewer</span>
              <span class="a-size-mini">Verified Purchase</span>
            </div>
            <span class="c7y-badge-text">THE Hall of Famer</span>
          </div>
        `;

        const reviews = parseReviewsFromHtml(html);
        expect(reviews).toHaveLength(1);
        expect(reviews[0]!.verified).toBe(true);
        expect(reviews[0]!.badges).toEqual([
          'Top 500 Reviewer',
          'THE Hall of Famer',
        ]);
        // Should not include "Verified Purchase" in badges array
        expect(reviews[0]!.badges).not.toContain('Verified Purchase');
      });

      it('should handle early reviewer rewards badge', () => {
        const html = `
          <div id="REARLY001" data-hook="review" class="review">
            <div class="a-profile-content">
              <span class="a-profile-name">Early Bird</span>
            </div>
            <div class="review-rating">
              <i class="a-icon-star-4"><span class="a-icon-alt">4.0 out of 5 stars</span></i>
            </div>
            <span class="review-text-content">
              <span>Got this product early</span>
            </span>
            <span class="badge-wrapper">
              <span class="a-size-mini">Early Reviewer Rewards</span>
            </span>
          </div>
        `;

        const reviews = parseReviewsFromHtml(html);
        expect(reviews).toHaveLength(1);
        expect(reviews[0]!.badges).toEqual(['Early Reviewer Rewards']);
      });
    });
  });
});

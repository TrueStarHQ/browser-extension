import { describe, expect, it } from 'vitest';

import { parseReviewsFromHtml } from './review-parser';

describe('Amazon review parser', () => {
  describe('ID handling', () => {
    it('skips reviews without ID attributes', () => {
      const html = `
        <li data-hook="review" class="review aok-relative">
          <span class="a-profile-name">John Doe</span>
          <i data-hook="review-star-rating" class="a-icon a-icon-star a-star-5 review-rating">
            <span class="a-icon-alt">5.0 out of 5 stars</span>
          </i>
          <span data-hook="review-body" class="review-text review-text-content">
            <span>Amazing quality!</span>
          </span>
        </li>
        <li id="R123456789" data-hook="review" class="review aok-relative">
          <span class="a-profile-name">Jane Smith</span>
          <i data-hook="review-star-rating" class="a-icon a-icon-star a-star-3 review-rating">
            <span class="a-icon-alt">3.0 out of 5 stars</span>
          </i>
          <span data-hook="review-body" class="review-text review-text-content">
            <span>Not bad</span>
          </span>
        </li>
      `;

      const reviews = parseReviewsFromHtml(html);

      expect(reviews).toHaveLength(1);
      expect(reviews[0]!.id).toBe('R123456789');
      expect(reviews[0]!.author).toBe('Jane Smith');
    });

    it('uses existing ID when available', () => {
      const html = `
        <li id="R1JPYVAX0YZCWD" data-hook="review" class="review aok-relative">
          <span class="a-profile-name">Test User</span>
          <i data-hook="review-star-rating" class="a-icon a-icon-star a-star-4 review-rating">
            <span class="a-icon-alt">4.0 out of 5 stars</span>
          </i>
          <span data-hook="review-body" class="review-text-content">
            <span>Test review</span>
          </span>
        </li>
      `;

      const reviews = parseReviewsFromHtml(html);

      expect(reviews[0]!.id).toBe('R1JPYVAX0YZCWD');
    });
  });

  describe('parsing real Amazon HTML structure', () => {
    it('correctly parses review elements from actual Amazon HTML', () => {
      const html = `
        <li id="R1JPYVAX0YZCWD" data-hook="review" class="review aok-relative">
          <div class="a-profile-content">
            <span class="a-profile-name">Calamity Jenn</span>
          </div>
          <h5>
            <a data-hook="review-title" class="review-title">
              <i data-hook="review-star-rating" class="a-icon a-icon-star a-star-5 review-rating">
                <span class="a-icon-alt">5.0 out of 5 stars</span>
              </i>
              <span>YUM!!!</span>
            </a>
          </h5>
          <span data-hook="review-date" class="review-date">Reviewed in the United States on June 20, 2025</span>
          <span data-hook="avp-badge" class="a-color-state">Verified Purchase</span>
          <span data-hook="review-body" class="review-text review-text-content">
            <span>So yummy! These strawberries were exactly what I wanted.</span>
          </span>
          <span data-hook="helpful-vote-statement" class="cr-vote-text">One person found this helpful</span>
        </li>
      `;

      const reviews = parseReviewsFromHtml(html);

      expect(reviews).toHaveLength(1);
      expect(reviews[0]!.id).toBe('R1JPYVAX0YZCWD');
      expect(reviews[0]!.author).toBe('Calamity Jenn');
      expect(reviews[0]!.rating).toBe(5);
      expect(reviews[0]!.text).toBe(
        'So yummy! These strawberries were exactly what I wanted.'
      );
      expect(reviews[0]!.verified).toBe(true);
      expect(reviews[0]!.date).toBe(
        'Reviewed in the United States on June 20, 2025'
      );
      expect(reviews[0]!.helpfulVotes).toBe(1);
    });
  });
});

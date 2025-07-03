import { log } from '$lib/utils/logger';

import type { ReviewData } from '../../services/truestar-api';
import { generateFallbackId } from './review-id-generator';

export function parseReviewsFromHtml(html: string): ReviewData[] {
  // Create a DOM parser
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  const reviews: ReviewData[] = [];
  const reviewElements = doc.querySelectorAll('[data-hook="review"]');

  reviewElements.forEach((reviewEl, index) => {
    try {
      // Extract review ID from the element's id attribute
      let id = reviewEl.getAttribute('id');
      if (!id) {
        // Generate fallback ID if extraction fails
        id = generateFallbackId(index);
        log.warn('Review element missing ID attribute, using fallback:', id);
      }

      // Extract author name
      const authorEl = reviewEl.querySelector('.a-profile-name');
      const author = authorEl?.textContent?.trim() || 'Anonymous';

      // Extract rating
      const ratingEl = reviewEl.querySelector('.review-rating .a-icon-alt');
      const ratingText = ratingEl?.textContent || '';
      const rating = parseFloat(ratingText.match(/(\d\.?\d?)/)?.[1] || '0');

      // Extract review text
      const textEl = reviewEl.querySelector('.review-text-content span');
      const text = textEl?.textContent?.trim() || '';

      // Check if verified purchase
      const verifiedEl = reviewEl.querySelector('[data-hook="avp-badge"]');
      const verified = !!verifiedEl;

      // Extract review date
      const dateEl = reviewEl.querySelector('[data-hook="review-date"]');
      const date = dateEl?.textContent?.trim();

      // Extract helpful votes
      const helpfulEl = reviewEl.querySelector(
        '[data-hook="helpful-statement"]'
      );
      const helpfulText = helpfulEl?.textContent || '';
      const helpfulMatch = helpfulText.match(
        /(\d+)\s*(?:of\s*(\d+))?\s*people?\s*found/
      );
      const helpfulVotes = helpfulMatch?.[1]
        ? parseInt(helpfulMatch[1], 10)
        : undefined;
      const totalVotes = helpfulMatch?.[2]
        ? parseInt(helpfulMatch[2], 10)
        : undefined;

      // Extract product variation (size/color)
      const variationEl = reviewEl.querySelector(
        '.review-data .a-color-secondary'
      );
      const productVariation = variationEl?.textContent
        ?.replace(/^(Size|Color|Style):\s*/, '')
        .trim();

      // Check for Vine review
      const vineEl = reviewEl.querySelector('[data-hook="vine-badge"]');
      const isVineReview = !!vineEl;

      // Extract badges (Top Contributor, Hall of Fame, etc.)
      const badges: string[] = [];
      const badgeElements = reviewEl.querySelectorAll(
        '.c7y-badge-text, .badge-wrapper .a-size-mini'
      );
      badgeElements.forEach((badgeEl) => {
        const badgeText = badgeEl.textContent?.trim();
        if (
          badgeText &&
          badgeText !== 'Verified Purchase' &&
          badgeText !== 'Vine Customer Review of Free Product'
        ) {
          badges.push(badgeText);
        }
      });

      if (rating > 0 && text) {
        reviews.push({
          id,
          rating,
          text,
          author,
          verified,
          ...(date && { date }),
          ...(helpfulVotes !== undefined && { helpfulVotes }),
          ...(totalVotes !== undefined && { totalVotes }),
          ...(productVariation && { productVariation }),
          ...(isVineReview && { isVineReview }),
          ...(badges.length > 0 && { badges }),
        });
      }
    } catch {
      // Skip malformed reviews
    }
  });

  return reviews;
}

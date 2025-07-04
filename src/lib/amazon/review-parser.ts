import { log } from '$lib/utils/logger';

import type { ReviewData } from '../../services/truestar-api';
import { generateFallbackId } from './review-id-generator';

export function parseReviewsFromHtml(html: string): ReviewData[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  const reviews: ReviewData[] = [];
  const reviewElements = doc.querySelectorAll('[data-hook="review"]');

  reviewElements.forEach((reviewEl, index) => {
    try {
      let id = reviewEl.getAttribute('id');
      if (!id) {
        id = generateFallbackId(index);
        log.warn('Review element missing ID attribute, using fallback:', id);
      }

      const authorEl = reviewEl.querySelector('.a-profile-name');
      const author = authorEl?.textContent?.trim() || 'Anonymous';

      const ratingEl = reviewEl.querySelector('.review-rating .a-icon-alt');
      const ratingText = ratingEl?.textContent || '';
      const rating = parseFloat(ratingText.match(/(\d\.?\d?)/)?.[1] || '0');

      const textEl = reviewEl.querySelector('.review-text-content span');
      const text = textEl?.textContent?.trim() || '';

      const verifiedEl = reviewEl.querySelector('[data-hook="avp-badge"]');
      const verified = !!verifiedEl;

      const dateEl = reviewEl.querySelector('[data-hook="review-date"]');
      const date = dateEl?.textContent?.trim();

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

      const variationEl = reviewEl.querySelector(
        '.review-data .a-color-secondary'
      );
      const productVariation = variationEl?.textContent
        ?.replace(/^(Size|Color|Style):\s*/, '')
        .trim();

      const vineEl = reviewEl.querySelector('[data-hook="vine-badge"]');
      const isVineReview = !!vineEl;

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
    } catch (error) {
      log.warn(`Failed to parse review at index ${index}:`, error);
    }
  });

  return reviews;
}

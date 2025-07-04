import type { AmazonReview } from '@truestarhq/shared-types';

import { log } from '$lib/utils/logger';

function parseHelpfulCount(value: string): number {
  return value.toLowerCase() === 'one' ? 1 : parseInt(value, 10);
}

export function parseReviewsFromHtml(html: string): AmazonReview[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  const reviews: AmazonReview[] = [];
  const reviewElements = doc.querySelectorAll('[data-hook="review"]');

  reviewElements.forEach((reviewEl, index) => {
    try {
      const id = reviewEl.getAttribute('id');
      if (!id) {
        log.warn('Review element missing ID attribute, skipping', {
          author: reviewEl
            .querySelector('.a-profile-name')
            ?.textContent?.trim(),
          text: reviewEl
            .querySelector('[data-hook="review-body"]')
            ?.textContent?.trim()
            ?.substring(0, 50),
        });
        return;
      }

      const authorEl = reviewEl.querySelector('.a-profile-name');
      const author = authorEl?.textContent?.trim() || 'Anonymous';

      const ratingEl =
        reviewEl.querySelector(
          '[data-hook="review-star-rating"] .a-icon-alt'
        ) || reviewEl.querySelector('.review-rating .a-icon-alt');
      const ratingText = ratingEl?.textContent || '';
      const rating = parseFloat(ratingText.match(/(\d\.?\d?)/)?.[1] || '0');

      const textEl =
        reviewEl.querySelector('[data-hook="review-body"] span') ||
        reviewEl.querySelector('.review-text-content span');
      const text = textEl?.textContent?.trim() || '';

      const verifiedEl = reviewEl.querySelector('[data-hook="avp-badge"]');
      const verified = !!verifiedEl;

      const dateEl = reviewEl.querySelector('[data-hook="review-date"]');
      const date = dateEl?.textContent?.trim();

      const helpfulEl =
        reviewEl.querySelector('[data-hook="helpful-vote-statement"]') ||
        reviewEl.querySelector('[data-hook="helpful-statement"]');
      const helpfulText = helpfulEl?.textContent || '';
      const helpfulMatch = helpfulText.match(
        /(\d+|One)\s*(?:of\s*(\d+))?\s*(?:people?|person)\s*found/i
      );
      const helpfulVotes = helpfulMatch?.[1]
        ? parseHelpfulCount(helpfulMatch[1])
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

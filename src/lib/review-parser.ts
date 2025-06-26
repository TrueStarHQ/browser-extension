import type { ReviewData } from '../services/truestar-api';
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
        console.warn(
          'Review element missing ID attribute, using fallback:',
          id
        );
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

      if (rating > 0 && text) {
        reviews.push({
          id,
          rating,
          text,
          author,
          verified,
        });
      }
    } catch {
      // Skip malformed reviews
    }
  });

  return reviews;
}

import type { AmazonReview } from '@truestarhq/shared-types';

import { log } from '../../utils/logger';

const SELECTORS = {
  REVIEW: '[data-hook="review"]',
  AUTHOR: '.a-profile-name',
  TITLE_CONTAINER: '[data-hook="review-title"]',
  RATING: '[data-hook="review-star-rating"] .a-icon-alt',
  REVIEW_BODY: '[data-hook="review-body"]',
  VERIFIED: '[data-hook="avp-badge"]',
  DATE: '[data-hook="review-date"]',
  HELPFUL: '[data-hook="helpful-vote-statement"]',
  VARIATION: '.review-data .a-color-secondary',
  VINE: '[data-hook="vine-badge"]',
} as const;

const RATING_REGEX = /(\d\.?\d?)/;
const NUMERIC_REGEX = /[\d,.]+/;

interface ParsedReviewData {
  id: string;
  rating: number;
  title: string | undefined;
  text: string | undefined;
  authorName: string | undefined;
  date: string | undefined;
  isVerifiedPurchase: boolean;
  isVineReview: boolean;
  helpfulVotes: number | undefined;
  productVariation: string | undefined;
}

interface ReviewValidationResult {
  isValid: boolean;
  errors: string[];
}

export function parseReviewsFromHtml(html: string): AmazonReview[] {
  const doc = createDocument(html);
  const reviewElements = doc.querySelectorAll(SELECTORS.REVIEW);

  const reviews = Array.from(reviewElements)
    .map((element, index) =>
      parseReviewElement(element, index, reviewElements.length)
    )
    .filter((review): review is AmazonReview => review !== null);

  return reviews;
}

function createDocument(html: string): Document {
  const parser = new DOMParser();
  return parser.parseFromString(html, 'text/html');
}

function parseReviewElement(
  reviewEl: Element,
  index: number,
  totalElements: number
): AmazonReview | null {
  try {
    const reviewData = extractReviewData(reviewEl);
    const validation = validateReviewData(reviewData);

    if (!validation.isValid) {
      log.warn(
        `Skipping review ${index + 1}/${totalElements}: ${validation.errors.join(', ')}`
      );
      return null;
    }

    return createReview(reviewData);
  } catch (error) {
    log.warn(`Failed to parse review at index ${index}:`, error);
    return null;
  }
}

function extractReviewData(reviewEl: Element): ParsedReviewData {
  return {
    id: reviewEl.getAttribute('id') || '',
    rating: extractRating(reviewEl),
    title: extractTitle(reviewEl),
    text: extractReviewText(reviewEl),
    authorName: extractAuthorName(reviewEl),
    isVerifiedPurchase: extractVerifiedStatus(reviewEl),
    isVineReview: extractVineStatus(reviewEl),
    date: extractDate(reviewEl),
    helpfulVotes: extractHelpfulVotes(reviewEl),
    productVariation: extractProductVariation(reviewEl),
  };
}

function validateReviewData(data: ParsedReviewData): ReviewValidationResult {
  const errors: string[] = [];

  if (!data.id) errors.push('Missing ID');
  if (!data.rating || data.rating <= 0) errors.push('Invalid rating');
  if (!data.title) errors.push('Missing title');
  if (!data.text) errors.push('Missing text');
  if (!data.authorName) errors.push('Missing author');
  if (!data.date) errors.push('Missing date');

  return {
    isValid: errors.length === 0,
    errors,
  };
}

function createReview(data: ParsedReviewData): AmazonReview {
  const review: AmazonReview = {
    id: data.id,
    rating: data.rating,
    title: data.title as string,
    text: data.text as string,
    authorName: data.authorName as string,
    date: data.date as string,
    isVerifiedPurchase: data.isVerifiedPurchase,
    isVineReview: data.isVineReview,
  };

  if (data.helpfulVotes !== undefined) review.helpfulVotes = data.helpfulVotes;
  if (data.productVariation) review.productVariation = data.productVariation;

  return review;
}

function extractAuthorName(reviewEl: Element): string | undefined {
  return (
    reviewEl.querySelector(SELECTORS.AUTHOR)?.textContent?.trim() || undefined
  );
}

function extractTitle(reviewEl: Element): string | undefined {
  const titleContainer = reviewEl.querySelector(SELECTORS.TITLE_CONTAINER);
  if (!titleContainer) return undefined;

  const originalContent = titleContainer.querySelector(
    '.cr-original-review-content'
  );
  if (originalContent?.textContent?.trim()) {
    return originalContent.textContent.trim();
  }

  const titleSpans = titleContainer.querySelectorAll(
    'span:not([data-hook="review-star-rating"] span):not(.a-icon-alt):not(.a-letter-space):not(.cr-translated-review-content)'
  );
  const lastSpan = titleSpans[titleSpans.length - 1];
  return lastSpan?.textContent?.trim() || undefined;
}

function extractRating(reviewEl: Element): number {
  const ratingEl =
    reviewEl.querySelector(SELECTORS.RATING) ||
    reviewEl.querySelector('.review-rating .a-icon-alt');

  const match = ratingEl?.textContent?.match(RATING_REGEX);
  return match?.[1] ? parseFloat(match[1]) : 0;
}

function extractReviewText(reviewEl: Element): string | undefined {
  const bodyEl =
    reviewEl.querySelector(SELECTORS.REVIEW_BODY) ||
    reviewEl.querySelector('.review-text-content');

  return bodyEl?.textContent?.trim() || undefined;
}

function extractVerifiedStatus(reviewEl: Element): boolean {
  return !!reviewEl.querySelector(SELECTORS.VERIFIED);
}

function extractDate(reviewEl: Element): string | undefined {
  return (
    reviewEl.querySelector(SELECTORS.DATE)?.textContent?.trim() || undefined
  );
}

function extractHelpfulVotes(reviewEl: Element): number | undefined {
  const helpfulEl = reviewEl.querySelector(SELECTORS.HELPFUL);
  if (!helpfulEl?.textContent) return undefined;

  const match = helpfulEl.textContent.match(NUMERIC_REGEX);
  // When Amazon shows "One person found this helpful", there's no number in the text
  if (!match) return 1;

  const parsed = parseInt(match[0].replace(/[,.]/g, ''), 10);
  return isNaN(parsed) ? undefined : parsed;
}

function extractProductVariation(reviewEl: Element): string | undefined {
  return (
    reviewEl.querySelector(SELECTORS.VARIATION)?.textContent?.trim() ||
    undefined
  );
}

function extractVineStatus(reviewEl: Element): boolean {
  return !!reviewEl.querySelector(SELECTORS.VINE);
}

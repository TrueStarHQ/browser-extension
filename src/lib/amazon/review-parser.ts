import type { AmazonReview } from '@truestarhq/shared-types';

import { log } from '$lib/utils/logger';

// Constants for DOM selectors
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

// Regular expressions
const RATING_REGEX = /(\d\.?\d?)/;
const NUMERIC_REGEX = /[\d,.]+/;

// Interfaces for internal use
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

/**
 * Parses reviews from HTML content
 */
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

/**
 * Creates a DOM document from HTML string
 */
function createDocument(html: string): Document {
  const parser = new DOMParser();
  return parser.parseFromString(html, 'text/html');
}

/**
 * Parses a single review element into an AmazonReview object
 */
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

/**
 * Extracts all data from a review element
 */
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

/**
 * Validates review data for required fields
 */
function validateReviewData(data: ParsedReviewData): ReviewValidationResult {
  const errors: string[] = [];

  // Check all required fields
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

/**
 * Creates an AmazonReview object from validated data
 */
function createReview(data: ParsedReviewData): AmazonReview {
  // At this point, validation has passed so these fields must be defined
  const review: AmazonReview = {
    id: data.id,
    rating: data.rating,
    title: data.title!, // We know these are defined because validation passed
    text: data.text!,
    authorName: data.authorName!,
    date: data.date!,
    isVerifiedPurchase: data.isVerifiedPurchase,
    isVineReview: data.isVineReview,
  };

  // Add optional fields if they exist
  if (data.helpfulVotes !== undefined) review.helpfulVotes = data.helpfulVotes;
  if (data.productVariation) review.productVariation = data.productVariation;

  return review;
}

/**
 * Extracts the author name from a review element
 */
function extractAuthorName(reviewEl: Element): string | undefined {
  return (
    reviewEl.querySelector(SELECTORS.AUTHOR)?.textContent?.trim() || undefined
  );
}

/**
 * Extracts the review title from a review element
 */
function extractTitle(reviewEl: Element): string | undefined {
  const titleContainer = reviewEl.querySelector(SELECTORS.TITLE_CONTAINER);
  if (!titleContainer) return undefined;

  // Look for the title in common locations:
  // 1. Original review content (for international reviews)
  const originalContent = titleContainer.querySelector(
    '.cr-original-review-content'
  );
  if (originalContent?.textContent?.trim()) {
    return originalContent.textContent.trim();
  }

  // 2. Regular spans that aren't part of the star rating
  const titleSpans = titleContainer.querySelectorAll(
    'span:not([data-hook="review-star-rating"] span):not(.a-icon-alt):not(.a-letter-space):not(.cr-translated-review-content)'
  );

  if (titleSpans.length > 0) {
    const lastSpan = titleSpans[titleSpans.length - 1];
    const title = lastSpan?.textContent?.trim();
    if (title) return title;
  }

  return undefined;
}

/**
 * Extracts the star rating from a review element
 */
function extractRating(reviewEl: Element): number {
  const ratingEl =
    reviewEl.querySelector(SELECTORS.RATING) ||
    reviewEl.querySelector('.review-rating .a-icon-alt');

  const match = ratingEl?.textContent?.match(RATING_REGEX);
  return match?.[1] ? parseFloat(match[1]) : 0;
}

/**
 * Extracts the review text content from a review element
 */
function extractReviewText(reviewEl: Element): string | undefined {
  const bodyEl =
    reviewEl.querySelector(SELECTORS.REVIEW_BODY) ||
    reviewEl.querySelector('.review-text-content');

  return bodyEl?.textContent?.trim() || undefined;
}

/**
 * Extracts verification status from a review element
 */
function extractVerifiedStatus(reviewEl: Element): boolean {
  return !!reviewEl.querySelector(SELECTORS.VERIFIED);
}

/**
 * Extracts the review date from a review element
 */
function extractDate(reviewEl: Element): string | undefined {
  return (
    reviewEl.querySelector(SELECTORS.DATE)?.textContent?.trim() || undefined
  );
}

/**
 * Extracts helpful vote count from a review element
 */
function extractHelpfulVotes(reviewEl: Element): number | undefined {
  const helpfulEl = reviewEl.querySelector(SELECTORS.HELPFUL);
  if (!helpfulEl?.textContent) return undefined;

  // Extract numeric value from text like "42 people found this helpful"
  const match = helpfulEl.textContent.match(NUMERIC_REGEX);
  if (!match) return 1; // Text exists but no number = "One person found this helpful"

  const parsed = parseInt(match[0].replace(/[,.]/g, ''), 10);
  return isNaN(parsed) ? undefined : parsed;
}

/**
 * Extracts product variation information from a review element
 */
function extractProductVariation(reviewEl: Element): string | undefined {
  return (
    reviewEl.querySelector(SELECTORS.VARIATION)?.textContent?.trim() ||
    undefined
  );
}

/**
 * Checks if this is a Vine review
 */
function extractVineStatus(reviewEl: Element): boolean {
  return !!reviewEl.querySelector(SELECTORS.VINE);
}

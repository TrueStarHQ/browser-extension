import type { AmazonReview } from '@truestarhq/shared-types';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  AmazonFetchError,
  AmazonParseError,
  fetchReviewPage,
} from './review-page-fetcher';
import { parseReviewsFromHtml } from './review-parser';

vi.mock('./review-parser');
vi.mock('../../utils/logger', () => ({
  log: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

describe('review-page-fetcher', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  describe('fetchReviewPage', () => {
    it('should fetch and parse reviews successfully', async () => {
      const mockReviews: AmazonReview[] = [
        {
          id: 'R123',
          rating: 5,
          title: 'Great product',
          text: 'Love it!',
          authorName: 'John Doe',
          isVerifiedPurchase: true,
          isVineReview: false,
        },
      ];

      const mockResponseText = `
        ["append", null, "<div data-hook=\\"review\\">Review 1</div>"]
        &&&
        ["append", null, "<div data-hook=\\"review\\">Review 2</div>"]
      `;

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        text: async () => mockResponseText,
      });

      (parseReviewsFromHtml as ReturnType<typeof vi.fn>).mockReturnValueOnce(
        mockReviews
      );

      const result = await fetchReviewPage('B08XYZ123', 1, 'test-csrf-token');

      expect(result).toEqual(mockReviews);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('amazon.com/hz/reviews-render/ajax'),
        expect.objectContaining({
          method: 'POST',
          credentials: 'include',
          headers: expect.objectContaining({
            'anti-csrftoken-a2z': 'test-csrf-token',
            'content-type': 'application/x-www-form-urlencoded',
          }),
        })
      );
    });

    it('should handle fetch errors with AmazonFetchError', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 403,
        statusText: 'Forbidden',
      });

      const result = await fetchReviewPage('B08XYZ123', 1, 'test-csrf-token');

      expect(result).toEqual([]);
    });

    it('should return empty array when no reviews found', async () => {
      const mockResponseText = 'No reviews in this response';

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        text: async () => mockResponseText,
      });

      const result = await fetchReviewPage('B08XYZ123', 1, 'test-csrf-token');

      expect(result).toEqual([]);
      expect(parseReviewsFromHtml).not.toHaveBeenCalled();
    });

    it('should handle malformed JSON in response gracefully', async () => {
      const mockResponseText = `
        ["append", null, "<div data-hook=\\"review\\">Review 1</div>"]
        &&&
        {invalid json}
        &&&
        ["append", null, "<div data-hook=\\"review\\">Review 2</div>"]
      `;

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        text: async () => mockResponseText,
      });

      (parseReviewsFromHtml as ReturnType<typeof vi.fn>).mockReturnValueOnce([
        {
          id: 'R123',
          rating: 5,
          title: 'Test',
          text: 'Test review',
          authorName: 'Test Author',
          isVerifiedPurchase: false,
          isVineReview: false,
        },
      ]);

      const result = await fetchReviewPage('B08XYZ123', 1, 'test-csrf-token');

      expect(result).toHaveLength(1);
      expect(parseReviewsFromHtml).toHaveBeenCalled();
    });

    it('should handle network errors', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
        new Error('Network error')
      );

      const result = await fetchReviewPage('B08XYZ123', 1, 'test-csrf-token');

      expect(result).toEqual([]);
    });

    it('should extract review HTML from various command formats', async () => {
      const mockResponseText = `
        ["append", null, "<div data-hook=\\"review\\">Review with content at index 2</div>"]
        &&&
        ["append", "<div data-hook=\\"review\\">Review with content at index 1</div>"]
        &&&
        ["other-action", "some-selector", "non-review content"]
      `;

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        text: async () => mockResponseText,
      });

      (parseReviewsFromHtml as ReturnType<typeof vi.fn>).mockReturnValueOnce([
        {
          id: 'R1',
          rating: 4,
          title: 'Good',
          text: 'Nice product',
          authorName: 'Jane',
          isVerifiedPurchase: true,
          isVineReview: false,
        },
        {
          id: 'R2',
          rating: 3,
          title: 'OK',
          text: 'Average',
          authorName: 'Bob',
          isVerifiedPurchase: false,
          isVineReview: false,
        },
      ]);

      const result = await fetchReviewPage('B08XYZ123', 2, 'test-csrf-token');

      expect(result).toHaveLength(2);
      expect(parseReviewsFromHtml).toHaveBeenCalledWith(
        expect.stringContaining('Review with content at index 2')
      );
      expect(parseReviewsFromHtml).toHaveBeenCalledWith(
        expect.stringContaining('Review with content at index 1')
      );
    });
  });

  describe('Error classes', () => {
    it('should create AmazonFetchError with correct properties', () => {
      const error = new AmazonFetchError('Test error', 404, 'B123', 2);

      expect(error.name).toBe('AmazonFetchError');
      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(404);
      expect(error.productId).toBe('B123');
      expect(error.pageNumber).toBe(2);
    });

    it('should create AmazonParseError with correct properties', () => {
      const error = new AmazonParseError('Parse failed', 'response text');

      expect(error.name).toBe('AmazonParseError');
      expect(error.message).toBe('Parse failed');
      expect(error.responseText).toBe('response text');
    });
  });
});

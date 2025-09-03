import type {
  AmazonReview,
  CheckAmazonProductResponse,
} from '@truestarhq/shared-types';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { truestarApi } from './truestar-api';

vi.mock('../utils/logger', () => ({
  log: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
}));

import { log } from '../utils/logger';

describe('TrueStarApi', () => {
  let fetchMock: ReturnType<typeof vi.fn>;
  const mockSuccessResponse: CheckAmazonProductResponse = {
    timestamp: '2024-01-01T00:00:00Z',
    summary: {
      trustScore: 85,
    },
    metrics: {
      analyzed: 10,
      total: 50,
    },
    greenFlags: [
      {
        type: 'high_verified_purchases',
        confidence: 0.9,
        details: { percentage: 90 },
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    fetchMock = vi.fn();
    global.fetch = fetchMock;
    vi.unstubAllEnvs();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  describe('initialization', () => {
    it('is properly instantiated', () => {
      expect(truestarApi).toBeDefined();
      expect(typeof truestarApi.analyzeReviews).toBe('function');
    });
  });

  describe('analyzeReviews', () => {
    const mockReviews: AmazonReview[] = [
      {
        id: 'R1TEST123456789',
        rating: 5,
        title: 'Excellent product',
        text: 'Great product, highly recommend!',
        authorName: 'John Doe',
        isVerifiedPurchase: true,
      },
      {
        id: 'R2TEST987654321',
        rating: 1,
        title: 'Disappointed',
        text: 'Terrible quality, waste of money',
        authorName: 'Jane Smith',
        isVerifiedPurchase: false,
      },
    ];

    it('successfully analyzes reviews and returns result', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockSuccessResponse),
      });

      const result = await truestarApi.analyzeReviews(mockReviews);

      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:3001/check/amazon/product',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ reviews: mockReviews }),
        }
      );

      expect(result).toEqual(mockSuccessResponse);
    });

    it('includes totalReviewCount when provided', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockSuccessResponse),
      });

      const totalReviewCount = 1500;
      const result = await truestarApi.analyzeReviews(
        mockReviews,
        totalReviewCount
      );

      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:3001/check/amazon/product',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ reviews: mockReviews, totalReviewCount }),
        }
      );

      expect(result).toEqual(mockSuccessResponse);
    });

    it('uses correct API endpoint', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockSuccessResponse),
      });

      await truestarApi.analyzeReviews(mockReviews);

      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:3001/check/amazon/product',
        expect.any(Object)
      );
    });

    it('handles HTTP error responses', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      const result = await truestarApi.analyzeReviews(mockReviews);

      expect(log.error).toHaveBeenCalledWith(
        'Backend API error:',
        expect.any(Error)
      );

      expect(result.summary.trustScore).toBe(0);
      expect(result.metrics.analyzed).toBe(0);
      expect(result.metrics.total).toBe(0);
    });

    it('handles network errors', async () => {
      const networkError = new Error('Network error');
      fetchMock.mockRejectedValueOnce(networkError);

      const result = await truestarApi.analyzeReviews(mockReviews);

      expect(log.error).toHaveBeenCalledWith(
        'Backend API error:',
        networkError
      );

      expect(result.summary.trustScore).toBe(0);
      expect(result.metrics.analyzed).toBe(0);
      expect(result.metrics.total).toBe(0);
    });

    it('handles JSON parsing errors', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.reject(new Error('Invalid JSON')),
      });

      const result = await truestarApi.analyzeReviews(mockReviews);

      expect(log.error).toHaveBeenCalledWith(
        'Backend API error:',
        expect.any(Error)
      );

      expect(result.summary.trustScore).toBe(0);
      expect(result.metrics.analyzed).toBe(0);
      expect(result.metrics.total).toBe(0);
    });

    it('handles different HTTP error status codes', async () => {
      const testCases = [
        { status: 400, statusText: 'Bad Request' },
        { status: 401, statusText: 'Unauthorized' },
        { status: 403, statusText: 'Forbidden' },
        { status: 404, statusText: 'Not Found' },
        { status: 429, statusText: 'Too Many Requests' },
        { status: 503, statusText: 'Service Unavailable' },
      ];

      for (const testCase of testCases) {
        fetchMock.mockResolvedValueOnce({
          ok: false,
          status: testCase.status,
          statusText: testCase.statusText,
        });

        const result = await truestarApi.analyzeReviews(mockReviews);

        expect(result.summary.trustScore).toBe(0);
        expect(result.metrics.analyzed).toBe(0);
        expect(result.metrics.total).toBe(0);

        vi.clearAllMocks();
      }
    });

    it('handles empty reviews array', async () => {
      const emptyResponse: CheckAmazonProductResponse = {
        timestamp: '2024-01-01T00:00:00Z',
        summary: { trustScore: 50 },
        metrics: { analyzed: 0, total: 0 },
      };

      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(emptyResponse),
      });

      const result = await truestarApi.analyzeReviews([]);

      expect(fetchMock).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify({ reviews: [] }),
        })
      );

      expect(result).toEqual(emptyResponse);
    });

    it('handles large review datasets', async () => {
      const largeReviewSet: AmazonReview[] = Array.from(
        { length: 100 },
        (_, i) => ({
          id: `R${i}LARGE`,
          rating: Math.floor(Math.random() * 5) + 1,
          title: `Review Title ${i}`,
          text: `Review ${i} with some content`,
          authorName: `User${i}`,
          isVerifiedPurchase: Math.random() > 0.5,
        })
      );

      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockSuccessResponse),
      });

      const result = await truestarApi.analyzeReviews(largeReviewSet);

      expect(fetchMock).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify({ reviews: largeReviewSet }),
        })
      );

      expect(result).toEqual(mockSuccessResponse);
    });

    it('handles response with missing required fields', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({}),
      });

      const result = await truestarApi.analyzeReviews(mockReviews);

      // Should return the partial response
      expect(result).toEqual({});
    });

    it('handles malformed API response structure', async () => {
      const partialResponse = {
        summary: {
          trustScore: 30,
        },
      };

      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(partialResponse),
      });

      const result = await truestarApi.analyzeReviews(mockReviews);

      expect(result).toEqual(partialResponse);
    });

    it('warns when payload exceeds size limit', async () => {
      const veryLargeReviewSet: AmazonReview[] = Array.from(
        { length: 5000 },
        (_, i) => ({
          id: `R${i}VERYLONGID`,
          rating: 5,
          title: `Long Review ${i}`,
          text: 'This is a very long review text that contains a lot of content to make the payload size larger. '.repeat(
            10
          ),
          authorName: `UserWithVeryLongName${i}`,
          isVerifiedPurchase: true,
        })
      );

      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockSuccessResponse),
      });

      await truestarApi.analyzeReviews(veryLargeReviewSet);

      expect(log.warn).toHaveBeenCalledWith(
        expect.stringMatching(
          /Payload size \(\d+\.\d+ KB\) exceeds recommended limit of 1024 KB/
        )
      );
    });
  });

  describe('singleton behavior', () => {
    it('exports a consistent API instance', () => {
      expect(truestarApi).toBeDefined();
      expect(typeof truestarApi.analyzeReviews).toBe('function');
    });
  });

  describe('type safety', () => {
    it('accepts properly typed AmazonReview', async () => {
      const validReview: AmazonReview = {
        id: 'RVALIDTEST123',
        rating: 4.5,
        title: 'Good quality',
        text: 'Good product',
        authorName: 'Test User',
        isVerifiedPurchase: true,
      };

      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockSuccessResponse),
      });

      const result: CheckAmazonProductResponse =
        await truestarApi.analyzeReviews([validReview]);

      expect(result).toEqual(mockSuccessResponse);
    });
  });
});

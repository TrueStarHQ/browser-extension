import type { AmazonReview, ReviewChecker } from '@truestarhq/shared-types';
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
  const mockSuccessResponse: ReviewChecker = {
    isFake: false,
    confidence: 0.85,
    reasons: ['Varied writing styles', 'Mix of positive and negative'],
    flags: [],
    summary: 'Reviews appear to be authentic',
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
        text: 'Great product, highly recommend!',
        author: 'John Doe',
        verified: true,
      },
      {
        id: 'R2TEST987654321',
        rating: 1,
        text: 'Terrible quality, waste of money',
        author: 'Jane Smith',
        verified: false,
      },
    ];

    it('successfully analyzes reviews and returns result', async () => {
      const mockApiResponse = {
        result: mockSuccessResponse,
      };

      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockApiResponse),
      });

      const result = await truestarApi.analyzeReviews(mockReviews);

      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:3001/check/amazon/reviews',
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

    it('uses correct API endpoint', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ result: mockSuccessResponse }),
      });

      await truestarApi.analyzeReviews(mockReviews);

      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:3001/check/amazon/reviews',
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

      expect(result).toEqual({
        isFake: false,
        confidence: 0,
        reasons: ['Unable to connect to analysis service'],
        flags: [],
        summary: 'Analysis service temporarily unavailable',
      });
    });

    it('handles network errors', async () => {
      const networkError = new Error('Network error');
      fetchMock.mockRejectedValueOnce(networkError);

      const result = await truestarApi.analyzeReviews(mockReviews);

      expect(log.error).toHaveBeenCalledWith(
        'Backend API error:',
        networkError
      );

      expect(result).toEqual({
        isFake: false,
        confidence: 0,
        reasons: ['Unable to connect to analysis service'],
        flags: [],
        summary: 'Analysis service temporarily unavailable',
      });
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

      expect(result).toEqual({
        isFake: false,
        confidence: 0,
        reasons: ['Unable to connect to analysis service'],
        flags: [],
        summary: 'Analysis service temporarily unavailable',
      });
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

        expect(result).toEqual({
          isFake: false,
          confidence: 0,
          reasons: ['Unable to connect to analysis service'],
          flags: [],
          summary: 'Analysis service temporarily unavailable',
        });

        vi.clearAllMocks();
      }
    });

    it('handles empty reviews array', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ result: mockSuccessResponse }),
      });

      const result = await truestarApi.analyzeReviews([]);

      expect(fetchMock).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify({ reviews: [] }),
        })
      );

      expect(result).toEqual(mockSuccessResponse);
    });

    it('handles large review datasets', async () => {
      const largeReviewSet: AmazonReview[] = Array.from(
        { length: 100 },
        (_, i) => ({
          id: `R${i}LARGE`,
          rating: Math.floor(Math.random() * 5) + 1,
          text: `Review ${i} with some content`,
          author: `User${i}`,
          verified: Math.random() > 0.5,
        })
      );

      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ result: mockSuccessResponse }),
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

    it('handles response with missing result field', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({}),
      });

      const result = await truestarApi.analyzeReviews(mockReviews);

      expect(result).toBeUndefined();
    });

    it('handles malformed API response structure', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve({
            result: {
              isFake: true,
            },
          }),
      });

      const result = await truestarApi.analyzeReviews(mockReviews);

      expect(result).toEqual({
        isFake: true,
      });
    });

    it('warns when payload exceeds size limit', async () => {
      const veryLargeReviewSet: AmazonReview[] = Array.from(
        { length: 5000 },
        (_, i) => ({
          id: `R${i}VERYLONGID`,
          rating: 5,
          text: 'This is a very long review text that contains a lot of content to make the payload size larger. '.repeat(
            10
          ),
          author: `UserWithVeryLongName${i}`,
          verified: true,
        })
      );

      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ result: mockSuccessResponse }),
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
        text: 'Good product',
        author: 'Test User',
        verified: true,
      };

      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ result: mockSuccessResponse }),
      });

      const result: ReviewChecker = await truestarApi.analyzeReviews([
        validReview,
      ]);

      expect(result).toEqual(mockSuccessResponse);
    });
  });
});

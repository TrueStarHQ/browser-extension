import {
  type AmazonReview,
  type CheckAmazonProductResponse,
} from '@truestarhq/shared-types';

import { log } from '../utils/logger';

class TrueStarApi {
  private baseUrl: string;
  private readonly MAX_PAYLOAD_SIZE_KB = 1024; // 1MB limit

  constructor() {
    this.baseUrl =
      import.meta.env.VITE_BACKEND_API_URL || 'https://api.truestar.pro';
  }

  async analyzeReviews(
    reviews: AmazonReview[],
    totalReviewCount?: number
  ): Promise<CheckAmazonProductResponse> {
    try {
      const payload = JSON.stringify({
        reviews,
        ...(totalReviewCount && { totalReviewCount }),
      });
      const payloadSizeKB = payload.length / 1024;
      log.info(
        `Sending ${reviews.length} of ${totalReviewCount} reviews to API ${
          totalReviewCount
            ? `, for analysis. (${payloadSizeKB.toFixed(1)} KB)`
            : ''
        }`
      );

      if (payloadSizeKB > this.MAX_PAYLOAD_SIZE_KB) {
        log.warn(
          `Payload size (${payloadSizeKB.toFixed(1)} KB) exceeds recommended limit of ${this.MAX_PAYLOAD_SIZE_KB} KB`
        );
      }

      const response = await fetch(`${this.baseUrl}/check/amazon/product`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: payload,
      });

      if (!response.ok) {
        throw new Error(
          `API request failed: ${response.status} ${response.statusText}`
        );
      }

      const backendResponse: CheckAmazonProductResponse = await response.json();
      return backendResponse;
    } catch (error) {
      log.error('Backend API error:', error);

      // Return a minimal error response that matches the API structure
      return {
        timestamp: new Date().toISOString(),
        summary: {
          trustScore: 0,
        },
        metrics: {
          analyzed: 0,
          total: 0,
        },
      };
    }
  }
}

export const truestarApi = new TrueStarApi();

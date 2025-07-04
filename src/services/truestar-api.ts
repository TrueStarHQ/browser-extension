import {
  type AmazonReview,
  type ReviewChecker,
} from '@truestarhq/shared-types';

import { log } from '../utils/logger';

class TrueStarApi {
  private baseUrl: string;
  private readonly MAX_PAYLOAD_SIZE_KB = 1024; // 1MB limit

  constructor() {
    this.baseUrl =
      import.meta.env.VITE_BACKEND_API_URL || 'https://api.truestar.pro';
  }

  async analyzeReviews(reviews: AmazonReview[]): Promise<ReviewChecker> {
    try {
      const payload = JSON.stringify({ reviews });
      const payloadSizeKB = payload.length / 1024;
      log.info(
        `Sending ${reviews.length} reviews to API (${payloadSizeKB.toFixed(1)} KB)`
      );

      if (payloadSizeKB > this.MAX_PAYLOAD_SIZE_KB) {
        log.warn(
          `Payload size (${payloadSizeKB.toFixed(1)} KB) exceeds recommended limit of ${this.MAX_PAYLOAD_SIZE_KB} KB`
        );
      }

      const response = await fetch(`${this.baseUrl}/check/amazon/reviews`, {
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

      const backendResponse = await response.json();
      return backendResponse.result;
    } catch (error) {
      log.error('Backend API error:', error);

      return {
        isFake: false,
        confidence: 0,
        reasons: ['Unable to connect to analysis service'],
        flags: [],
        summary: 'Analysis service temporarily unavailable',
      };
    }
  }
}

export const truestarApi = new TrueStarApi();

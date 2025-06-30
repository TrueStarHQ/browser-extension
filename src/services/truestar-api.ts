import { log } from '../utils/logger';

// TODO: Use shared types with backend, generated from OpenAPI spec
interface ReviewData {
  id: string;
  rating: number;
  text: string;
  author: string;
  verified: boolean;
  date?: string;
  helpfulVotes?: number;
  totalVotes?: number;
  productVariation?: string;
  isVineReview?: boolean;
  badges?: string[];
}

// TODO: Use shared types with backend, generated from OpenAPI spec
interface AnalysisResult {
  isFake: boolean;
  confidence: number;
  reasons: string[];
  flags: string[];
  summary: string;
}

class TrueStarApi {
  private baseUrl: string;
  private readonly MAX_PAYLOAD_SIZE_KB = 1024; // 1MB limit

  constructor() {
    this.baseUrl =
      import.meta.env.VITE_BACKEND_API_URL || 'https://api.truestar.pro';
  }

  async analyzeReviews(reviews: ReviewData[]): Promise<AnalysisResult> {
    try {
      // Log payload size for monitoring
      const payload = JSON.stringify({ reviews });
      const payloadSizeKB = payload.length / 1024;
      log.info(
        `Sending ${reviews.length} reviews to API (${payloadSizeKB.toFixed(1)} KB)`
      );

      // Warn if payload is getting large
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

      // Return fallback result
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
export type { ReviewData, AnalysisResult };

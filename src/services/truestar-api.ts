// TODO: Use shared types with backend
interface ReviewData {
  rating: number;
  text: string;
  author: string;
  verified: boolean;
}

// TODO: Use shared types with backend
interface AnalysisResult {
  isFake: boolean;
  confidence: number;
  reasons: string[];
  flags: string[];
  summary: string;
}

class TrueStarApi {
  private baseUrl: string;

  constructor() {
    this.baseUrl =
      import.meta.env.VITE_BACKEND_API_URL || 'https://api.truestar.pro';
  }

  async analyzeReviews(reviews: ReviewData[]): Promise<AnalysisResult> {
    try {
      const response = await fetch(`${this.baseUrl}/check/amazon/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reviews }),
      });

      if (!response.ok) {
        throw new Error(
          `API request failed: ${response.status} ${response.statusText}`
        );
      }

      const backendResponse = await response.json();
      return backendResponse.result;
    } catch (error) {
      console.error('Backend API error:', error);

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

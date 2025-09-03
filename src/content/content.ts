import type {
  AmazonReview,
  CheckAmazonProductResponse,
} from '@truestarhq/shared-types';

import AnalysisPanel from '../components/AnalysisPanel.svelte';
import LoadingIndicator from '../components/LoadingIndicator.svelte';
import { extractReviewsCSRFToken } from '../lib/amazon/csrf-token';
import { fetchReviewPage } from '../lib/amazon/review-page-fetcher';
import { extractPaginationInfo } from '../lib/amazon/review-pagination';
import { truestarApi } from '../services/truestar-api';
import { log } from '../utils/logger';
import { mountComponent } from '../utils/mount-component';

function isValidAnalysisResult(
  obj: unknown
): obj is CheckAmazonProductResponse {
  if (!obj || typeof obj !== 'object') return false;

  const analysis = obj as Record<string, unknown>;

  return (
    typeof analysis.timestamp === 'string' &&
    typeof analysis.summary === 'object' &&
    analysis.summary !== null &&
    'trustScore' in analysis.summary &&
    typeof analysis.summary.trustScore === 'number' &&
    typeof analysis.metrics === 'object' &&
    analysis.metrics !== null
  );
}

class AmazonProductPageChecker {
  private loadingComponent: ReturnType<typeof mountComponent> | null = null;
  private analysisComponent: ReturnType<typeof mountComponent> | null = null;

  constructor() {
    this.init();
  }

  private init(): void {
    if (this.isAmazonProductPage()) {
      this.analyzeReviews();
    }
  }

  private isAmazonProductPage(): boolean {
    return (
      window.location.pathname.includes('/dp/') &&
      window.location.hostname.includes('amazon')
    );
  }

  private extractAsinFromUrl(): string {
    const match = window.location.pathname.match(/\/dp\/([A-Z0-9]+)/);

    if (!match) {
      throw new Error('Could not extract ASIN from URL');
    }

    return match[1]!;
  }

  private async extractMultiPageReviewsViaAjax(): Promise<{
    reviews: AmazonReview[];
    totalReviewCount?: number;
  }> {
    const productId = this.extractAsinFromUrl();

    // Extract the anti-CSRF token from the current page
    const csrfToken = extractReviewsCSRFToken(
      document.documentElement.innerHTML
    );
    if (!csrfToken) {
      log.error('CSRF token extraction failed');
      throw new Error('Could not extract CSRF token from page');
    }

    // Get pagination info from current page
    const paginationInfo = extractPaginationInfo(
      document.documentElement.innerHTML
    );
    const totalReviewCount = paginationInfo.totalReviews;

    if (paginationInfo.totalPages === 0) {
      log.warn('No pagination found - product may have no reviews');
    }

    // Collect reviews - fetch up to 10 pages (Amazon's limit) or fewer if less than 100 reviews
    const pagesToFetch = Math.min(paginationInfo.totalPages, 10);
    const pageNumbers = Array.from({ length: pagesToFetch }, (_, i) => i + 1);

    // Fetch all pages simultaneously
    const pagePromises = pageNumbers.map((pageNum) =>
      fetchReviewPage(productId, pageNum, csrfToken).catch((error) => {
        log.warn(`Failed to fetch reviews page ${pageNum}:`, error);
        return []; // Return empty array on error to continue with other pages
      })
    );

    const allPageResults = await Promise.all(pagePromises);

    // Flatten and deduplicate reviews
    const allReviews: AmazonReview[] = [];
    const seenIds = new Set<string>();

    for (const reviews of allPageResults) {
      for (const review of reviews) {
        if (!seenIds.has(review.id)) {
          seenIds.add(review.id);
          allReviews.push(review);
        }
      }
    }

    return {
      reviews: allReviews,
      totalReviewCount,
    };
  }

  private async analyzeReviews(): Promise<void> {
    try {
      const { reviews, totalReviewCount } =
        await this.extractMultiPageReviewsViaAjax();
      if (reviews.length === 0) {
        log.info('No reviews found on page');
        this.hideLoadingIndicator();
        return;
      }

      const result = await this.checkReviews(reviews, totalReviewCount);
      this.hideLoadingIndicator();
      this.displayResults(result);
    } catch (error) {
      log.error('Error analyzing reviews:', error);
      this.hideLoadingIndicator();
    }
  }

  private showLoadingIndicator(): void {
    this.hideLoadingIndicator(); // Remove any existing loader
    this.loadingComponent = mountComponent(LoadingIndicator, {});
  }

  private hideLoadingIndicator(): void {
    if (this.loadingComponent) {
      this.loadingComponent.destroy();
      this.loadingComponent = null;
    }
  }

  private async checkReviews(
    reviews: AmazonReview[],
    totalReviewCount?: number
  ): Promise<CheckAmazonProductResponse> {
    return await truestarApi.analyzeReviews(reviews, totalReviewCount);
  }

  private displayResults(analysis: unknown): void {
    if (!isValidAnalysisResult(analysis)) {
      log.error('Invalid analysis result received:', analysis);
      this.displayError('Invalid analysis response received');
      return;
    }

    if (this.analysisComponent) {
      this.analysisComponent.destroy();
    }

    this.analysisComponent = mountComponent(AnalysisPanel, {
      analysis,
      onClose: () => {
        if (this.analysisComponent) {
          this.analysisComponent.destroy();
          this.analysisComponent = null;
        }
      },
    });
  }

  private displayError(message: string): void {
    if (this.analysisComponent) {
      this.analysisComponent.destroy();
    }

    // Create an error response that matches CheckAmazonProductResponse structure
    const errorAnalysis: CheckAmazonProductResponse = {
      timestamp: new Date().toISOString(),
      summary: {
        trustScore: 0,
      },
      metrics: {
        analyzed: 0,
        total: 0,
      },
    };

    this.analysisComponent = mountComponent(AnalysisPanel, {
      analysis: errorAnalysis,
      errorMessage: message,
      onClose: () => {
        if (this.analysisComponent) {
          this.analysisComponent.destroy();
          this.analysisComponent = null;
        }
      },
    });
  }
}

new AmazonProductPageChecker();

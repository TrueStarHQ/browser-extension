import { truestarApi } from '../services/truestar-api';
import type { ReviewData, AnalysisResult } from '../services/truestar-api';
import { log } from '../utils/logger';
import {
  analyzeReviewPagination,
  generateReviewPageUrl,
} from '../lib/amazon/amazon-pagination';
import { selectPagesToFetch } from '../lib/amazon/review-sampling';
import { fetchMultiplePages } from '../lib/amazon/page-fetcher';
import { parseReviewsFromHtml } from '../lib/amazon/review-parser';
import { ReviewCache } from '../lib/amazon/review-cache';
import { mountComponent } from '../utils/mount-component';
import AnalysisPanel from '../components/AnalysisPanel.svelte';
import LoadingIndicator from '../components/LoadingIndicator.svelte';

// Validation function for API response
function isValidAnalysisResult(obj: unknown): obj is AnalysisResult {
  if (!obj || typeof obj !== 'object') return false;
  
  const analysis = obj as Record<string, unknown>;
  
  return (
    typeof analysis.isFake === 'boolean' &&
    typeof analysis.confidence === 'number' &&
    typeof analysis.summary === 'string' &&
    Array.isArray(analysis.reasons) &&
    analysis.reasons.every((r: unknown) => typeof r === 'string') &&
    Array.isArray(analysis.flags) &&
    analysis.flags.every((f: unknown) => typeof f === 'string')
  );
}

class AmazonProductPageChecker {
  private reviewCache: ReviewCache;
  private loadingComponent: ReturnType<typeof mountComponent> | null = null;
  private analysisComponent: ReturnType<typeof mountComponent> | null = null;

  constructor() {
    this.reviewCache = new ReviewCache({ ttlMinutes: 30 }); // Cache for 30 minutes
    this.init();
  }

  private init() {
    if (this.isAmazonProductPage()) {
      log.info('Amazon product page detected');
      this.analyzeReviews();
    }
  }

  private isAmazonProductPage(): boolean {
    return (
      window.location.pathname.includes('/dp/') &&
      window.location.hostname.includes('amazon')
    );
  }

  private extractProductId(): string | null {
    const match = window.location.pathname.match(/\/dp\/([A-Z0-9]+)/);
    return match ? match[1] : null;
  }

  private extractReviews(): ReviewData[] {
    // Use the centralized parser to extract reviews from current page
    return parseReviewsFromHtml(document.documentElement.innerHTML);
  }

  private async extractMultiPageReviews(): Promise<ReviewData[]> {
    const productId = this.extractProductId();
    if (!productId) {
      log.error('Could not extract product ID');
      return this.extractReviews(); // Fallback to single page
    }

    // Check cache first
    const cachedReviews = this.reviewCache.get(productId);
    if (cachedReviews) {
      log.info(
        `Using cached reviews for product ${productId} (${cachedReviews.length} reviews)`
      );
      return cachedReviews;
    }

    try {
      // First, get the reviews from the current page
      const currentPageReviews = this.extractReviews();
      log.info(`Found ${currentPageReviews.length} reviews on current page`);

      // Analyze pagination info
      const paginationInfo = analyzeReviewPagination(
        document.documentElement.innerHTML
      );
      log.info(
        `Total reviews: ${paginationInfo.totalReviews}, Total pages: ${paginationInfo.totalPages}`
      );

      if (paginationInfo.totalPages <= 1) {
        return currentPageReviews;
      }

      // Determine which pages to fetch
      const pagesToFetch = selectPagesToFetch(paginationInfo.totalPages);
      log.info(
        `Will fetch ${pagesToFetch.length} pages: ${pagesToFetch.join(', ')}`
      );

      // Generate URLs for pages to fetch (excluding page 1 if we already have it)
      const urls = pagesToFetch
        .filter((pageNum) => pageNum !== 1) // Skip page 1 as we already have it
        .map((pageNum) => generateReviewPageUrl(productId, pageNum));

      // Fetch pages in parallel
      const fetchedPages = await fetchMultiplePages(urls);

      // Parse reviews from fetched pages
      const allReviews = [...currentPageReviews];
      for (const page of fetchedPages) {
        if (!page.error && page.html) {
          const pageReviews = parseReviewsFromHtml(page.html);
          allReviews.push(...pageReviews);
          log.info(`Extracted ${pageReviews.length} reviews from ${page.url}`);
        } else if (page.error) {
          log.error(`Failed to fetch ${page.url}:`, page.error);
        }
      }

      log.info(`Total reviews extracted: ${allReviews.length}`);

      // Cache the results
      this.reviewCache.set(productId, allReviews);
      log.info(`Cached reviews for product ${productId}`);

      return allReviews;
    } catch (error) {
      log.error(
        'Error in multi-page extraction, falling back to single page:',
        error
      );
      return this.extractReviews();
    }
  }

  private async analyzeReviews() {
    try {
      // Show loading indicator
      this.showLoadingIndicator();

      const reviews = await this.extractMultiPageReviews();
      if (reviews.length === 0) {
        log.info('No reviews found on page');
        this.hideLoadingIndicator();
        return;
      }

      log.info(`Found ${reviews.length} reviews, analyzing...`);

      const result = await this.checkReviews(reviews);
      this.hideLoadingIndicator();
      this.displayResults(result as Record<string, unknown>);
    } catch (error) {
      log.error('Error analyzing reviews:', error);
      this.hideLoadingIndicator();
    }
  }

  private showLoadingIndicator() {
    this.hideLoadingIndicator(); // Remove any existing loader
    this.loadingComponent = mountComponent(LoadingIndicator, {});
  }

  private hideLoadingIndicator() {
    if (this.loadingComponent) {
      this.loadingComponent.destroy();
      this.loadingComponent = null;
    }
  }

  private async checkReviews(reviews: ReviewData[]): Promise<AnalysisResult> {
    return await truestarApi.analyzeReviews(reviews);
  }

  private displayResults(analysis: unknown) {
    // Validate the analysis response
    if (!isValidAnalysisResult(analysis)) {
      log.error('Invalid analysis result received:', analysis);
      // Display error state
      this.displayError('Invalid analysis response received');
      return;
    }

    // Remove any existing panel
    if (this.analysisComponent) {
      this.analysisComponent.destroy();
    }

    // Mount the new analysis panel with validated data
    this.analysisComponent = mountComponent(AnalysisPanel, {
      analysis: {
        isFake: analysis.isFake,
        confidence: analysis.confidence,
        summary: analysis.summary,
        reasons: analysis.reasons,
        flags: analysis.flags
      },
      onClose: () => {
        if (this.analysisComponent) {
          this.analysisComponent.destroy();
          this.analysisComponent = null;
        }
      }
    });
  }

  private displayError(message: string) {
    // Remove any existing panels
    if (this.analysisComponent) {
      this.analysisComponent.destroy();
    }

    // Display error state using AnalysisPanel with error data
    this.analysisComponent = mountComponent(AnalysisPanel, {
      analysis: {
        isFake: false,
        confidence: 0,
        summary: message,
        reasons: ['Unable to analyze reviews due to an error'],
        flags: []
      },
      onClose: () => {
        if (this.analysisComponent) {
          this.analysisComponent.destroy();
          this.analysisComponent = null;
        }
      }
    });
  }
}

// Export for testing
export class AmazonMultiPageExtractor {
  extractProductId(): string | null {
    const match = window.location.pathname.match(/\/dp\/([A-Z0-9]+)/);
    return match ? match[1] : null;
  }
}

new AmazonProductPageChecker();

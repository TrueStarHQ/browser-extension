import type { AmazonReview, ReviewChecker } from '@truestarhq/shared-types';

import AnalysisPanel from '../components/AnalysisPanel.svelte';
import LoadingIndicator from '../components/LoadingIndicator.svelte';
import {
  analyzeReviewPagination,
  generateReviewPageUrl,
} from '../lib/amazon/amazon-pagination';
import { fetchMultiplePages } from '../lib/amazon/page-fetcher';
import { parseReviewsFromHtml } from '../lib/amazon/review-parser';
import { selectPagesToFetch } from '../lib/amazon/review-sampling';
import { truestarApi } from '../services/truestar-api';
import { log } from '../utils/logger';
import { mountComponent } from '../utils/mount-component';

function isValidAnalysisResult(obj: unknown): obj is ReviewChecker {
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
  private loadingComponent: ReturnType<typeof mountComponent> | null = null;
  private analysisComponent: ReturnType<typeof mountComponent> | null = null;

  constructor() {
    this.init();
  }

  private init(): void {
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
    return match?.[1] ?? null;
  }

  private extractReviews(): AmazonReview[] {
    return parseReviewsFromHtml(document.documentElement.innerHTML);
  }

  private async extractMultiPageReviews(): Promise<AmazonReview[]> {
    const productId = this.extractProductId();
    if (!productId) {
      log.error('Could not extract product ID');
      return this.extractReviews();
    }

    try {
      const currentPageReviews = this.extractReviews();
      log.info(`Found ${currentPageReviews.length} reviews on current page`);

      const paginationInfo = analyzeReviewPagination(
        document.documentElement.innerHTML
      );
      log.info(
        `Total reviews: ${paginationInfo.totalReviews}, Total pages: ${paginationInfo.totalPages}`
      );

      if (paginationInfo.totalPages <= 1) {
        return currentPageReviews;
      }

      const pagesToFetch = selectPagesToFetch(paginationInfo.totalPages);
      log.info(
        `Will fetch ${pagesToFetch.length} pages: ${pagesToFetch.join(', ')}`
      );

      const urls = pagesToFetch
        .filter((pageNum) => pageNum !== 1)
        .map((pageNum) => generateReviewPageUrl(productId, pageNum));

      const fetchedPages = await fetchMultiplePages(urls);

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
      return allReviews;
    } catch (error) {
      log.error(
        'Error in multi-page extraction, falling back to single page:',
        error
      );
      return this.extractReviews();
    }
  }

  private async analyzeReviews(): Promise<void> {
    try {
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

  private async checkReviews(reviews: AmazonReview[]): Promise<ReviewChecker> {
    return await truestarApi.analyzeReviews(reviews);
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
      analysis: {
        isFake: analysis.isFake,
        confidence: analysis.confidence,
        summary: analysis.summary,
        reasons: analysis.reasons,
        flags: analysis.flags,
      },
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

    this.analysisComponent = mountComponent(AnalysisPanel, {
      analysis: {
        isFake: false,
        confidence: 0,
        summary: message,
        reasons: ['Unable to analyze reviews due to an error'],
        flags: [],
      },
      onClose: () => {
        if (this.analysisComponent) {
          this.analysisComponent.destroy();
          this.analysisComponent = null;
        }
      },
    });
  }
}

export class AmazonMultiPageExtractor {
  extractProductId(): string | null {
    const match = window.location.pathname.match(/\/dp\/([A-Z0-9]+)/);
    return match?.[1] ?? null;
  }
}

new AmazonProductPageChecker();

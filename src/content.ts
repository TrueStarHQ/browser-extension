import { truestarApi } from './services/truestar-api';
import type { ReviewData } from './services/truestar-api';
import { log } from './lib/logger';
import {
  analyzeReviewPagination,
  generateReviewPageUrl,
} from './lib/amazon-pagination';
import { selectPagesToFetch } from './lib/review-sampling';
import { fetchMultiplePages } from './lib/page-fetcher';
import { parseReviewsFromHtml } from './lib/review-parser';
import { ReviewCache } from './lib/review-cache';

class AmazonProductPageChecker {
  private reviewCache: ReviewCache;

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
    const reviews: ReviewData[] = [];
    const reviewElements = document.querySelectorAll('[data-hook="review"]');

    reviewElements.forEach((reviewEl) => {
      try {
        const ratingEl = reviewEl.querySelector(
          '[data-hook="review-star-rating"]'
        );
        const textEl = reviewEl.querySelector('[data-hook="review-body"]');
        const authorEl = reviewEl.querySelector('[data-hook="review-author"]');
        const verifiedEl = reviewEl.querySelector('[data-hook="avp-badge"]');

        if (ratingEl && textEl) {
          const ratingText = ratingEl.textContent || '';
          const rating = parseFloat(ratingText.match(/(\d\.?\d?)/)?.[1] || '0');

          reviews.push({
            rating,
            text: textEl.textContent?.trim() || '',
            author: authorEl?.textContent?.trim() || 'Anonymous',
            verified: !!verifiedEl,
          });
        }
      } catch (error) {
        log.error('Error extracting review:', error);
      }
    });

    return reviews;
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
      this.displayResults(result);
    } catch (error) {
      log.error('Error analyzing reviews:', error);
      this.hideLoadingIndicator();
    }
  }

  private showLoadingIndicator() {
    const loader = document.createElement('div');
    loader.id = 'truestar-loader';
    loader.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      width: 300px;
      background: white;
      border: 2px solid #007185;
      border-radius: 8px;
      padding: 16px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 10000;
      font-family: Arial, sans-serif;
      font-size: 14px;
      text-align: center;
    `;
    loader.innerHTML = `
      <strong style="color: #232f3e;">TrueStar Analysis</strong>
      <div style="margin-top: 12px;">Loading reviews from multiple pages...</div>
      <div style="margin-top: 8px; font-size: 12px; color: #666;">This may take a moment</div>
    `;
    document.body.appendChild(loader);
  }

  private hideLoadingIndicator() {
    const loader = document.querySelector('#truestar-loader');
    if (loader) {
      loader.remove();
    }
  }

  private async checkReviews(reviews: ReviewData[]): Promise<unknown> {
    return await truestarApi.analyzeReviews(reviews);
  }

  private displayResults(analysis: Record<string, unknown>) {
    const existingPanel = document.querySelector('#truestar-panel');
    if (existingPanel) {
      existingPanel.remove();
    }

    const panel = document.createElement('div');
    panel.id = 'truestar-panel';
    panel.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      width: 300px;
      background: white;
      border: 2px solid #007185;
      border-radius: 8px;
      padding: 16px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 10000;
      font-family: Arial, sans-serif;
      font-size: 14px;
    `;

    const fakeScore = (analysis.isFake as boolean)
      ? Math.round((analysis.confidence as number) * 100)
      : Math.round((1 - (analysis.confidence as number)) * 100);
    const color =
      fakeScore > 70 ? '#d13212' : fakeScore > 40 ? '#ff9900' : '#067d62';

    const allRedFlags = [
      ...((analysis.reasons as string[]) || []),
      ...((analysis.flags as string[]) || []),
    ];

    panel.innerHTML = `
      <div style="display: flex; align-items: center; margin-bottom: 12px;">
        <strong style="color: #232f3e;">TrueStar Analysis</strong>
        <button onclick="this.parentElement.parentElement.remove()" style="margin-left: auto; background: none; border: none; font-size: 18px; cursor: pointer;">×</button>
      </div>
      <div style="margin-bottom: 8px;">
        <div style="display: flex; justify-content: space-between;">
          <span>Fake Review Score:</span>
          <span style="font-weight: bold; color: ${color};">${fakeScore}%</span>
        </div>
        <div style="background: #f0f0f0; height: 6px; border-radius: 3px; margin-top: 4px;">
          <div style="background: ${color}; height: 100%; width: ${fakeScore}%; border-radius: 3px;"></div>
        </div>
      </div>
      <div style="margin-bottom: 8px; font-size: 12px; color: #666;">
        Confidence: ${Math.round((analysis.confidence as number) * 100)}%
      </div>
      <div style="font-size: 12px; color: #333;">
        ${(analysis.summary as string) || 'No analysis available'}
      </div>
      ${
        allRedFlags && allRedFlags.length > 0
          ? `
        <details style="margin-top: 8px; font-size: 12px;">
          <summary style="cursor: pointer; color: #007185;">Red Flags (${allRedFlags.length})</summary>
          <ul style="margin: 4px 0 0 16px; padding: 0;">
            ${allRedFlags.map((flag: string) => `<li>${flag}</li>`).join('')}
          </ul>
        </details>
      `
          : ''
      }
    `;

    document.body.appendChild(panel);
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

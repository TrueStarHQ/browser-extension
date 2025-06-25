import { truestarApi } from './services/truestar-api';
import type { ReviewData } from './services/truestar-api';
import { log } from './lib/logger';

class AmazonProductPageChecker {
  constructor() {
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

  private async analyzeReviews() {
    try {
      const reviews = this.extractReviews();
      if (reviews.length === 0) {
        log.info('No reviews found on page');
        return;
      }

      log.info(`Found ${reviews.length} reviews, analyzing...`);

      const result = await this.checkReviews(reviews);
      this.displayResults(result);
    } catch (error) {
      log.error('Error analyzing reviews:', error);
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

new AmazonProductPageChecker();

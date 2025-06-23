import OpenAI from 'openai';
import { PromptBuilders } from './prompts/index';

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
});

interface ReviewData {
  rating: number;
  text: string;
  author: string;
  verified: boolean;
}

class TrueStarAnalyzer {
  private apiKey: string;

  constructor() {
    this.apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    if (!this.apiKey) {
      console.error('TrueStar: OpenAI API key not found');
      return;
    }
    this.init();
  }

  private init() {
    if (this.isAmazonProductPage()) {
      console.log('TrueStar: Amazon product page detected');
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
        console.error('TrueStar: Error extracting review:', error);
      }
    });

    return reviews;
  }

  private async analyzeReviews() {
    try {
      const reviews = this.extractReviews();
      if (reviews.length === 0) {
        console.log('TrueStar: No reviews found on page');
        return;
      }

      console.log(`TrueStar: Found ${reviews.length} reviews, analyzing...`);

      const analysisResult = await this.callOpenAI(reviews);
      this.displayResults(analysisResult);
    } catch (error) {
      console.error('TrueStar: Error analyzing reviews:', error);
    }
  }

  private async callOpenAI(reviews: ReviewData[]): Promise<any> {
    const prompt = PromptBuilders.batchReviewPrompt(reviews);

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
      max_tokens: 500,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error('No response from OpenAI');

    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = content.match(/```json\s*\n([\s\S]*?)\n```/);
      const cleanContent = jsonMatch ? jsonMatch[1] : content;
      return JSON.parse(cleanContent.trim());
    } catch {
      console.error('TrueStar: Failed to parse OpenAI response:', content);
      return {
        overall_fake_score: 0,
        confidence: 0,
        red_flags: ['Analysis failed'],
        summary: 'Unable to analyze reviews',
      };
    }
  }

  private displayResults(analysis: any) {
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

    const fakeScore = analysis.overall_fake_score || 0;
    const color =
      fakeScore > 70 ? '#d13212' : fakeScore > 40 ? '#ff9900' : '#067d62';

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
        Confidence: ${analysis.confidence || 0}%
      </div>
      <div style="font-size: 12px; color: #333;">
        ${analysis.summary || 'No analysis available'}
      </div>
      ${
        analysis.red_flags && analysis.red_flags.length > 0
          ? `
        <details style="margin-top: 8px; font-size: 12px;">
          <summary style="cursor: pointer; color: #007185;">Red Flags (${analysis.red_flags.length})</summary>
          <ul style="margin: 4px 0 0 16px; padding: 0;">
            ${analysis.red_flags.map((flag: string) => `<li>${flag}</li>`).join('')}
          </ul>
        </details>
      `
          : ''
      }
    `;

    document.body.appendChild(panel);
  }
}

new TrueStarAnalyzer();

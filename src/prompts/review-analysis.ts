// Static prompts
export const PROMPTS = {
  BATCH_REVIEW_ANALYSIS: `Analyze these Amazon product reviews for fake review patterns. Look for:
- Repetitive language or phrases
- Unusual rating distributions  
- Generic/vague content
- Suspicious timing patterns
- Overly positive language that seems artificial

Reviews to analyze:
{{REVIEWS_PLACEHOLDER}}

Respond with a JSON object containing:
- overall_fake_score: number 0-100 (0=definitely real, 100=definitely fake)
- confidence: number 0-100
- red_flags: array of specific issues found
- summary: brief explanation

JSON response:`,
} as const;

// Dynamic prompt builders
export const PromptBuilders = {
  batchReviewPrompt: (
    reviews: Array<{
      rating: number;
      text: string;
      verified: boolean;
    }>
  ): string => {
    const reviewsText = reviews
      .map(
        (r, i) =>
          `Review ${i + 1}: ${r.rating}/5 stars - "${r.text}" (Verified: ${r.verified})`
      )
      .join('\n');

    return PROMPTS.BATCH_REVIEW_ANALYSIS.replace(
      '{{REVIEWS_PLACEHOLDER}}',
      reviewsText
    );
  },
};

export interface PaginationInfo {
  totalReviews: number;
  totalPages: number;
}

const REVIEWS_PER_PAGE = 10;

export function extractPaginationInfo(html: string): PaginationInfo {
  // Find the review count in the data-hook attribute (most reliable method)
  const dataHookMatch = html.match(
    /<span[^>]*data-hook=["']total-review-count["'][^>]*>([^<]+)</
  );

  if (dataHookMatch && dataHookMatch[1]) {
    // Extract number from text like "30,230 global ratings" or "1.234 Bewertungen"
    // Handles both comma and period as separators
    const numberMatch = dataHookMatch[1].match(/(\d+(?:[.,]\d+)*)/);
    if (numberMatch && numberMatch[1]) {
      // Assumes the number is an integer (review counts don't have decimals)
      const countStr = numberMatch[1].replace(/[.,]/g, '');
      const totalReviews = parseInt(countStr, 10);
      const totalPages = Math.ceil(totalReviews / REVIEWS_PER_PAGE);

      return {
        totalReviews,
        totalPages,
      };
    }
  }

  return {
    totalReviews: 0,
    totalPages: 0,
  };
}

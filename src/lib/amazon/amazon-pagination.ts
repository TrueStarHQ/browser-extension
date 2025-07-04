export interface PaginationInfo {
  totalReviews: number;
  totalPages: number;
}

const REVIEWS_PER_PAGE = 10;

export function extractPaginationInfo(html: string): PaginationInfo {
  const reviewCountMatch = html.match(/(\d+(?:,\d+)*)\s+global reviews/);

  if (reviewCountMatch && reviewCountMatch[1]) {
    const countStr = reviewCountMatch[1].replace(/,/g, '');
    const totalReviews = parseInt(countStr, 10);
    const totalPages = Math.ceil(totalReviews / REVIEWS_PER_PAGE);

    return {
      totalReviews,
      totalPages,
    };
  }

  return {
    totalReviews: 0,
    totalPages: 0,
  };
}

export function generateReviewPageUrl(
  productId: string,
  pageNumber: number
): string {
  return `https://www.amazon.com/product-reviews/${productId}?pageNumber=${pageNumber}`;
}

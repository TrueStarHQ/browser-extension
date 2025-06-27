import { describe, it, expect, vi } from 'vitest';
import { fetchReviewPage, fetchMultiplePages } from './page-fetcher';

describe('Page Fetcher', () => {
  describe('fetchReviewPage', () => {
    it('should fetch a review page and return HTML', async () => {
      const mockHtml = '<html><body>Review page content</body></html>';
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        text: vi.fn().mockResolvedValue(mockHtml),
      });

      const url =
        'https://www.amazon.com/product-reviews/B08N5WRWNW?pageNumber=2';
      const result = await fetchReviewPage(url);

      expect(result).toBe(mockHtml);
      expect(global.fetch).toHaveBeenCalledWith(url);
    });

    it('should throw error when fetch fails', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      const url = 'https://www.amazon.com/product-reviews/INVALID?pageNumber=2';

      await expect(fetchReviewPage(url)).rejects.toThrow(
        'Failed to fetch page: 404 Not Found'
      );
    });
  });

  describe('fetchMultiplePages', () => {
    it('should fetch multiple pages in parallel', async () => {
      const mockResponses = {
        'https://www.amazon.com/product-reviews/B08N5WRWNW?pageNumber=1':
          '<html>Page 1</html>',
        'https://www.amazon.com/product-reviews/B08N5WRWNW?pageNumber=2':
          '<html>Page 2</html>',
        'https://www.amazon.com/product-reviews/B08N5WRWNW?pageNumber=3':
          '<html>Page 3</html>',
      };

      global.fetch = vi.fn().mockImplementation((url) => {
        return Promise.resolve({
          ok: true,
          text: vi.fn().mockResolvedValue(mockResponses[url]),
        });
      });

      const urls = Object.keys(mockResponses);
      const results = await fetchMultiplePages(urls);

      expect(results).toHaveLength(3);
      expect(results[0].url).toBe(urls[0]);
      expect(results[0].html).toBe(mockResponses[urls[0]]);
      expect(results[1].url).toBe(urls[1]);
      expect(results[1].html).toBe(mockResponses[urls[1]]);
    });
  });
});

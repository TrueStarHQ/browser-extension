import { RateLimiter } from '../../utils/rate-limiter';
import { retryWithBackoff } from '../../utils/retry-helper';

export interface PageResult {
  url: string;
  html: string;
  error?: Error;
}

const rateLimiter = new RateLimiter({
  maxRequests: 5,
  windowMs: 1000,
});

// Determine if an error is retryable
function isRetryableError(error: Error): boolean {
  const message = error.message.toLowerCase();

  if (
    message.includes('429') || // Too Many Requests
    message.includes('503') || // Service Unavailable
    message.includes('502') || // Bad Gateway
    message.includes('504') || // Gateway Timeout
    message.includes('network') ||
    message.includes('timeout')
  ) {
    return true;
  }

  if (
    message.includes('404') || // Not Found
    message.includes('403') || // Forbidden
    message.includes('401')
  ) {
    return false;
  }

  return true;
}

export async function fetchReviewPage(url: string): Promise<string> {
  return rateLimiter.executeWithLimit(async () => {
    return retryWithBackoff(
      async () => {
        const response = await fetch(url);

        if (!response.ok) {
          throw new Error(
            `Failed to fetch page: ${response.status} ${response.statusText}`
          );
        }

        return response.text();
      },
      {
        maxRetries: 3,
        initialDelay: 500,
        maxDelay: 5000,
        shouldRetry: isRetryableError,
      }
    );
  });
}

export async function fetchMultiplePages(
  urls: string[]
): Promise<PageResult[]> {
  const promises = urls.map(async (url) => {
    try {
      const html = await fetchReviewPage(url);
      return { url, html };
    } catch (error) {
      return { url, html: '', error: error as Error };
    }
  });

  return Promise.all(promises);
}

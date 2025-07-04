import { RateLimiter } from '../../utils/rate-limiter';

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
    let lastError: Error;
    const maxRetries = 3;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch(url);

        if (!response.ok) {
          throw new Error(
            `Failed to fetch page: ${response.status} ${response.statusText}`
          );
        }

        return response.text();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // Don't retry if it's not a retryable error
        if (!isRetryableError(lastError)) {
          throw lastError;
        }

        // Don't retry on last attempt
        if (attempt === maxRetries) {
          throw lastError;
        }

        // Simple backoff: wait longer each time (1s, 2s, 3s)
        const delay = (attempt + 1) * 1000;
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    throw lastError!;
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
      return {
        url,
        html: '',
        error: error instanceof Error ? error : new Error(String(error)),
      };
    }
  });

  return Promise.all(promises);
}

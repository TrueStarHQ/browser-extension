export interface PageResult {
  url: string;
  html: string;
  error?: Error;
}

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
    message.includes('401') || // Unauthorized
    message.includes('400') // Bad Request
  ) {
    return false;
  }

  return true;
}

export async function fetchReviewPage(url: string): Promise<string> {
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

      if (!isRetryableError(lastError)) {
        throw lastError;
      }

      if (attempt === maxRetries) {
        throw lastError;
      }

      const delay = (attempt + 1) * 1000;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
}

export async function fetchMultiplePages(
  urls: string[]
): Promise<PageResult[]> {
  const results: PageResult[] = [];

  for (let i = 0; i < urls.length; i++) {
    const url = urls[i]!;

    try {
      const html = await fetchReviewPage(url);
      results.push({ url, html });
    } catch (error) {
      results.push({
        url,
        html: '',
        error: error instanceof Error ? error : new Error(String(error)),
      });
    }

    if (i < urls.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
  }

  return results;
}

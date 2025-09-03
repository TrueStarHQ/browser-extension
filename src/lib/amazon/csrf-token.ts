import { log } from '../../utils/logger';

/**
 * Extracts the anti-CSRF token from Amazon product pages
 * The token is consistently found in the cr-state-object span element
 */
export function extractReviewsCSRFToken(html: string): string | null {
  try {
    // Find the reviewsCsrfToken in the cr-state-object
    const stateObjectPattern =
      /<span[^>]*id=["']cr-state-object["'][^>]*data-state=["']([^"']+)["'][^>]*>/i;
    const stateMatch = html.match(stateObjectPattern);

    if (!stateMatch || !stateMatch[1]) {
      log.warn('Could not find cr-state-object element');
      return null;
    }

    // The data-state attribute should contain valid JSON
    let stateJson = stateMatch[1];

    stateJson = stateJson
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&');

    const stateData = JSON.parse(stateJson);
    const token = stateData.reviewsCsrfToken;

    if (token) {
      return token;
    }

    log.warn('cr-state-object found but no CSRF token present');
    return null;
  } catch (error) {
    log.error('Failed to extract CSRF token:', error);
    return null;
  }
}

import { log } from '../../utils/logger';

export function extractReviewsCSRFToken(html: string): string | null {
  try {
    const stateObjectPattern =
      /<span[^>]*id=["']cr-state-object["'][^>]*data-state=["']([^"']+)["'][^>]*>/i;
    const stateMatch = html.match(stateObjectPattern);

    if (!stateMatch || !stateMatch[1]) {
      log.warn('Could not find cr-state-object element');
      return null;
    }

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

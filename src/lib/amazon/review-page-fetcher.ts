import type { AmazonReview } from '@truestarhq/shared-types';

import { log } from '../../utils/logger';
import { parseReviewsFromHtml } from './review-parser';

const AMAZON_AJAX_DELIMITER = '&&&';
const AMAZON_AJAX_APPEND_ACTION = 'append';
const AMAZON_REVIEW_DATA_HOOK = 'data-hook="review"';
const AMAZON_CSRF_HEADER = 'anti-csrftoken-a2z';

type AmazonAjaxCommand = [string, string?, string?];

interface AjaxFetchOptions {
  productId: string;
  pageNumber: number;
  csrfToken: string;
  sortBy?: 'recent' | 'helpful';
}

export class AmazonFetchError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly productId?: string,
    public readonly pageNumber?: number
  ) {
    super(message);
    this.name = 'AmazonFetchError';
  }
}

export class AmazonParseError extends Error {
  constructor(
    message: string,
    public readonly responseText?: string
  ) {
    super(message);
    this.name = 'AmazonParseError';
  }
}

export async function fetchReviewPage(
  productId: string,
  pageNumber: number,
  csrfToken: string
): Promise<AmazonReview[]> {
  const options: AjaxFetchOptions = {
    productId,
    pageNumber,
    csrfToken,
    sortBy: 'recent',
  };

  try {
    const response = await makeAjaxRequest(options);
    const responseText = await response.text();
    return parseResponse(responseText);
  } catch (error) {
    if (error instanceof AmazonFetchError) {
      log.error('Amazon fetch error:', {
        message: error.message,
        statusCode: error.statusCode,
        productId: error.productId,
        pageNumber: error.pageNumber,
      });
    } else if (error instanceof AmazonParseError) {
      log.error('Amazon parse error:', {
        message: error.message,
        responsePreview: error.responseText?.substring(0, 200),
      });
    } else {
      log.error('Unexpected error fetching reviews:', error);
    }
    return [];
  }
}

async function makeAjaxRequest(options: AjaxFetchOptions): Promise<Response> {
  const { productId, pageNumber, csrfToken, sortBy = 'recent' } = options;

  const ajaxUrl = buildRequestUrl(pageNumber);

  const formData = new URLSearchParams({
    asin: productId,
    pageNumber: pageNumber.toString(),
    sortBy,
  });

  const response = await fetch(ajaxUrl, {
    method: 'POST',
    credentials: 'include',
    headers: {
      [AMAZON_CSRF_HEADER]: csrfToken,
      'content-type': 'application/x-www-form-urlencoded',
    },
    body: formData.toString(),
  });

  if (!response.ok) {
    throw new AmazonFetchError(
      `Review page request failed: ${response.status} ${response.statusText}`,
      response.status,
      productId,
      pageNumber
    );
  }

  return response;
}

function buildRequestUrl(pageNumber: number): string {
  return `https://www.amazon.com/hz/reviews-render/ajax/reviews/get/ref=cm_cr_getr_d_paging_btm_next_${pageNumber}`;
}

function parseResponse(responseText: string): AmazonReview[] {
  if (!responseText.includes(AMAZON_AJAX_DELIMITER)) {
    return [];
  }

  const reviewHtml = extractReviewHtmlFromCommands(responseText);

  if (!reviewHtml) {
    return [];
  }

  return parseReviewsFromHtml(reviewHtml);
}

function extractReviewHtmlFromCommands(responseText: string): string {
  const commands = responseText.split(AMAZON_AJAX_DELIMITER);
  let reviewHtml = '';

  for (const command of commands) {
    const htmlContent = extractHtmlFromCommand(command);
    if (htmlContent) {
      reviewHtml += htmlContent;
    }
  }

  return reviewHtml;
}

function extractHtmlFromCommand(commandString: string): string | null {
  try {
    const parsed = JSON.parse(commandString.trim()) as AmazonAjaxCommand;

    if (!isAppendCommand(parsed)) {
      return null;
    }

    const content = parsed[2] || parsed[1];

    if (isReviewContent(content)) {
      return content;
    }

    return null;
  } catch {
    return null;
  }
}

function isAppendCommand(command: unknown): command is AmazonAjaxCommand {
  return Array.isArray(command) && command[0] === AMAZON_AJAX_APPEND_ACTION;
}

function isReviewContent(content: unknown): content is string {
  return (
    typeof content === 'string' && content.includes(AMAZON_REVIEW_DATA_HOOK)
  );
}

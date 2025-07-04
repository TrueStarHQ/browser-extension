const MAX_PAGES_TO_FETCH = 8;
const RECENT_PAGES = 5;
const OLDEST_PAGES = 3;
const MIDDLE_SAMPLES = 3;

export function selectPagesToFetch(totalPages: number): number[] {
  if (totalPages <= MAX_PAGES_TO_FETCH) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages: number[] = [];

  for (let i = 1; i <= RECENT_PAGES; i++) {
    pages.push(i);
  }

  for (let i = totalPages - OLDEST_PAGES + 1; i <= totalPages; i++) {
    pages.push(i);
  }

  // Add middle samples if we have enough pages
  if (totalPages > 20) {
    const middleStart = RECENT_PAGES + 1;
    const middleEnd = totalPages - OLDEST_PAGES;
    const middleRange = middleEnd - middleStart;

    for (let i = 0; i < MIDDLE_SAMPLES; i++) {
      const offset = Math.floor((middleRange / (MIDDLE_SAMPLES + 1)) * (i + 1));
      const pageNum = middleStart + offset;
      pages.push(pageNum);
    }
  }

  return pages.sort((a, b) => a - b);
}

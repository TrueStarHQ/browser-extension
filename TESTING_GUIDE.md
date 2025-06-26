# Multi-Page Review Extraction - Manual Testing Guide

## Overview
This guide helps you manually test the multi-page review extraction feature across various Amazon products to ensure it works correctly with different review counts and page structures.

## Prerequisites
1. Build and load the extension in your browser
2. Open the browser's developer console (F12) to see logs
3. Have the network tab open to monitor requests

## Test Scenarios

### 1. Product with Few Reviews (≤ 8 reviews)
**Purpose**: Verify that products with few reviews don't trigger multi-page fetching

**Test Product Example**: Search for a newly listed product or niche item
- Expected behavior:
  - No additional page fetches
  - All reviews extracted from current page
  - Console log: "Total pages: 1"

### 2. Product with Moderate Reviews (10-50 reviews)
**Purpose**: Test page sampling with 2-5 pages of reviews

**Test Product Examples**:
- Books with 20-30 reviews
- Small electronics with moderate popularity

**Expected behavior**:
- Should fetch all pages (since ≤ 8 pages)
- Console logs showing:
  - "Total reviews: XX, Total pages: Y"
  - "Will fetch Y pages: 1, 2, 3..."
  - Multiple "Extracted X reviews from [URL]" messages
- Loading indicator appears during fetch

### 3. Product with Many Reviews (100-500 reviews)
**Purpose**: Test intelligent sampling algorithm

**Test Product Examples**:
- Popular electronics (e.g., Echo Dot, Fire TV Stick)
- Best-selling books

**Expected behavior**:
- Should apply sampling strategy
- Console logs showing:
  - "Will fetch 8 pages" (not all pages)
  - First 5 pages + last 3 pages fetched
  - Some middle pages sampled
- Total extracted reviews should be ~80-120

### 4. Product with Thousands of Reviews (1000+ reviews)
**Purpose**: Test performance and sampling with large datasets

**Test Product Examples**:
- iPhone cases
- Popular video games
- Best-selling books (Harry Potter, etc.)

**Expected behavior**:
- Efficient sampling (still only 8 pages)
- Console should show large total review count
- API payload size logged (should be < 1MB)
- No performance degradation

### 5. Cache Testing
**Purpose**: Verify caching works correctly

**Steps**:
1. Visit a product page and wait for analysis
2. Navigate away and return to the same product
3. Check console for "Using cached reviews for product XXX"

**Expected behavior**:
- Second visit should use cache (no network requests)
- Results should appear instantly
- Cache expires after 30 minutes

### 6. Error Handling
**Purpose**: Test resilience to network issues

**Test by**:
1. Throttle network to slow 3G
2. Visit product with many reviews
3. Disconnect network mid-fetch (advanced)

**Expected behavior**:
- Retry attempts visible in console
- Graceful fallback to current page reviews
- No extension crashes

### 7. Rate Limiting
**Purpose**: Ensure we don't overwhelm Amazon

**Test by**:
1. Open multiple product pages quickly
2. Monitor network tab for request timing

**Expected behavior**:
- Max 5 requests per second
- Requests should be spaced appropriately
- No 429 (Too Many Requests) errors

## Console Commands for Testing

You can paste these in the console while on a product page:

```javascript
// Check current cache stats
console.log('Cache stats:', window.truestarChecker?.reviewCache?.getStats());

// Force clear cache
window.truestarChecker?.reviewCache?.clear();

// Check extracted review count
console.log('Reviews found:', document.querySelectorAll('[data-hook="review"]').length);
```

## What to Look For

### Success Indicators:
- ✅ Loading indicator appears and disappears
- ✅ Analysis results shown after loading
- ✅ No console errors
- ✅ Reasonable number of reviews extracted
- ✅ Performance feels responsive

### Warning Signs:
- ⚠️ Console errors or exceptions
- ⚠️ Requests failing repeatedly
- ⚠️ Very slow performance
- ⚠️ Loading indicator stuck
- ⚠️ Missing reviews that are visible on page

## Logging Checklist

For each test, note:
- [ ] Product URL
- [ ] Total review count shown by Amazon
- [ ] Number of pages detected
- [ ] Number of reviews extracted
- [ ] Time taken for analysis
- [ ] Any errors in console
- [ ] Performance observations

## Bug Reporting

If you encounter issues, please provide:
1. Product URL
2. Browser and version
3. Console logs (copy all TrueStar-related logs)
4. Network tab screenshot (if relevant)
5. Description of expected vs actual behavior

## Performance Benchmarks

Expected performance targets:
- Products with ≤ 8 reviews: < 2 seconds
- Products with 50-100 reviews: < 5 seconds  
- Products with 1000+ reviews: < 8 seconds
- Cache hit: < 1 second

## Additional Tests

### Edge Cases:
- Products with exactly 10 reviews (boundary case)
- Products with no reviews
- Products with only verified/unverified reviews
- International Amazon sites (amazon.co.uk, amazon.ca)
- Products with special characters in reviews

### Browser Compatibility:
Test on:
- Chrome (latest)
- Firefox (latest)
- Edge (Chromium-based)

## Notes

- The extension caches results for 30 minutes per product
- Rate limiting prevents more than 5 requests per second
- Review IDs are extracted for future deduplication
- Fallback IDs (UNKNOWN_timestamp_index) indicate parsing issues
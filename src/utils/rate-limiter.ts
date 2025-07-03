interface RateLimiterOptions {
  maxRequests: number;
  windowMs: number;
}

export class RateLimiter {
  private maxRequests: number;
  private windowMs: number;
  private requests: number[] = [];

  constructor(options: RateLimiterOptions) {
    this.maxRequests = options.maxRequests;
    this.windowMs = options.windowMs;
  }

  async acquire(): Promise<void> {
    const now = Date.now();

    // Remove old requests outside the window
    this.requests = this.requests.filter((time) => now - time < this.windowMs);

    if (this.requests.length < this.maxRequests) {
      // We can make a request immediately
      this.requests.push(now);
      return;
    }

    // Need to wait for the oldest request to expire
    const oldestRequest = this.requests[0];
    if (oldestRequest === undefined) {
      // This shouldn't happen, but handle it gracefully
      this.requests.push(now);
      return;
    }
    const waitTime = this.windowMs - (now - oldestRequest);

    await new Promise((resolve) => setTimeout(resolve, waitTime));

    // After waiting, try again
    return this.acquire();
  }

  async executeWithLimit<T>(fn: () => Promise<T>): Promise<T> {
    await this.acquire();
    return fn();
  }
}

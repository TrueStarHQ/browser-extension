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

    this.requests = this.requests.filter((time) => now - time < this.windowMs);

    if (this.requests.length < this.maxRequests) {
      this.requests.push(now);
      return;
    }

    const oldestRequest = this.requests[0];
    if (oldestRequest === undefined) {
      this.requests.push(now);
      return;
    }
    const waitTime = this.windowMs - (now - oldestRequest);

    await new Promise((resolve) => setTimeout(resolve, waitTime));

    return this.acquire();
  }

  async executeWithLimit<T>(fn: () => Promise<T>): Promise<T> {
    await this.acquire();
    return fn();
  }
}

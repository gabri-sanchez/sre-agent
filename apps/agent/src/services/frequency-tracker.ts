interface ErrorOccurrence {
  timestamp: number;
  eventId: string;
}

interface FrequencyStore {
  [key: string]: ErrorOccurrence[];
}

export interface FrequencyResult {
  count: number;
  thresholdExceeded: boolean;
  windowMinutes: number;
  threshold: number;
  oldestInWindow?: number;
  newestInWindow: number;
}

class FrequencyTracker {
  private store: FrequencyStore = {};
  private readonly windowMs: number;
  private readonly threshold: number;
  private cleanupInterval: ReturnType<typeof setInterval>;

  constructor(windowMinutes: number = 10, threshold: number = 5) {
    this.windowMs = windowMinutes * 60 * 1000;
    this.threshold = threshold;

    // Clean up old entries every minute
    this.cleanupInterval = setInterval(() => this.cleanup(), 60_000);
  }

  /**
   * Record an error occurrence and check if threshold is exceeded
   */
  record(service: string, errorType: string, eventId: string): FrequencyResult {
    const key = `${service}:${errorType}`;
    const now = Date.now();

    if (!this.store[key]) {
      this.store[key] = [];
    }

    // Add new occurrence
    this.store[key].push({ timestamp: now, eventId });

    // Filter to only occurrences within window
    const windowStart = now - this.windowMs;
    this.store[key] = this.store[key].filter((o) => o.timestamp >= windowStart);

    const count = this.store[key].length;

    return {
      count,
      thresholdExceeded: count >= this.threshold,
      windowMinutes: this.windowMs / 60_000,
      threshold: this.threshold,
      oldestInWindow: this.store[key][0]?.timestamp,
      newestInWindow: now,
    };
  }

  /**
   * Get current frequency for a service/error combination
   */
  getFrequency(service: string, errorType: string): number {
    const key = `${service}:${errorType}`;
    const now = Date.now();
    const windowStart = now - this.windowMs;

    if (!this.store[key]) return 0;

    return this.store[key].filter((o) => o.timestamp >= windowStart).length;
  }

  /**
   * Get all active error counts
   */
  getAllFrequencies(): Record<string, number> {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    const result: Record<string, number> = {};

    for (const key of Object.keys(this.store)) {
      const count = this.store[key].filter(
        (o) => o.timestamp >= windowStart
      ).length;
      if (count > 0) {
        result[key] = count;
      }
    }

    return result;
  }

  /**
   * Clean up old entries across all keys
   */
  private cleanup(): void {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    for (const key of Object.keys(this.store)) {
      this.store[key] = this.store[key].filter((o) => o.timestamp >= windowStart);

      // Remove empty keys
      if (this.store[key].length === 0) {
        delete this.store[key];
      }
    }
  }

  /**
   * Stop the cleanup interval (for graceful shutdown)
   */
  destroy(): void {
    clearInterval(this.cleanupInterval);
  }
}

// Export singleton instance
export const frequencyTracker = new FrequencyTracker(10, 5);

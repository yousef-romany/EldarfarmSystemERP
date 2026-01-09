/**
 * Performance monitoring utilities for tracking API response times and system health
 */

export class PerformanceMonitor {
  private static metrics: Map<string, number[]> = new Map();
  private static readonly MAX_METRICS_PER_KEY = 100;

  /**
   * Start a timer for a specific operation
   */
  static startTimer(operation: string): () => void {
    const startTime = performance.now();
    return () => {
      const duration = performance.now() - startTime;
      this.recordMetric(operation, duration);
    };
  }

  /**
   * Record a metric for a specific operation
   */
  private static recordMetric(operation: string, duration: number): void {
    if (!this.metrics.has(operation)) {
      this.metrics.set(operation, []);
    }

    const metrics = this.metrics.get(operation)!;
    metrics.push(duration);

    // Keep only the most recent metrics to prevent memory leaks
    if (metrics.length > this.MAX_METRICS_PER_KEY) {
      metrics.shift();
    }
  }

  /**
   * Get statistics for a specific operation
   */
  static getStats(operation: string): {
    count: number;
    avg: number;
    min: number;
    max: number;
    p50: number;
    p95: number;
    p99: number;
  } | null {
    const metrics = this.metrics.get(operation);
    if (!metrics || metrics.length === 0) {
      return null;
    }

    const sorted = [...metrics].sort((a, b) => a - b);
    const count = sorted.length;
    const sum = sorted.reduce((a, b) => a + b, 0);

    return {
      count,
      avg: sum / count,
      min: sorted[0],
      max: sorted[count - 1],
      p50: sorted[Math.floor(count * 0.5)],
      p95: sorted[Math.floor(count * 0.95)],
      p99: sorted[Math.floor(count * 0.99)],
    };
  }

  /**
   * Get all metrics
   */
  static getAllMetrics(): Record<string, ReturnType<typeof PerformanceMonitor.getStats>> {
    const result: Record<string, ReturnType<typeof PerformanceMonitor.getStats>> = {};
    for (const [operation] of this.metrics) {
      result[operation] = this.getStats(operation)!;
    }
    return result;
  }

  /**
   * Clear all metrics
   */
  static clearMetrics(): void {
    this.metrics.clear();
  }

  /**
   * Log performance metrics to console (useful for development)
   */
  static logMetrics(): void {
    const allMetrics = this.getAllMetrics();
    console.group('Performance Metrics');
    for (const [operation, stats] of Object.entries(allMetrics)) {
      if (stats) {
        console.log(`${operation}:`, {
          count: stats.count,
          avg: `${stats.avg.toFixed(2)}ms`,
          min: `${stats.min.toFixed(2)}ms`,
          max: `${stats.max.toFixed(2)}ms`,
          p95: `${stats.p95.toFixed(2)}ms`,
          p99: `${stats.p99.toFixed(2)}ms`,
        });
      }
    }
    console.groupEnd();
  }
}

/**
 * Middleware function to measure API response time
 */
export function withPerformanceMonitoring<T extends (...args: any[]) => Promise<any>>(
  operation: string,
  fn: T
): T {
  return (async (...args: any[]) => {
    const endTimer = PerformanceMonitor.startTimer(operation);
    try {
      const result = await fn(...args);
      endTimer();
      return result;
    } catch (error) {
      endTimer();
      throw error;
    }
  }) as T;
}

/**
 * Log memory usage (useful for debugging memory leaks)
 */
export function logMemoryUsage(): void {
  if (typeof process !== 'undefined' && process.memoryUsage) {
    const usage = process.memoryUsage();
    console.log('Memory Usage:', {
      rss: `${(usage.rss / 1024 / 1024).toFixed(2)} MB`,
      heapTotal: `${(usage.heapTotal / 1024 / 1024).toFixed(2)} MB`,
      heapUsed: `${(usage.heapUsed / 1024 / 1024).toFixed(2)} MB`,
      external: `${(usage.external / 1024 / 1024).toFixed(2)} MB`,
    });
  }
}

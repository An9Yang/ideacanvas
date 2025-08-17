export class PerformanceMonitor {
  private marks: Map<string, number> = new Map();
  private measures: Map<string, number> = new Map();

  mark(name: string): void {
    this.marks.set(name, performance.now());
  }

  measure(name: string, startMark: string, endMark?: string): number {
    const start = this.marks.get(startMark);
    if (!start) {
      console.warn(`Mark ${startMark} not found`);
      return 0;
    }

    const end = endMark ? this.marks.get(endMark) : performance.now();
    if (!end) {
      console.warn(`Mark ${endMark} not found`);
      return 0;
    }

    const duration = end - start;
    this.measures.set(name, duration);
    return duration;
  }

  getReport(): { marks: Record<string, number>; measures: Record<string, number> } {
    return {
      marks: Object.fromEntries(this.marks),
      measures: Object.fromEntries(this.measures)
    };
  }

  logReport(): void {
    const report = this.getReport();
    console.log('Performance Report:');
    console.table(report.measures);
  }
}

// 节流函数
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  let lastResult: any;

  return function (this: any, ...args: Parameters<T>) {
    if (!inThrottle) {
      lastResult = func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
    return lastResult;
  };
}

// 防抖函数
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;

  return function (this: any, ...args: Parameters<T>) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

// 缓存装饰器
export function memoize<T extends (...args: any[]) => any>(
  func: T,
  keyGenerator?: (...args: Parameters<T>) => string
): T {
  const cache = new Map<string, ReturnType<T>>();

  return ((...args: Parameters<T>) => {
    const key = keyGenerator ? keyGenerator(...args) : JSON.stringify(args);
    
    if (cache.has(key)) {
      return cache.get(key);
    }

    const result = func(...args);
    cache.set(key, result);
    
    // 限制缓存大小
    if (cache.size > 100) {
      const firstKey = cache.keys().next().value;
      cache.delete(firstKey);
    }

    return result;
  }) as T;
}

// 批处理执行器
export class BatchProcessor<T, R> {
  private queue: Array<{ item: T; resolve: (value: R) => void; reject: (error: any) => void }> = [];
  private processing = false;

  constructor(
    private processor: (items: T[]) => Promise<R[]>,
    private batchSize: number = 10,
    private delay: number = 100
  ) {}

  async process(item: T): Promise<R> {
    return new Promise<R>((resolve, reject) => {
      this.queue.push({ item, resolve, reject });
      this.scheduleProcessing();
    });
  }

  private scheduleProcessing(): void {
    if (this.processing) return;

    this.processing = true;
    setTimeout(() => this.processQueue(), this.delay);
  }

  private async processQueue(): Promise<void> {
    if (this.queue.length === 0) {
      this.processing = false;
      return;
    }

    const batch = this.queue.splice(0, this.batchSize);
    const items = batch.map(b => b.item);

    try {
      const results = await this.processor(items);
      batch.forEach((b, i) => b.resolve(results[i]));
    } catch (error) {
      batch.forEach(b => b.reject(error));
    }

    if (this.queue.length > 0) {
      setTimeout(() => this.processQueue(), this.delay);
    } else {
      this.processing = false;
    }
  }
}
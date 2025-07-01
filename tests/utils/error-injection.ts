/**
 * 错误注入工具
 * 用于测试系统的错误恢复能力
 */

export class ErrorInjector {
  private originalFetch: typeof fetch;
  private errorScenarios: Map<string, () => Response>;
  
  constructor() {
    this.originalFetch = global.fetch || window.fetch;
    this.errorScenarios = new Map();
    this.setupErrorScenarios();
  }
  
  /**
   * 设置错误场景
   */
  private setupErrorScenarios() {
    // API错误响应
    this.errorScenarios.set('401_unauthorized', () => 
      new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      })
    );
    
    this.errorScenarios.set('403_forbidden', () => 
      new Response(JSON.stringify({ error: 'Forbidden - API key invalid' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      })
    );
    
    this.errorScenarios.set('429_rate_limit', () => 
      new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
        status: 429,
        headers: { 
          'Content-Type': 'application/json',
          'Retry-After': '60'
        }
      })
    );
    
    this.errorScenarios.set('500_server_error', () => 
      new Response(JSON.stringify({ error: 'Internal server error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    );
    
    // 网络错误
    this.errorScenarios.set('network_timeout', () => {
      throw new Error('Network timeout');
    });
    
    this.errorScenarios.set('network_offline', () => {
      throw new Error('Failed to fetch');
    });
    
    // 格式错误响应
    this.errorScenarios.set('invalid_json', () => 
      new Response('This is not JSON', {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    );
    
    this.errorScenarios.set('truncated_json', () => 
      new Response('{"nodes":[{"id":"n1","data":{"label":"Test"', {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    );
    
    this.errorScenarios.set('malformed_ai_response', () => 
      new Response(JSON.stringify({
        choices: [{
          message: {
            content: '```json\n{"nodes":[{"id":"n1","data":{"label":"测试\n节点","content":"包含\n未转义的\n换行符"}}]}\n```\n\n这是AI的额外说明文字。'
          }
        }]
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    );
    
    // 超长响应
    this.errorScenarios.set('huge_response', () => {
      const hugeContent = 'A'.repeat(1000000); // 1MB的内容
      return new Response(JSON.stringify({
        choices: [{
          message: {
            content: `{"nodes":[{"id":"n1","data":{"label":"Huge","content":"${hugeContent}"}}]}`
          }
        }]
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    });
    
    // 慢响应
    this.errorScenarios.set('slow_response', async () => {
      await new Promise(resolve => setTimeout(resolve, 5000)); // 5秒延迟
      return new Response(JSON.stringify({
        choices: [{
          message: {
            content: '{"nodes":[{"id":"n1","data":{"label":"Slow"}}]}'
          }
        }]
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    });
  }
  
  /**
   * 注入错误场景
   */
  inject(scenario: string) {
    const errorResponse = this.errorScenarios.get(scenario);
    if (!errorResponse) {
      throw new Error(`Unknown error scenario: ${scenario}`);
    }
    
    // 重写fetch
    (global as any).fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input.toString();
      
      // 只对API调用注入错误
      if (url.includes('/api/')) {
        console.log(`[ErrorInjector] Injecting ${scenario} for ${url}`);
        
        if (scenario === 'slow_response') {
          return await errorResponse();
        }
        
        return errorResponse();
      }
      
      // 其他请求正常处理
      return this.originalFetch(input, init);
    };
  }
  
  /**
   * 恢复正常fetch
   */
  restore() {
    (global as any).fetch = this.originalFetch;
  }
  
  /**
   * 运行错误恢复测试
   */
  async runErrorRecoveryTest(scenario: string, testFn: () => Promise<any>) {
    console.log(`\n🔥 测试错误场景: ${scenario}`);
    
    try {
      this.inject(scenario);
      const result = await testFn();
      console.log(`  ✅ 错误恢复成功`);
      return { scenario, success: true, result };
    } catch (error) {
      console.log(`  ❌ 错误恢复失败: ${error.message}`);
      return { scenario, success: false, error: error.message };
    } finally {
      this.restore();
    }
  }
}

/**
 * localStorage注入工具
 */
export class StorageErrorInjector {
  private originalSetItem: typeof localStorage.setItem;
  private originalGetItem: typeof localStorage.getItem;
  
  constructor() {
    this.originalSetItem = localStorage.setItem.bind(localStorage);
    this.originalGetItem = localStorage.getItem.bind(localStorage);
  }
  
  /**
   * 模拟存储满
   */
  injectQuotaExceeded() {
    localStorage.setItem = () => {
      throw new DOMException('QuotaExceededError');
    };
  }
  
  /**
   * 模拟存储不可用
   */
  injectStorageUnavailable() {
    localStorage.setItem = () => {
      throw new Error('localStorage is not available');
    };
    
    localStorage.getItem = () => {
      throw new Error('localStorage is not available');
    };
  }
  
  /**
   * 模拟数据损坏
   */
  injectCorruptedData() {
    localStorage.getItem = (key: string) => {
      if (key.includes('flow')) {
        return '{corrupted json data}';
      }
      return this.originalGetItem(key);
    };
  }
  
  /**
   * 恢复正常
   */
  restore() {
    localStorage.setItem = this.originalSetItem;
    localStorage.getItem = this.originalGetItem;
  }
}

/**
 * 性能降级注入
 */
export class PerformanceDegrader {
  /**
   * 添加延迟到所有操作
   */
  static addLatency(ms: number) {
    const originalTimeout = setTimeout;
    (global as any).setTimeout = (fn: Function, delay: number, ...args: any[]) => {
      return originalTimeout(fn, delay + ms, ...args);
    };
  }
  
  /**
   * 模拟高CPU使用
   */
  static simulateHighCPU(duration: number) {
    const start = Date.now();
    while (Date.now() - start < duration) {
      // 占用CPU
      Math.sqrt(Math.random());
    }
  }
  
  /**
   * 模拟内存压力
   */
  static simulateMemoryPressure() {
    const arrays: any[] = [];
    try {
      for (let i = 0; i < 1000; i++) {
        arrays.push(new Array(1000000).fill(Math.random()));
      }
    } catch (e) {
      // 内存不足
    }
    return arrays;
  }
}
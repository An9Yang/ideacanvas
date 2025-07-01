/**
 * 压力测试工具
 * 用于测试系统在高负载下的表现
 */

interface StressTestResult {
  testName: string;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  errors: string[];
  memoryUsage?: {
    before: number;
    after: number;
    peak: number;
  };
}

export class StressTestRunner {
  private results: StressTestResult[] = [];
  
  /**
   * 并发请求测试
   */
  async testConcurrentRequests(
    endpoint: string,
    requestBody: any,
    concurrentCount: number = 10,
    totalRequests: number = 100
  ): Promise<StressTestResult> {
    console.log(`\n🔥 压力测试: ${concurrentCount} 并发, 共 ${totalRequests} 请求`);
    
    const responseTimes: number[] = [];
    const errors: string[] = [];
    let successCount = 0;
    
    const memBefore = process.memoryUsage().heapUsed / 1024 / 1024;
    let memPeak = memBefore;
    
    // 创建请求队列
    const queue: Promise<void>[] = [];
    let completed = 0;
    
    const makeRequest = async () => {
      const startTime = Date.now();
      
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody)
        });
        
        if (response.ok) {
          successCount++;
        } else {
          errors.push(`HTTP ${response.status}`);
        }
        
        const responseTime = Date.now() - startTime;
        responseTimes.push(responseTime);
        
      } catch (error) {
        errors.push(error.message);
      }
      
      completed++;
      if (completed % 10 === 0) {
        const currentMem = process.memoryUsage().heapUsed / 1024 / 1024;
        memPeak = Math.max(memPeak, currentMem);
        console.log(`  进度: ${completed}/${totalRequests} (${(completed/totalRequests*100).toFixed(1)}%)`);
      }
    };
    
    // 启动并发请求
    const startTime = Date.now();
    
    for (let i = 0; i < totalRequests; i++) {
      if (queue.length >= concurrentCount) {
        await Promise.race(queue);
        queue.splice(queue.findIndex(p => p), 1);
      }
      
      const promise = makeRequest();
      queue.push(promise);
    }
    
    // 等待所有请求完成
    await Promise.all(queue);
    
    const totalTime = Date.now() - startTime;
    const memAfter = process.memoryUsage().heapUsed / 1024 / 1024;
    
    // 计算统计数据
    const result: StressTestResult = {
      testName: `并发测试 (${concurrentCount} 并发)`,
      totalRequests,
      successfulRequests: successCount,
      failedRequests: totalRequests - successCount,
      averageResponseTime: responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length || 0,
      minResponseTime: Math.min(...responseTimes) || 0,
      maxResponseTime: Math.max(...responseTimes) || 0,
      errors: [...new Set(errors)], // 去重
      memoryUsage: {
        before: memBefore,
        after: memAfter,
        peak: memPeak
      }
    };
    
    this.printResult(result);
    this.results.push(result);
    
    console.log(`  总耗时: ${totalTime}ms`);
    console.log(`  吞吐量: ${(totalRequests / (totalTime / 1000)).toFixed(2)} 请求/秒`);
    
    return result;
  }
  
  /**
   * 递增负载测试
   */
  async testIncreasingLoad(
    endpoint: string,
    requestBody: any,
    maxConcurrent: number = 50
  ): Promise<StressTestResult[]> {
    console.log(`\n📈 递增负载测试 (1 到 ${maxConcurrent} 并发)`);
    
    const loadResults: StressTestResult[] = [];
    
    for (let concurrent = 1; concurrent <= maxConcurrent; concurrent += 5) {
      const result = await this.testConcurrentRequests(
        endpoint,
        requestBody,
        concurrent,
        concurrent * 10 // 每个并发级别测试 10 倍请求
      );
      
      loadResults.push(result);
      
      // 如果错误率超过 50%，停止测试
      if (result.failedRequests / result.totalRequests > 0.5) {
        console.log(`\n⚠️  错误率过高 (${(result.failedRequests / result.totalRequests * 100).toFixed(1)}%)，停止递增测试`);
        break;
      }
      
      // 短暂休息，让系统恢复
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    return loadResults;
  }
  
  /**
   * 持续负载测试
   */
  async testSustainedLoad(
    endpoint: string,
    requestBody: any,
    duration: number = 60000, // 默认1分钟
    requestsPerSecond: number = 10
  ): Promise<StressTestResult> {
    console.log(`\n⏱️  持续负载测试 (${duration/1000}秒, ${requestsPerSecond} 请求/秒)`);
    
    const startTime = Date.now();
    const endTime = startTime + duration;
    const interval = 1000 / requestsPerSecond;
    
    const responseTimes: number[] = [];
    const errors: string[] = [];
    let successCount = 0;
    let totalRequests = 0;
    
    const makeRequest = async () => {
      const reqStartTime = Date.now();
      totalRequests++;
      
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody)
        });
        
        if (response.ok) {
          successCount++;
        } else {
          errors.push(`HTTP ${response.status}`);
        }
        
        responseTimes.push(Date.now() - reqStartTime);
        
      } catch (error) {
        errors.push(error.message);
      }
    };
    
    // 持续发送请求
    while (Date.now() < endTime) {
      makeRequest(); // 不等待，保持恒定速率
      await new Promise(resolve => setTimeout(resolve, interval));
      
      // 每10秒报告一次
      if ((Date.now() - startTime) % 10000 < interval) {
        const elapsed = (Date.now() - startTime) / 1000;
        console.log(`  已运行: ${elapsed.toFixed(0)}秒, 请求: ${totalRequests}, 成功率: ${(successCount/totalRequests*100).toFixed(1)}%`);
      }
    }
    
    // 等待最后的请求完成
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    const result: StressTestResult = {
      testName: '持续负载测试',
      totalRequests,
      successfulRequests: successCount,
      failedRequests: totalRequests - successCount,
      averageResponseTime: responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length || 0,
      minResponseTime: Math.min(...responseTimes) || 0,
      maxResponseTime: Math.max(...responseTimes) || 0,
      errors: [...new Set(errors)]
    };
    
    this.printResult(result);
    this.results.push(result);
    
    return result;
  }
  
  /**
   * 峰值测试
   */
  async testSpikeBehavior(
    endpoint: string,
    requestBody: any,
    normalLoad: number = 5,
    spikeLoad: number = 50,
    spikeDuration: number = 10000
  ): Promise<StressTestResult[]> {
    console.log(`\n⚡ 峰值测试 (正常: ${normalLoad} 并发, 峰值: ${spikeLoad} 并发)`);
    
    const results: StressTestResult[] = [];
    
    // 正常负载
    console.log('\n正常负载阶段:');
    const normalResult = await this.testConcurrentRequests(endpoint, requestBody, normalLoad, normalLoad * 10);
    results.push(normalResult);
    
    // 短暂休息
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 峰值负载
    console.log('\n峰值负载阶段:');
    const spikeResult = await this.testConcurrentRequests(endpoint, requestBody, spikeLoad, spikeLoad * 10);
    results.push(spikeResult);
    
    // 恢复到正常负载
    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log('\n恢复阶段:');
    const recoveryResult = await this.testConcurrentRequests(endpoint, requestBody, normalLoad, normalLoad * 10);
    results.push(recoveryResult);
    
    // 分析恢复情况
    const recoveryTime = recoveryResult.averageResponseTime;
    const normalTime = normalResult.averageResponseTime;
    const recoveryRatio = recoveryTime / normalTime;
    
    console.log(`\n📊 恢复分析:`);
    console.log(`  正常响应时间: ${normalTime.toFixed(2)}ms`);
    console.log(`  恢复后响应时间: ${recoveryTime.toFixed(2)}ms`);
    console.log(`  恢复比率: ${recoveryRatio.toFixed(2)}x`);
    
    if (recoveryRatio > 1.5) {
      console.log(`  ⚠️  系统恢复较慢，可能存在性能问题`);
    } else {
      console.log(`  ✅ 系统恢复良好`);
    }
    
    return results;
  }
  
  /**
   * 内存泄漏测试
   */
  async testMemoryLeak(
    testFunction: () => Promise<void>,
    iterations: number = 100,
    checkInterval: number = 10
  ): Promise<any> {
    console.log(`\n🧠 内存泄漏测试 (${iterations} 次迭代)`);
    
    const memorySnapshots: number[] = [];
    
    // 强制垃圾回收（如果可用）
    if (global.gc) {
      global.gc();
    }
    
    const initialMemory = process.memoryUsage().heapUsed / 1024 / 1024;
    memorySnapshots.push(initialMemory);
    
    for (let i = 0; i < iterations; i++) {
      await testFunction();
      
      if ((i + 1) % checkInterval === 0) {
        // 强制垃圾回收
        if (global.gc) {
          global.gc();
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        const currentMemory = process.memoryUsage().heapUsed / 1024 / 1024;
        memorySnapshots.push(currentMemory);
        
        console.log(`  迭代 ${i + 1}: 内存使用 ${currentMemory.toFixed(2)}MB (增长: ${(currentMemory - initialMemory).toFixed(2)}MB)`);
      }
    }
    
    // 分析内存增长趋势
    const memoryGrowth = memorySnapshots[memorySnapshots.length - 1] - memorySnapshots[0];
    const averageGrowthPerIteration = memoryGrowth / iterations;
    
    console.log(`\n📊 内存分析:`);
    console.log(`  初始内存: ${initialMemory.toFixed(2)}MB`);
    console.log(`  最终内存: ${memorySnapshots[memorySnapshots.length - 1].toFixed(2)}MB`);
    console.log(`  总增长: ${memoryGrowth.toFixed(2)}MB`);
    console.log(`  平均每次迭代增长: ${averageGrowthPerIteration.toFixed(4)}MB`);
    
    if (averageGrowthPerIteration > 0.1) {
      console.log(`  ⚠️  检测到可能的内存泄漏！`);
    } else {
      console.log(`  ✅ 内存使用稳定`);
    }
    
    return {
      snapshots: memorySnapshots,
      totalGrowth: memoryGrowth,
      averageGrowth: averageGrowthPerIteration,
      possibleLeak: averageGrowthPerIteration > 0.1
    };
  }
  
  private printResult(result: StressTestResult) {
    console.log(`\n📊 测试结果: ${result.testName}`);
    console.log(`  成功: ${result.successfulRequests}/${result.totalRequests} (${(result.successfulRequests/result.totalRequests*100).toFixed(1)}%)`);
    console.log(`  平均响应时间: ${result.averageResponseTime.toFixed(2)}ms`);
    console.log(`  最快/最慢: ${result.minResponseTime}ms / ${result.maxResponseTime}ms`);
    
    if (result.errors.length > 0) {
      console.log(`  错误类型: ${result.errors.join(', ')}`);
    }
    
    if (result.memoryUsage) {
      console.log(`  内存使用: ${result.memoryUsage.before.toFixed(2)}MB -> ${result.memoryUsage.after.toFixed(2)}MB (峰值: ${result.memoryUsage.peak.toFixed(2)}MB)`);
    }
  }
  
  /**
   * 生成压力测试报告
   */
  generateReport(): string {
    const report = [
      '# 压力测试报告',
      `生成时间: ${new Date().toISOString()}`,
      '',
      '## 测试摘要',
      `总测试数: ${this.results.length}`,
      '',
      '## 详细结果'
    ];
    
    this.results.forEach(result => {
      report.push('');
      report.push(`### ${result.testName}`);
      report.push(`- 总请求数: ${result.totalRequests}`);
      report.push(`- 成功率: ${(result.successfulRequests/result.totalRequests*100).toFixed(1)}%`);
      report.push(`- 平均响应时间: ${result.averageResponseTime.toFixed(2)}ms`);
      report.push(`- 响应时间范围: ${result.minResponseTime}ms - ${result.maxResponseTime}ms`);
      
      if (result.memoryUsage) {
        report.push(`- 内存变化: ${result.memoryUsage.before.toFixed(2)}MB -> ${result.memoryUsage.after.toFixed(2)}MB`);
      }
    });
    
    return report.join('\n');
  }
}

// 导出便捷函数
export async function runStressTests(endpoint: string, testData: any) {
  const runner = new StressTestRunner();
  
  // 1. 基础并发测试
  await runner.testConcurrentRequests(endpoint, testData, 10, 100);
  
  // 2. 递增负载测试
  await runner.testIncreasingLoad(endpoint, testData, 30);
  
  // 3. 峰值测试
  await runner.testSpikeBehavior(endpoint, testData);
  
  // 4. 持续负载测试
  await runner.testSustainedLoad(endpoint, testData, 30000, 5);
  
  // 生成报告
  const report = runner.generateReport();
  console.log('\n' + report);
  
  return report;
}
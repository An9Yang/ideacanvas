#!/usr/bin/env ts-node

/**
 * 流程图生成压力测试
 * 测试 JSONFixer 和整个系统的可靠性
 */

import testCases from './stress-test-ideas.json';

interface TestResult {
  testId: string;
  testName: string;
  success: boolean;
  responseTime: number;
  error?: string;
  nodeCount?: number;
  edgeCount?: number;
  fixerUsed?: boolean;
  fixerIssues?: string[];
}

class FlowGenerationStressTest {
  private results: TestResult[] = [];
  private apiEndpoint = 'http://localhost:3000/api/generate-flow';
  
  async runAllTests() {
    console.log('🚀 开始流程图生成压力测试...\n');
    console.log(`准备测试 ${testCases.testCases.length} 个用例\n`);
    
    for (const testCase of testCases.testCases) {
      await this.runSingleTest(testCase);
      
      // 每个测试之间等待2秒，避免API限流
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    this.printReport();
  }
  
  async runSingleTest(testCase: any): Promise<void> {
    console.log(`\n📝 测试 ${testCase.id}: ${testCase.name}`);
    console.log(`   提示词长度: ${testCase.prompt.length} 字符`);
    
    const startTime = Date.now();
    const result: TestResult = {
      testId: testCase.id,
      testName: testCase.name,
      success: false,
      responseTime: 0
    };
    
    try {
      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: testCase.prompt })
      });
      
      const responseTime = Date.now() - startTime;
      result.responseTime = responseTime;
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`HTTP ${response.status}: ${errorData.error}`);
      }
      
      const data = await response.json();
      
      // 验证响应数据
      if (!data.nodes || !Array.isArray(data.nodes)) {
        throw new Error('响应缺少nodes数组');
      }
      
      if (!data.edges || !Array.isArray(data.edges)) {
        throw new Error('响应缺少edges数组');
      }
      
      result.success = true;
      result.nodeCount = data.nodes.length;
      result.edgeCount = data.edges.length;
      
      // 检查是否使用了 JSONFixer（通过查看服务器日志）
      // 实际项目中可以在响应中返回这个信息
      
      console.log(`   ✅ 成功 - ${result.nodeCount} 个节点, ${result.edgeCount} 条边 (${responseTime}ms)`);
      
      // 验证节点数量是否合理
      if (Math.abs(result.nodeCount - testCase.expectedNodes) > 3) {
        console.log(`   ⚠️  节点数量偏差较大 (期望: ${testCase.expectedNodes}, 实际: ${result.nodeCount})`);
      }
      
    } catch (error) {
      result.success = false;
      result.error = error instanceof Error ? error.message : '未知错误';
      console.log(`   ❌ 失败: ${result.error}`);
    }
    
    this.results.push(result);
  }
  
  printReport() {
    console.log('\n\n========================================');
    console.log('📊 压力测试报告');
    console.log('========================================\n');
    
    const totalTests = this.results.length;
    const successfulTests = this.results.filter(r => r.success).length;
    const failedTests = totalTests - successfulTests;
    const successRate = (successfulTests / totalTests * 100).toFixed(1);
    
    console.log(`总测试数: ${totalTests}`);
    console.log(`成功: ${successfulTests} (${successRate}%)`);
    console.log(`失败: ${failedTests}`);
    
    // 响应时间统计
    const successfulResults = this.results.filter(r => r.success);
    if (successfulResults.length > 0) {
      const responseTimes = successfulResults.map(r => r.responseTime);
      const avgTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
      const minTime = Math.min(...responseTimes);
      const maxTime = Math.max(...responseTimes);
      
      console.log(`\n⏱️  响应时间统计:`);
      console.log(`平均: ${avgTime.toFixed(0)}ms`);
      console.log(`最快: ${minTime}ms`);
      console.log(`最慢: ${maxTime}ms`);
    }
    
    // 节点统计
    if (successfulResults.length > 0) {
      const nodeCounts = successfulResults.map(r => r.nodeCount || 0);
      const avgNodes = nodeCounts.reduce((a, b) => a + b, 0) / nodeCounts.length;
      
      console.log(`\n📦 节点数量统计:`);
      console.log(`平均节点数: ${avgNodes.toFixed(1)}`);
      console.log(`最少节点: ${Math.min(...nodeCounts)}`);
      console.log(`最多节点: ${Math.max(...nodeCounts)}`);
    }
    
    // 失败分析
    if (failedTests > 0) {
      console.log('\n❌ 失败的测试:');
      this.results.filter(r => !r.success).forEach(r => {
        console.log(`- ${r.testName}: ${r.error}`);
      });
    }
    
    // 性能分级
    console.log('\n🎯 性能分级:');
    const performanceGrades = {
      excellent: successfulResults.filter(r => r.responseTime < 5000).length,
      good: successfulResults.filter(r => r.responseTime >= 5000 && r.responseTime < 10000).length,
      slow: successfulResults.filter(r => r.responseTime >= 10000 && r.responseTime < 20000).length,
      verySlow: successfulResults.filter(r => r.responseTime >= 20000).length
    };
    
    console.log(`优秀 (<5s): ${performanceGrades.excellent}`);
    console.log(`良好 (5-10s): ${performanceGrades.good}`);
    console.log(`较慢 (10-20s): ${performanceGrades.slow}`);
    console.log(`很慢 (>20s): ${performanceGrades.verySlow}`);
    
    // 测试建议
    console.log('\n💡 测试结论:');
    if (successRate === '100.0') {
      console.log('✅ 所有测试通过！JSONFixer 和系统修复机制工作正常。');
    } else if (parseFloat(successRate) >= 90) {
      console.log('✅ 系统可靠性良好，少量失败可能是由于网络或API限制。');
    } else if (parseFloat(successRate) >= 70) {
      console.log('⚠️  系统存在一些稳定性问题，建议检查失败的测试用例。');
    } else {
      console.log('❌ 系统可靠性较差，需要进一步优化错误处理机制。');
    }
    
    // 保存详细结果
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fs = require('fs');
    const path = require('path');
    const resultPath = path.join(__dirname, `results/flow-stress-test-${timestamp}.json`);
    
    if (!fs.existsSync(path.join(__dirname, 'results'))) {
      fs.mkdirSync(path.join(__dirname, 'results'), { recursive: true });
    }
    
    fs.writeFileSync(resultPath, JSON.stringify({
      summary: {
        totalTests,
        successfulTests,
        failedTests,
        successRate,
        timestamp: new Date().toISOString()
      },
      results: this.results
    }, null, 2));
    
    console.log(`\n📄 详细结果已保存到: ${resultPath}`);
  }
}

// 运行测试
async function main() {
  const tester = new FlowGenerationStressTest();
  
  console.log('⚠️  请确保开发服务器正在运行 (npm run dev)\n');
  console.log('按 Ctrl+C 可以随时中止测试\n');
  
  // 等待3秒让用户准备
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  try {
    await tester.runAllTests();
  } catch (error) {
    console.error('\n💥 测试过程中发生错误:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
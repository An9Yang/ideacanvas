#!/usr/bin/env ts-node

/**
 * 综合测试脚本
 * 运行所有类型的测试，生成完整的测试报告
 */

import { runSystemTests } from './utils/test-runner';
import { ErrorInjector, StorageErrorInjector } from './utils/error-injection';
import { StressTestRunner } from './utils/stress-test';
import * as fs from 'fs';
import * as path from 'path';

// 测试配置
const TEST_CONFIG = {
  apiEndpoint: 'http://localhost:3000/api/generate-flow',
  testPrompts: [
    '创建一个用户管理系统',
    'Design a payment processing system',
    '設計一個電子商務平台',
    'Eコマースプラットフォームを設計する',
    '전자상거래 플랫폼 설계'
  ]
};

async function runComprehensiveTests() {
  console.log('========================================');
  console.log('IdeaCanvas 综合测试套件');
  console.log('========================================\n');
  
  const testResults: any = {
    timestamp: new Date().toISOString(),
    systemTests: null,
    errorRecoveryTests: [],
    stressTests: [],
    recommendations: []
  };
  
  try {
    // 1. 系统功能测试
    console.log('\n📋 第一阶段: 系统功能测试\n');
    const systemResults = await runSystemTests();
    testResults.systemTests = systemResults;
    
    // 2. 错误恢复测试
    console.log('\n\n🔥 第二阶段: 错误恢复测试\n');
    const errorInjector = new ErrorInjector();
    const storageInjector = new StorageErrorInjector();
    
    // 测试各种API错误
    const errorScenarios = [
      '401_unauthorized',
      '403_forbidden', 
      '429_rate_limit',
      '500_server_error',
      'network_timeout',
      'invalid_json',
      'truncated_json',
      'malformed_ai_response'
    ];
    
    for (const scenario of errorScenarios) {
      const result = await errorInjector.runErrorRecoveryTest(scenario, async () => {
        const response = await fetch(TEST_CONFIG.apiEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: TEST_CONFIG.testPrompts[0] })
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          console.log(`    错误响应: ${errorData.error}`);
          
          // 验证错误处理是否正确
          if (!errorData.error || !errorData.statusCode) {
            throw new Error('错误响应格式不正确');
          }
        }
        
        return response;
      });
      
      testResults.errorRecoveryTests.push(result);
    }
    
    // 测试存储错误
    console.log('\n💾 测试存储错误恢复...');
    
    storageInjector.injectQuotaExceeded();
    try {
      localStorage.setItem('test', 'data');
      console.log('  ❌ 存储配额错误处理失败');
    } catch (e) {
      console.log('  ✅ 正确处理存储配额错误');
    }
    storageInjector.restore();
    
    // 3. 压力测试
    console.log('\n\n⚡ 第三阶段: 压力和性能测试\n');
    const stressRunner = new StressTestRunner();
    
    // 基础压力测试
    const basicStress = await stressRunner.testConcurrentRequests(
      TEST_CONFIG.apiEndpoint,
      { prompt: TEST_CONFIG.testPrompts[0] },
      5,  // 5并发
      20  // 20请求
    );
    testResults.stressTests.push(basicStress);
    
    // 多语言压力测试
    console.log('\n🌐 多语言并发测试...');
    const multiLangPromises = TEST_CONFIG.testPrompts.map(prompt => 
      fetch(TEST_CONFIG.apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      })
    );
    
    const multiLangStart = Date.now();
    const multiLangResults = await Promise.allSettled(multiLangPromises);
    const multiLangDuration = Date.now() - multiLangStart;
    
    const multiLangSuccess = multiLangResults.filter(r => r.status === 'fulfilled').length;
    console.log(`  完成: ${multiLangSuccess}/${TEST_CONFIG.testPrompts.length} 成功 (${multiLangDuration}ms)`);
    
    // 4. 边缘情况综合测试
    console.log('\n\n🔍 第四阶段: 边缘情况综合测试\n');
    
    const edgeCasePrompts = [
      '', // 空提示
      'a'.repeat(5000), // 超长提示
      '!@#$%^&*()', // 特殊字符
      '创建' + '\n'.repeat(50) + '系统', // 大量换行
      '{"injection": "test"}', // JSON注入尝试
      '<script>alert("xss")</script>', // XSS尝试
      '创建系统；DROP TABLE users；--', // SQL注入尝试
    ];
    
    let edgeCasesPassed = 0;
    for (const prompt of edgeCasePrompts) {
      try {
        const response = await fetch(TEST_CONFIG.apiEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt })
        });
        
        const data = await response.json();
        
        if (response.ok && data.nodes) {
          edgeCasesPassed++;
          console.log(`  ✅ 处理边缘输入: "${prompt.substring(0, 20)}..."`);
        } else if (data.error) {
          edgeCasesPassed++;
          console.log(`  ✅ 正确拒绝无效输入: "${prompt.substring(0, 20)}..."`);
        } else {
          console.log(`  ❌ 未正确处理边缘输入: "${prompt.substring(0, 20)}..."`);
        }
      } catch (e) {
        console.log(`  ❌ 边缘输入导致崩溃: "${prompt.substring(0, 20)}..."`);
      }
    }
    
    // 5. 生成测试报告和建议
    console.log('\n\n📊 生成测试报告...\n');
    
    // 分析结果并生成建议
    const systemTestsPassed = testResults.systemTests.filter(t => t.passed).length;
    const systemTestsTotal = testResults.systemTests.length;
    const systemPassRate = (systemTestsPassed / systemTestsTotal) * 100;
    
    const errorRecoveryPassed = testResults.errorRecoveryTests.filter(t => t.success).length;
    const errorRecoveryTotal = testResults.errorRecoveryTests.length;
    const errorRecoveryRate = (errorRecoveryPassed / errorRecoveryTotal) * 100;
    
    // 生成建议
    if (systemPassRate < 90) {
      testResults.recommendations.push('⚠️  系统功能测试通过率较低，建议重点检查JSON解析和格式处理逻辑');
    }
    
    if (errorRecoveryRate < 80) {
      testResults.recommendations.push('⚠️  错误恢复能力不足，建议增强错误处理和用户提示');
    }
    
    if (basicStress.failedRequests > basicStress.totalRequests * 0.1) {
      testResults.recommendations.push('⚠️  并发处理能力较弱，建议优化API性能或增加限流措施');
    }
    
    if (basicStress.maxResponseTime > 5000) {
      testResults.recommendations.push('⚠️  最大响应时间过长，建议添加超时处理和优化慢查询');
    }
    
    if (testResults.recommendations.length === 0) {
      testResults.recommendations.push('✅ 系统测试表现良好，各项指标均在正常范围内');
    }
    
    // 保存完整报告
    const reportPath = path.join(__dirname, `results/comprehensive-report-${Date.now()}.json`);
    if (!fs.existsSync(path.join(__dirname, 'results'))) {
      fs.mkdirSync(path.join(__dirname, 'results'), { recursive: true });
    }
    
    fs.writeFileSync(reportPath, JSON.stringify(testResults, null, 2));
    
    // 打印总结
    console.log('========================================');
    console.log('测试总结');
    console.log('========================================\n');
    console.log(`系统功能测试: ${systemTestsPassed}/${systemTestsTotal} 通过 (${systemPassRate.toFixed(1)}%)`);
    console.log(`错误恢复测试: ${errorRecoveryPassed}/${errorRecoveryTotal} 通过 (${errorRecoveryRate.toFixed(1)}%)`);
    console.log(`压力测试成功率: ${(basicStress.successfulRequests/basicStress.totalRequests*100).toFixed(1)}%`);
    console.log(`边缘情况处理: ${edgeCasesPassed}/${edgeCasePrompts.length} 通过`);
    
    console.log('\n建议:');
    testResults.recommendations.forEach(rec => console.log(rec));
    
    console.log(`\n📄 完整报告已保存到: ${reportPath}`);
    
    // 决定退出码
    const overallSuccess = systemPassRate >= 80 && errorRecoveryRate >= 70;
    process.exit(overallSuccess ? 0 : 1);
    
  } catch (error) {
    console.error('\n💥 测试过程中发生严重错误:', error);
    process.exit(1);
  }
}

// 运行测试
if (require.main === module) {
  runComprehensiveTests();
}
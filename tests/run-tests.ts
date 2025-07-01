#!/usr/bin/env ts-node

/**
 * 系统测试运行脚本
 * 使用方法: npx ts-node tests/run-tests.ts
 */

import { runSystemTests } from './utils/test-runner';
import * as fs from 'fs';
import * as path from 'path';

async function main() {
  console.log('================================');
  console.log('IdeaCanvas 系统测试套件');
  console.log('================================\n');
  
  try {
    // 运行所有测试
    const results = await runSystemTests();
    
    // 保存测试结果
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const resultPath = path.join(__dirname, `results/test-results-${timestamp}.json`);
    
    // 确保结果目录存在
    if (!fs.existsSync(path.join(__dirname, 'results'))) {
      fs.mkdirSync(path.join(__dirname, 'results'), { recursive: true });
    }
    
    fs.writeFileSync(resultPath, JSON.stringify(results, null, 2));
    console.log(`\n📄 测试结果已保存到: ${resultPath}`);
    
    // 检查是否有失败的测试
    const failedTests = results.filter(r => !r.passed);
    if (failedTests.length > 0) {
      console.log('\n⚠️  存在失败的测试，请查看上述错误信息。');
      process.exit(1);
    } else {
      console.log('\n✨ 所有测试通过！');
      process.exit(0);
    }
    
  } catch (error) {
    console.error('\n💥 测试运行时发生错误:', error);
    process.exit(1);
  }
}

// 运行测试
main();
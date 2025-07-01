import { sanitizeJSON, validateJSON, fixJSONControlCharacters } from '@/lib/utils/error-handler';
import { validateFlowData } from '@/app/api/generate-flow/route';
import edgeCases from '../fixtures/edge-cases.json';

interface TestResult {
  name: string;
  category: string;
  passed: boolean;
  error?: string;
  duration: number;
  details?: any;
}

export class SystemTestRunner {
  private results: TestResult[] = [];
  
  async runAllTests(): Promise<TestResult[]> {
    console.log('🚀 开始系统性测试...\n');
    
    // 1. JSON解析测试
    await this.runJSONParsingTests();
    
    // 2. 控制字符测试
    await this.runControlCharacterTests();
    
    // 3. 特殊字符测试
    await this.runSpecialCharacterTests();
    
    // 4. 格式错误恢复测试
    await this.runMalformedJSONTests();
    
    // 5. AI响应变化测试
    await this.runAIResponseTests();
    
    // 6. 错误场景测试
    await this.runErrorScenarioTests();
    
    // 7. 性能测试
    await this.runPerformanceTests();
    
    // 8. 边界条件测试
    await this.runBoundaryTests();
    
    return this.generateReport();
  }
  
  private async runJSONParsingTests() {
    console.log('📋 运行JSON解析测试...');
    
    const testCases = [
      {
        name: '基本JSON解析',
        input: '{"nodes":[{"id":"n1","data":{"label":"Test"}}]}',
        shouldPass: true
      },
      {
        name: '包含Unicode的JSON',
        input: '{"nodes":[{"id":"n1","data":{"label":"测试🎉"}}]}',
        shouldPass: true
      },
      {
        name: '嵌套结构',
        input: '{"nodes":[{"id":"n1","data":{"label":"Test","metadata":{"author":"系统","tags":["重要","紧急"]}}}]}',
        shouldPass: true
      }
    ];
    
    for (const testCase of testCases) {
      await this.runTest('JSON解析', testCase.name, async () => {
        const sanitized = sanitizeJSON(testCase.input);
        const parsed = validateJSON(sanitized);
        
        if (!parsed.nodes) {
          throw new Error('解析后缺少nodes字段');
        }
        
        return { parsed, sanitized };
      });
    }
  }
  
  private async runControlCharacterTests() {
    console.log('🔧 运行控制字符测试...');
    
    const cases = edgeCases.controlCharacters.cases;
    
    for (const testCase of cases) {
      if (testCase.malformedResponse) {
        await this.runTest('控制字符', testCase.name, async () => {
          const sanitized = sanitizeJSON(testCase.malformedResponse);
          const parsed = validateJSON(sanitized);
          
          // 验证控制字符被正确转义
          const nodeContent = parsed.nodes[0].data.content;
          if (nodeContent.includes('\n') || nodeContent.includes('\r') || nodeContent.includes('\t')) {
            // 这些应该被转义了，如果还存在说明有问题
            const rawCheck = JSON.stringify(nodeContent);
            if (!rawCheck.includes('\\n') && nodeContent.includes('\n')) {
              throw new Error('换行符未被正确转义');
            }
          }
          
          return { sanitized, parsed };
        });
      }
    }
  }
  
  private async runSpecialCharacterTests() {
    console.log('🌐 运行特殊字符测试...');
    
    const testCases = [
      {
        name: '中文全角标点',
        input: '{"nodes":[{"id":"n1","data":{"label":"测试：""引号""和\'单引号\'"}}]}',
        shouldPass: true
      },
      {
        name: 'Emoji处理',
        input: '{"nodes":[{"id":"n1","data":{"label":"开始🚀结束🎯"}}]}',
        shouldPass: true
      },
      {
        name: '混合语言',
        input: '{"nodes":[{"id":"n1","data":{"label":"Hello世界こんにちは"}}]}',
        shouldPass: true
      }
    ];
    
    for (const testCase of testCases) {
      await this.runTest('特殊字符', testCase.name, async () => {
        const sanitized = sanitizeJSON(testCase.input);
        const parsed = validateJSON(sanitized);
        return { parsed };
      });
    }
  }
  
  private async runMalformedJSONTests() {
    console.log('🔨 运行格式错误恢复测试...');
    
    const cases = edgeCases.malformedJSON.cases;
    
    for (const testCase of cases) {
      await this.runTest('格式错误恢复', testCase.name, async () => {
        try {
          const sanitized = sanitizeJSON(testCase.malformed);
          const parsed = validateJSON(sanitized);
          
          if (!testCase.shouldRecover) {
            throw new Error('不应该恢复的格式错误被恢复了');
          }
          
          return { recovered: true, parsed };
        } catch (error) {
          if (testCase.shouldRecover) {
            throw new Error(`应该恢复但失败了: ${error.message}`);
          }
          return { recovered: false, error: error.message };
        }
      });
    }
  }
  
  private async runAIResponseTests() {
    console.log('🤖 运行AI响应格式测试...');
    
    const cases = edgeCases.aiResponseVariations.cases;
    
    for (const testCase of cases) {
      await this.runTest('AI响应格式', testCase.name, async () => {
        // 模拟cleanAIResponse的处理
        let cleaned = testCase.response
          .replace(/```json\s*/g, '')
          .replace(/```\s*$/g, '')
          .trim();
        
        const sanitized = sanitizeJSON(cleaned);
        const parsed = validateJSON(sanitized);
        
        return { cleaned, parsed };
      });
    }
  }
  
  private async runErrorScenarioTests() {
    console.log('❌ 运行错误场景测试...');
    
    const cases = edgeCases.errorScenarios.cases;
    
    for (const testCase of cases) {
      await this.runTest('错误场景', testCase.name, async () => {
        try {
          if (!testCase.response) {
            throw new Error('AI没有返回有效内容');
          }
          
          const sanitized = sanitizeJSON(testCase.response);
          const parsed = validateJSON(sanitized);
          
          throw new Error('应该失败但成功了');
        } catch (error) {
          if (error.message.includes(testCase.expectedError)) {
            return { correctError: true, error: error.message };
          }
          throw error;
        }
      });
    }
  }
  
  private async runPerformanceTests() {
    console.log('⚡ 运行性能测试...');
    
    // 测试大量节点的JSON解析性能
    await this.runTest('性能测试', '解析100个节点', async () => {
      const nodes = Array.from({ length: 100 }, (_, i) => ({
        id: `node_${i}`,
        type: 'product',
        data: {
          label: `节点 ${i}`,
          content: `这是节点 ${i} 的详细内容，包含一些测试文本。`.repeat(10)
        },
        position: { x: i * 150, y: Math.floor(i / 10) * 200 }
      }));
      
      const edges = Array.from({ length: 99 }, (_, i) => ({
        id: `edge_${i}`,
        source: `node_${i}`,
        target: `node_${i + 1}`,
        label: `连接 ${i}`
      }));
      
      const largeJSON = JSON.stringify({ nodes, edges });
      
      const startTime = Date.now();
      const sanitized = sanitizeJSON(largeJSON);
      const parsed = validateJSON(sanitized);
      const duration = Date.now() - startTime;
      
      if (duration > 1000) {
        throw new Error(`解析时间过长: ${duration}ms`);
      }
      
      return { 
        nodeCount: parsed.nodes.length, 
        edgeCount: parsed.edges.length,
        duration 
      };
    });
    
    // 测试连续请求
    await this.runTest('性能测试', '连续解析10次', async () => {
      const durations: number[] = [];
      
      for (let i = 0; i < 10; i++) {
        const testJSON = `{"nodes":[{"id":"n${i}","data":{"label":"Test ${i}"}}]}`;
        const start = Date.now();
        sanitizeJSON(testJSON);
        durations.push(Date.now() - start);
      }
      
      const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
      
      return { 
        averageDuration: avgDuration,
        totalDuration: durations.reduce((a, b) => a + b, 0)
      };
    });
  }
  
  private async runBoundaryTests() {
    console.log('🔍 运行边界条件测试...');
    
    const boundaryTests = [
      {
        name: '空节点数组',
        input: '{"nodes":[],"edges":[]}',
        shouldPass: true
      },
      {
        name: '超长标签',
        input: `{"nodes":[{"id":"n1","data":{"label":"${'A'.repeat(1000)}"}}]}`,
        shouldPass: true
      },
      {
        name: '循环引用边',
        input: '{"nodes":[{"id":"n1","data":{"label":"A"}},{"id":"n2","data":{"label":"B"}}],"edges":[{"id":"e1","source":"n1","target":"n2"},{"id":"e2","source":"n2","target":"n1"}]}',
        shouldPass: true
      },
      {
        name: '自引用边',
        input: '{"nodes":[{"id":"n1","data":{"label":"Self"}}],"edges":[{"id":"e1","source":"n1","target":"n1"}]}',
        shouldPass: true
      },
      {
        name: '深度嵌套内容',
        generateInput: () => {
          const deepContent = { level1: { level2: { level3: { level4: { level5: 'deep' }}}}};
          return `{"nodes":[{"id":"n1","data":{"label":"Deep","content":"${JSON.stringify(deepContent)}"}}]}`;
        },
        shouldPass: true
      }
    ];
    
    for (const testCase of boundaryTests) {
      await this.runTest('边界条件', testCase.name, async () => {
        const input = testCase.generateInput ? testCase.generateInput() : testCase.input;
        const sanitized = sanitizeJSON(input);
        const parsed = validateJSON(sanitized);
        
        if (!testCase.shouldPass) {
          throw new Error('应该失败但成功了');
        }
        
        return { parsed };
      });
    }
  }
  
  private async runTest(category: string, name: string, testFn: () => Promise<any>) {
    const startTime = Date.now();
    
    try {
      const result = await testFn();
      const duration = Date.now() - startTime;
      
      this.results.push({
        category,
        name,
        passed: true,
        duration,
        details: result
      });
      
      console.log(`  ✅ ${name} (${duration}ms)`);
    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.results.push({
        category,
        name,
        passed: false,
        error: error.message,
        duration
      });
      
      console.log(`  ❌ ${name}: ${error.message}`);
    }
  }
  
  private generateReport(): TestResult[] {
    console.log('\n📊 测试报告总结\n');
    
    const totalTests = this.results.length;
    const passedTests = this.results.filter(r => r.passed).length;
    const failedTests = totalTests - passedTests;
    const categories = [...new Set(this.results.map(r => r.category))];
    
    console.log(`总测试数: ${totalTests}`);
    console.log(`通过: ${passedTests} (${((passedTests/totalTests)*100).toFixed(1)}%)`);
    console.log(`失败: ${failedTests}\n`);
    
    // 按类别统计
    categories.forEach(category => {
      const categoryResults = this.results.filter(r => r.category === category);
      const passed = categoryResults.filter(r => r.passed).length;
      console.log(`${category}: ${passed}/${categoryResults.length} 通过`);
    });
    
    // 失败的测试详情
    if (failedTests > 0) {
      console.log('\n❌ 失败的测试:');
      this.results.filter(r => !r.passed).forEach(r => {
        console.log(`- [${r.category}] ${r.name}: ${r.error}`);
      });
    }
    
    // 性能统计
    const avgDuration = this.results.reduce((sum, r) => sum + r.duration, 0) / totalTests;
    console.log(`\n⏱️  平均测试时间: ${avgDuration.toFixed(2)}ms`);
    
    return this.results;
  }
}

// 导出测试运行函数
export async function runSystemTests() {
  const runner = new SystemTestRunner();
  return await runner.runAllTests();
}
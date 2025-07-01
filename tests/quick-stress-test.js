#!/usr/bin/env node

/**
 * 快速压力测试 - 只测试5个关键用例
 */

const quickTests = [
  {
    id: "quick1",
    name: "基础测试",
    prompt: "创建一个用户登录系统"
  },
  {
    id: "quick2",
    name: "英文测试",
    prompt: "Create a simple blog system"
  },
  {
    id: "quick3",
    name: "URL测试",
    prompt: "创建API网关，转发请求到 https://api.example.com/v1/users/profile/settings 并处理响应"
  },
  {
    id: "quick4",
    name: "换行符测试",
    prompt: "设计系统包含：\n1. 用户管理\n2. 权限控制\n3. 数据统计\n4. 报表导出"
  },
  {
    id: "quick5",
    name: "特殊字符",
    prompt: "创建代码编辑器，支持<script>标签、SQL查询 SELECT * FROM users、正则 /[a-z]+/gi"
  }
];

async function runQuickTest() {
  console.log('🚀 快速压力测试（5个关键用例）\n');
  
  const results = [];
  let passed = 0;
  let failed = 0;
  
  for (const test of quickTests) {
    const startTime = Date.now();
    process.stdout.write(`${test.id}: ${test.name}... `);
    
    try {
      const response = await fetch('http://localhost:3000/api/generate-flow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: test.prompt })
      });
      
      const responseTime = Date.now() - startTime;
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Unknown error');
      }
      
      const data = await response.json();
      
      if (data.nodes && data.edges) {
        console.log(`✅ ${data.nodes.length}节点 (${responseTime}ms)`);
        passed++;
        results.push({ ...test, success: true, responseTime, nodes: data.nodes.length });
      } else {
        throw new Error('Invalid response format');
      }
      
    } catch (error) {
      console.log(`❌ ${error.message}`);
      failed++;
      results.push({ ...test, success: false, error: error.message });
    }
    
    // 短暂延迟
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // 打印总结
  console.log('\n========================================');
  console.log('测试总结');
  console.log('========================================');
  console.log(`总计: ${quickTests.length} 个测试`);
  console.log(`成功: ${passed} (${(passed/quickTests.length*100).toFixed(0)}%)`);
  console.log(`失败: ${failed}`);
  
  // 响应时间分析
  const successfulTests = results.filter(r => r.success);
  if (successfulTests.length > 0) {
    const times = successfulTests.map(r => r.responseTime);
    const avgTime = times.reduce((a, b) => a + b) / times.length;
    console.log(`\n平均响应时间: ${(avgTime/1000).toFixed(1)}秒`);
    
    if (avgTime > 30000) {
      console.log('⚠️  响应时间过长，可能是 AI 模型响应慢');
    }
  }
  
  // JSONFixer 分析
  console.log('\n💡 关键测试点分析:');
  results.forEach(r => {
    if (r.id === 'quick3' && r.success) {
      console.log('✅ URL处理: 通过（JSONFixer 正常工作）');
    }
    if (r.id === 'quick4' && r.success) {
      console.log('✅ 换行符处理: 通过');
    }
    if (r.id === 'quick5' && r.success) {
      console.log('✅ 特殊字符处理: 通过');
    }
  });
  
  if (passed === quickTests.length) {
    console.log('\n🎉 所有关键测试通过！系统稳定性良好。');
  } else {
    console.log('\n⚠️  部分测试失败，请检查服务器日志。');
  }
}

// 主函数
async function main() {
  console.log('检查服务器...');
  
  try {
    const response = await fetch('http://localhost:3000');
    if (!response.ok) throw new Error('Server not ready');
  } catch {
    console.error('❌ 服务器未运行！请先运行 npm run dev');
    process.exit(1);
  }
  
  console.log('✅ 服务器正常\n');
  
  await runQuickTest();
}

main().catch(console.error);
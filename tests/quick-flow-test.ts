#!/usr/bin/env ts-node

/**
 * 快速流程图测试
 * 用少量测试用例快速验证系统状态
 */

const quickTests = [
  {
    name: "简单测试",
    prompt: "创建一个用户登录系统"
  },
  {
    name: "英文测试",
    prompt: "Create a todo list app with CRUD operations"
  },
  {
    name: "复杂测试",
    prompt: "设计一个电商系统，包含：\n1. 用户注册/登录\n2. 商品浏览\n3. 购物车\n4. 订单支付\n5. 物流跟踪"
  },
  {
    name: "特殊字符",
    prompt: "创建一个代码编辑器，支持语法高亮(highlight.js)、代码补全<autocomplete>、Git集成"
  },
  {
    name: "长URL测试",  
    prompt: "构建一个API网关，需要转发请求到 https://api.example.com/v1/users/profile/settings/preferences/notifications/email/webhook/status 并处理响应"
  }
];

async function runQuickTest() {
  console.log('🚀 运行快速流程图测试...\n');
  
  let passed = 0;
  let failed = 0;
  
  for (const test of quickTests) {
    process.stdout.write(`测试: ${test.name}... `);
    
    try {
      const start = Date.now();
      const response = await fetch('http://localhost:3000/api/generate-flow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: test.prompt })
      });
      
      const time = Date.now() - start;
      
      if (response.ok) {
        const data = await response.json();
        if (data.nodes && data.edges) {
          console.log(`✅ (${data.nodes.length} 节点, ${time}ms)`);
          passed++;
        } else {
          console.log(`❌ 响应格式错误`);
          failed++;
        }
      } else {
        const error = await response.json();
        console.log(`❌ ${error.error}`);
        failed++;
      }
      
    } catch (error) {
      console.log(`❌ ${error instanceof Error ? error.message : '未知错误'}`);
      failed++;
    }
    
    // 短暂延迟
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log(`\n结果: ${passed}/${quickTests.length} 通过`);
  
  if (failed === 0) {
    console.log('✅ 所有测试通过！系统工作正常。');
  } else {
    console.log(`⚠️  ${failed} 个测试失败`);
  }
}

// 检查服务器是否运行
async function checkServer() {
  try {
    const response = await fetch('http://localhost:3000');
    return response.ok;
  } catch {
    return false;
  }
}

async function main() {
  console.log('检查服务器...');
  const serverRunning = await checkServer();
  
  if (!serverRunning) {
    console.error('❌ 服务器未运行！请先运行 npm run dev');
    process.exit(1);
  }
  
  await runQuickTest();
}

if (require.main === module) {
  main();
}
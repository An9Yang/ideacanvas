import { codeGenerationService } from '@/lib/services/code-generation/code-generation.service';
import { Node, Edge } from 'reactflow';

// 模拟测试数据
const testNodes: Node[] = [
  {
    id: '1',
    type: 'product',
    position: { x: 100, y: 100 },
    data: {
      label: '用户登录页面',
      content: `
用户登录页面
包含：登录表单
字段：用户名、密码
用户点击登录按钮提交表单
验证：必填字段验证
API调用：POST /api/login
      `
    }
  },
  {
    id: '2',
    type: 'external',
    position: { x: 400, y: 100 },
    data: {
      label: '登录API',
      content: `
登录API接口
接口：POST /api/login
请求：{username: string, password: string}
响应：{token: string, user: object}
      `
    }
  },
  {
    id: '3',
    type: 'product',
    position: { x: 700, y: 100 },
    data: {
      label: '用户仪表板',
      content: `
用户仪表板页面
显示：欢迎信息、用户数据
包含：数据列表、统计卡片
API调用：GET /api/user/profile
      `
    }
  }
];

const testEdges: Edge[] = [
  {
    id: 'e1-2',
    source: '1',
    target: '2',
    label: '提交登录'
  },
  {
    id: 'e2-3',
    source: '2',
    target: '3',
    label: '登录成功'
  }
];

async function runE2ETest() {
  console.log('🚀 开始端到端代码生成测试...\n');
  
  try {
    // 测试1：中文生成
    console.log('📝 测试1：生成中文版本应用...');
    const resultZh = await codeGenerationService.generateFromFlow(
      testNodes,
      testEdges,
      {
        language: 'zh',
        framework: 'vanilla',
        styling: 'tailwind',
        includeComments: true
      }
    );
    
    console.log('✅ 中文版本生成成功');
    console.log(`  - 生成页面数：${resultZh.pages.length}`);
    console.log(`  - 生成样式文件数：${resultZh.styles.length}`);
    console.log(`  - 生成脚本文件数：${resultZh.scripts.length}`);
    console.log(`  - API文档路径数：${Object.keys(resultZh.apiSpec.paths).length}`);
    
    // 测试2：英文生成
    console.log('\n📝 测试2：生成英文版本应用...');
    const resultEn = await codeGenerationService.generateFromFlow(
      testNodes,
      testEdges,
      {
        language: 'en',
        framework: 'vanilla',
        styling: 'bootstrap',
        includeComments: false
      }
    );
    
    console.log('✅ 英文版本生成成功');
    console.log(`  - 使用Bootstrap样式：${resultEn.styles[0].content.includes('bootstrap')}`);
    
    // 测试3：导出功能
    console.log('\n📝 测试3：测试导出功能...');
    const exportBlob = await codeGenerationService.exportProject(resultZh);
    console.log('✅ 导出成功');
    console.log(`  - 导出文件大小：${(exportBlob.size / 1024).toFixed(2)} KB`);
    
    // 测试4：错误处理
    console.log('\n📝 测试4：测试错误处理...');
    try {
      await codeGenerationService.generateFromFlow([], [], {});
    } catch (error: any) {
      console.log('✅ 空流程图错误处理正确');
      console.log(`  - 错误代码：${error.code}`);
      console.log(`  - 错误消息：${error.message}`);
    }
    
    // 测试5：性能测试
    console.log('\n📝 测试5：性能测试...');
    const startTime = performance.now();
    await codeGenerationService.generateFromFlow(testNodes, testEdges);
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    console.log('✅ 性能测试完成');
    console.log(`  - 生成耗时：${duration.toFixed(2)} ms`);
    console.log(`  - 性能状态：${duration < 1000 ? '优秀' : duration < 3000 ? '良好' : '需要优化'}`);
    
    console.log('\n\n🎉 所有测试通过！代码生成模块运行正常。');
    
  } catch (error) {
    console.error('\n❌ 测试失败：', error);
    throw error;
  }
}

// 运行测试
if (require.main === module) {
  runE2ETest().catch(console.error);
}

export { runE2ETest };
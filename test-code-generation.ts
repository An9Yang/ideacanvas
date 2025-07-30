import 'dotenv/config';
import { aiService } from './lib/services/ai-service';

async function testAIService() {
  console.log('=== 测试 AI 服务配置 ===\n');
  
  console.log('环境变量:');
  console.log('- Endpoint:', process.env.AZURE_OPENAI_ENDPOINT);
  console.log('- Model:', process.env.AZURE_OPENAI_DEPLOYMENT_NAME);
  console.log('- API Version:', process.env.AZURE_OPENAI_API_VERSION);
  console.log('- Has API Key:', !!process.env.AZURE_OPENAI_API_KEY);
  console.log('\n');

  // 测试1: 简单调用
  console.log('测试1: 简单的AI调用...');
  try {
    const response = await aiService.generateCompletion({
      prompt: '生成一个简单的HTML按钮代码',
      maxTokens: 1000  // o4-mini需要更多token
    });
    console.log('✅ 成功! 响应长度:', response.length);
    console.log('响应内容:', response.substring(0, 200));
  } catch (error: any) {
    console.error('❌ 失败:', error.message);
    if (error.response?.data) {
      console.error('详细错误:', JSON.stringify(error.response.data, null, 2));
    }
  }

  console.log('\n');

  // 测试2: 代码生成
  console.log('测试2: 生成完整代码...');
  try {
    const codePrompt = `生成一个简单的登录页面，包含：
1. 用户名输入框
2. 密码输入框
3. 登录按钮
4. 基本的CSS样式

请直接生成可运行的HTML代码。`;

    const response = await aiService.generateCompletion({
      prompt: codePrompt,
      maxTokens: 4000  // o4-mini需要更多token来生成完整代码
    });
    console.log('✅ 成功! 响应长度:', response.length);
    console.log('生成的代码预览:\n', response.substring(0, 300) + '...');
  } catch (error: any) {
    console.error('❌ 失败:', error.message);
  }

  console.log('\n=== 测试完成 ===');
}

// 测试API端点
async function testAPIEndpoint() {
  console.log('\n=== 测试代码生成API端点 ===\n');
  
  const testDocument = `用户管理系统
主要功能：
- 用户登录（邮箱和密码）
- 用户注册
- 查看用户列表
- 编辑用户信息`;

  try {
    const response = await fetch('http://localhost:3001/api/generate-code-ai', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        documentContent: testDocument,
        options: {
          language: 'zh',
          styling: 'custom',
          framework: 'vanilla'
        }
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('❌ API调用失败:', response.status, error);
    } else {
      const result = await response.json();
      console.log('✅ API调用成功!');
      console.log('生成的页面数:', result.pages?.length);
      console.log('生成的样式数:', result.styles?.length);
      console.log('生成的脚本数:', result.scripts?.length);
    }
  } catch (error: any) {
    console.error('❌ 网络错误:', error.message);
    console.log('提示: 确保开发服务器正在运行 (npm run dev)');
  }
}

// 运行测试
async function runAllTests() {
  await testAIService();
  
  // 检查是否有服务器运行
  try {
    const testResponse = await fetch('http://localhost:3001/');
    if (testResponse.ok) {
      await testAPIEndpoint();
    }
  } catch {
    console.log('\n注意: 开发服务器未运行，跳过API端点测试');
  }
}

runAllTests().catch(console.error);
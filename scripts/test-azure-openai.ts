const { AzureOpenAI } = require('openai');
require('dotenv').config();

async function testAzureOpenAI() {
  try {
    console.log('测试 Azure OpenAI 配置...');
    console.log('环境变量：', {
      endpoint: process.env.AZURE_OPENAI_ENDPOINT,
      deploymentName: process.env.AZURE_OPENAI_DEPLOYMENT_NAME,
      apiVersion: '2024-02-15-preview',
      hasApiKey: !!process.env.AZURE_OPENAI_API_KEY
    });

    // 初始化客户端
    const client = new AzureOpenAI({
      apiKey: process.env.AZURE_OPENAI_API_KEY,
      endpoint: process.env.AZURE_OPENAI_ENDPOINT,
      deployment: process.env.AZURE_OPENAI_DEPLOYMENT_NAME,
      apiVersion: '2024-02-15-preview'
    });

    // 测试简单的补全请求
    console.log('发送测试请求...');
    const response = await client.chat.completions.create({
      model: process.env.AZURE_OPENAI_DEPLOYMENT_NAME || '',
      messages: [
        { role: 'user', content: '你好，这是一个测试消息。请回复"测试成功"。' }
      ],
      temperature: 0.7,
      max_tokens: 50
    });

    console.log('\n测试结果：');
    console.log('状态：✅ 成功');
    console.log('响应：', response.choices[0].message?.content);
  } catch (error) {
    console.log('\n测试结果：');
    console.log('状态：❌ 失败');
    
    // 检查是否是 API 错误
    const errorMessage = error.message || '未知错误';
    const isAuthError = errorMessage.includes('401') || 
                       errorMessage.includes('authentication') || 
                       errorMessage.includes('key') || 
                       errorMessage.includes('credentials');

    console.log('错误类型：', isAuthError ? '认证错误' : '其他错误');
    console.log('错误信息：', errorMessage);
    console.log('\n详细错误：', error);
  }
}

testAzureOpenAI();

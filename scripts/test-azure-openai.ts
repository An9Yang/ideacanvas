const { OpenAIClient, AzureKeyCredential } = require('@azure/openai');
require('dotenv').config();

async function testAzureOpenAI() {
  try {
    console.log('测试 Azure OpenAI 配置...');
    console.log('环境变量：', {
      endpoint: process.env.AZURE_OPENAI_ENDPOINT,
      deploymentName: process.env.AZURE_OPENAI_DEPLOYMENT_NAME,
      apiVersion: '2023-12-01-preview',
      hasApiKey: !!process.env.AZURE_OPENAI_API_KEY
    });

    // 初始化客户端
    const client = new OpenAIClient(
      process.env.AZURE_OPENAI_ENDPOINT,
      new AzureKeyCredential(process.env.AZURE_OPENAI_API_KEY)
    );

    // 测试简单的补全请求
    console.log('发送测试请求...');
    const response = await client.getChatCompletions(
      process.env.AZURE_OPENAI_DEPLOYMENT_NAME,
      [
        { role: 'user', content: '你好，这是一个测试消息。请回复"测试成功"。' }
      ],
      {
        temperature: 0.7,
        maxTokens: 50
      }
    );

    console.log('\n测试结果：');
    console.log('状态：✅ 成功');
    console.log('响应：', response.choices[0].message?.content);
  } catch (error) {
    console.log('\n测试结果：');
    console.log('状态：❌ 失败');
    console.log('错误信息：', error.message);
    console.log('\n详细错误：', error);
  }
}

testAzureOpenAI();

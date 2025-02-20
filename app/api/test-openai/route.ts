import { NextResponse } from 'next/server';
import { OpenAIClient, AzureKeyCredential } from '@azure/openai';

export async function GET() {
  try {
    console.log('测试 Azure OpenAI 配置...');
    
    // 使用硬编码的配置进行测试
    const endpoint = 'https://indieapp.openai.azure.com';
    const apiKey = process.env.AZURE_OPENAI_API_KEY;
    const deploymentName = 'o3-mini';
    
    // 验证配置
    if (!endpoint?.startsWith('https://')) {
      throw new Error('Endpoint 必须以 https:// 开头');
    }
    
    if (!apiKey) {
      throw new Error('API 密钥不能为空');
    }
    
    if (!deploymentName) {
      throw new Error('部署名称不能为空');
    }

    // 使用截图中的 API 版本
    const apiVersion = '2024-12-01-preview';
    
    console.log('开始测试使用以下配置:', {
      endpoint,
      deploymentName,
      apiVersion,
      apiKeyLength: apiKey?.length
    });
    
    // 构建完整的端点 URL
    const fullEndpoint = `${endpoint}/openai/deployments/${deploymentName}/chat/completions?api-version=${apiVersion}`;
    
    // 检查是否有双斜杠
    if (fullEndpoint.includes('//openai')) {
      throw new Error('端点 URL 中包含双斜杠，请检查配置');
    }
    
    // 打印配置信息
    const config = {
      endpoint,
      fullEndpoint,
      deploymentName,
      apiVersion,
      hasApiKey: true,
      apiKeyLength: apiKey.length
    };
    
    console.log('配置信息:', {
      ...config,
      apiKeyPrefix: apiKey.substring(0, 4) + '...',
      apiKeySuffix: '...' + apiKey.substring(apiKey.length - 4)
    });

    // 初始化客户端
    const client = new OpenAIClient(
      endpoint,
      new AzureKeyCredential(apiKey),
      { apiVersion }
    );

    // 发送测试请求
    const response = await client.getChatCompletions(
      process.env.AZURE_OPENAI_DEPLOYMENT_NAME!,
      [
        { role: 'user', content: '你好，这是一个测试消息。请回复"测试成功"。' }
      ]
    );

    return NextResponse.json({
      status: 'success',
      config: {
        ...config,
        apiKey: '***'
      },
      response: response.choices[0].message?.content
    });
  } catch (error: any) {
    console.error('测试失败:', error);
    return NextResponse.json({
      status: 'error',
      config: {
        endpoint: process.env.AZURE_OPENAI_ENDPOINT,
        deploymentName: process.env.AZURE_OPENAI_DEPLOYMENT_NAME,
        apiVersion: '2023-12-01-preview',
        hasApiKey: !!process.env.AZURE_OPENAI_API_KEY
      },
      error: error.message
    }, { status: 500 });
  }
}

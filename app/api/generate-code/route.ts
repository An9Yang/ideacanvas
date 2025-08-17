import { NextRequest, NextResponse } from 'next/server';
import { aiClient } from '@/lib/services/ai-client';
import { configService } from '@/lib/config';

export async function POST(request: NextRequest) {
  console.log('收到代码生成请求');
  
  try {
    const body = await request.json();
    console.log('请求参数:', { 
      hasDocumentContent: !!body.documentContent,
      contentLength: body.documentContent?.length,
      options: body.options 
    });
    
    const { documentContent, options } = body;
    
    if (!documentContent) {
      console.error('缺少文档内容');
      return NextResponse.json(
        { error: '缺少文档内容' },
        { status: 400 }
      );
    }

    const systemPrompt = `You are an expert web developer. Based on the project document provided, generate a complete web application with HTML, CSS, and JavaScript.

Requirements:
1. Generate clean, modern, responsive HTML
2. Use ${options?.styling === 'tailwind' ? 'Tailwind CSS' : options?.styling === 'bootstrap' ? 'Bootstrap' : 'custom CSS'} for styling
3. Include interactive JavaScript for user interactions
4. Generate proper API endpoints based on the flow
5. Use ${options?.language === 'zh' ? 'Chinese' : 'English'} for UI text
6. Include proper error handling and validation
7. The code should be production-ready and follow best practices

Return the code in the following JSON format:
{
  "pages": [
    {
      "name": "page-name",
      "route": "/route",
      "html": "complete HTML content with proper DOCTYPE, head, and body",
      "title": "Page Title"
    }
  ],
  "styles": [
    {
      "name": "styles.css",
      "content": "/* Complete CSS content */"
    }
  ],
  "scripts": [
    {
      "name": "app.js",
      "content": "// Complete JavaScript content"
    }
  ],
  "apiEndpoints": [
    {
      "method": "GET|POST|PUT|DELETE",
      "path": "/api/endpoint",
      "description": "API description",
      "requestBody": {},
      "responseBody": {}
    }
  ]
}`;

    const client = aiClient.getClient();
    const params = configService.getCompletionParams();
    const azureConfig = configService.getAzureConfig();
    
    console.log('使用AI配置:', {
      deploymentName: azureConfig.deploymentName,
      endpoint: azureConfig.endpoint,
      apiVersion: azureConfig.apiVersion,
      maxTokens: params.MAX_TOKENS
    });
    
    try {
      const response = await client.chat.completions.create({
        model: azureConfig.deploymentName,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Project Document:\n\n${documentContent}\n\nGenerate a complete web application based on this project document.` }
        ],
        temperature: 0.7,
        max_tokens: Math.min(params.MAX_TOKENS, 4096), // 限制token数量
        // 移除 response_format，因为o3可能不支持
        // response_format: { type: "json_object" }
      });
      
      console.log('AI响应成功');

      const generatedContent = response.choices[0]?.message?.content;
      if (!generatedContent) {
        throw new Error('AI没有返回有效内容');
      }

      console.log('AI返回内容长度:', generatedContent.length);

      // 解析JSON响应
      let generatedCode;
      try {
        // 尝试找到JSON部分
        const jsonMatch = generatedContent.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          generatedCode = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('无法在响应中找到JSON');
        }
      } catch (parseError) {
        console.error('JSON解析失败:', parseError);
        console.log('原始响应前500字符:', generatedContent.substring(0, 500));
        throw new Error('解析AI响应失败');
      }
      
      return NextResponse.json(generatedCode);
    } catch (aiError: any) {
      console.error('AI调用失败:', aiError);
      throw aiError;
    }
  } catch (error: any) {
    console.error('Code generation error:', error);
    return NextResponse.json(
      { error: error.message || '代码生成失败' },
      { status: 500 }
    );
  }
}
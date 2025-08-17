import { NextRequest, NextResponse } from 'next/server';
import { aiService } from '@/lib/services/ai-service';

export async function POST(request: NextRequest) {
  console.log('收到简化代码生成请求');
  
  try {
    const body = await request.json();
    const { documentContent, options } = body;
    
    console.log('文档内容长度:', documentContent?.length);
    console.log('选项:', options);
    
    if (!documentContent) {
      return NextResponse.json(
        { error: '缺少文档内容' },
        { status: 400 }
      );
    }

    // 构建智能的提示词
    const prompt = `你是一个专业的全栈开发工程师。基于下面的项目文档，生成一个完整的Web应用。

项目文档：
${documentContent}

要求：
1. 根据文档中的功能描述，生成对应的HTML页面
2. 如果提到用户登录/注册，生成完整的表单和验证
3. 如果提到数据展示，生成列表或表格组件
4. 如果提到API，生成对应的JavaScript调用代码
5. 使用现代化的CSS样式
6. 添加必要的交互逻辑

请用${options?.language === 'zh' ? '中文' : '英文'}生成所有用户界面文本。

重要：直接输出可运行的HTML/CSS/JavaScript代码，每个功能都要有具体实现。`;

    console.log('调用AI服务生成代码...');
    console.log('提示词长度:', prompt.length);
    
    let generatedContent = '';
    try {
      const result = await aiService.generateCompletion({
        prompt,
        maxTokens: 1500  // o3模型的合理token数量
      });
      
      generatedContent = result || '';
      
      console.log('AI响应成功，内容长度:', generatedContent?.length);
    } catch (aiError: any) {
      console.error('AI服务调用失败:', aiError);
      // 如果AI调用失败，返回一个基础的模板
      generatedContent = `
<div class="app-container">
  <h2>${options?.language === 'zh' ? '应用功能' : 'App Features'}</h2>
  <p>${options?.language === 'zh' ? '基于项目文档生成的应用内容' : 'App content based on project document'}</p>
  <div class="features">
    ${documentContent.substring(0, 500)}...
  </div>
</div>`;
    }

    // 手动构建响应格式
    const result = {
      pages: [{
        name: 'index',
        route: '/',
        html: `<!DOCTYPE html>
<html lang="${options?.language === 'zh' ? 'zh-CN' : 'en'}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Generated App</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <div class="container">
        <h1>${options?.language === 'zh' ? '生成的应用' : 'Generated App'}</h1>
        <div class="content">
            ${generatedContent}
        </div>
    </div>
    <script src="app.js"></script>
</body>
</html>`
      }],
      styles: [{
        name: 'styles.css',
        content: `/* Generated Styles */
body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    margin: 0;
    padding: 0;
    background: #f5f5f5;
}
.container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
}
h1 {
    color: #333;
    margin-bottom: 2rem;
}
.content {
    background: white;
    padding: 2rem;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}`
      }],
      scripts: [{
        name: 'app.js',
        content: `// Generated JavaScript
console.log('App initialized');

// Add your app logic here
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded');
});`
      }],
      apiEndpoints: []
    };
    
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Code generation error:', error);
    return NextResponse.json(
      { error: error.message || '代码生成失败' },
      { status: 500 }
    );
  }
}
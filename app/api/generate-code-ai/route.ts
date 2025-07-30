import { NextRequest, NextResponse } from 'next/server';
import { aiService } from '@/lib/services/ai-service';

// 解析文档内容，提取关键信息
function parseDocumentContent(content: string) {
  const lines = content.split('\n');
  const features: string[] = [];
  const apis: string[] = [];
  let projectName = '';
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // 提取项目名称
    if (i === 0 && line) {
      projectName = line.replace(/[：:。.]/g, '');
    }
    
    // 提取功能
    if (line.startsWith('-') || line.startsWith('•')) {
      features.push(line.substring(1).trim());
    }
    
    // 提取API
    if (line.toLowerCase().includes('api') || line.includes('接口')) {
      apis.push(line);
    }
  }
  
  return { projectName, features, apis };
}

export async function POST(request: NextRequest) {
  console.log('[AI代码生成] 开始处理请求');
  
  try {
    const body = await request.json();
    const { documentContent, options } = body;
    
    if (!documentContent) {
      return NextResponse.json(
        { error: '缺少文档内容' },
        { status: 400 }
      );
    }

    const { projectName, features, apis } = parseDocumentContent(documentContent);
    console.log('[AI代码生成] 解析结果:', { projectName, featuresCount: features.length, apisCount: apis.length });

    // 构建详细的提示词
    const prompt = `生成一个完整的Web应用代码。

项目名称：${projectName || '智能应用'}
主要功能：
${features.map((f, i) => `${i + 1}. ${f}`).join('\n')}

API接口：
${apis.length > 0 ? apis.join('\n') : '暂无API描述'}

生成要求：
1. 为每个功能创建对应的UI组件
2. 使用现代化的设计风格
3. 包含完整的交互逻辑
4. 如果有登录功能，创建完整的登录表单
5. 如果有数据管理，创建CRUD界面
6. 使用${options?.language === 'zh' ? '中文' : '英文'}界面

请生成一个完整的单页应用，包含所有功能的实现。`;

    console.log('[AI代码生成] 调用AI服务...');
    
    let aiGeneratedCode = '';
    try {
      aiGeneratedCode = await aiService.generateCompletion({
        prompt,
        maxTokens: 8000  // 给足够的token来生成完整代码
      });
      console.log('[AI代码生成] AI响应成功，长度:', aiGeneratedCode.length);
    } catch (aiError: any) {
      console.error('[AI代码生成] AI调用失败:', aiError);
      throw aiError;
    }

    // 构建完整的应用代码
    const htmlContent = `<!DOCTYPE html>
<html lang="${options?.language === 'zh' ? 'zh-CN' : 'en'}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${projectName || 'Generated App'}</title>
    <style>
        /* 基础样式 */
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            background: #f5f5f5;
        }
        .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
        
        /* 导航栏 */
        nav { background: #333; color: white; padding: 1rem 0; }
        nav h1 { display: inline-block; margin: 0 2rem 0 0; }
        nav a { color: white; text-decoration: none; margin: 0 1rem; }
        nav a:hover { opacity: 0.8; }
        
        /* 表单样式 */
        .form-container { background: white; padding: 2rem; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); max-width: 400px; margin: 2rem auto; }
        .form-group { margin-bottom: 1rem; }
        label { display: block; margin-bottom: 0.5rem; font-weight: 500; }
        input, select, textarea { width: 100%; padding: 0.75rem; border: 1px solid #ddd; border-radius: 4px; font-size: 1rem; }
        button { background: #007bff; color: white; padding: 0.75rem 1.5rem; border: none; border-radius: 4px; cursor: pointer; font-size: 1rem; }
        button:hover { background: #0056b3; }
        
        /* 列表样式 */
        .list-container { background: white; padding: 2rem; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); margin: 2rem 0; }
        .list-item { padding: 1rem; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center; }
        .list-item:last-child { border-bottom: none; }
        
        /* 卡片样式 */
        .card { background: white; padding: 1.5rem; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); margin: 1rem 0; }
        .card h3 { margin-bottom: 1rem; color: #333; }
        
        /* 网格布局 */
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 2rem; margin: 2rem 0; }
        
        /* 响应式 */
        @media (max-width: 768px) {
            .container { padding: 10px; }
            nav h1 { display: block; margin-bottom: 1rem; }
            .grid { grid-template-columns: 1fr; }
        }
    </style>
</head>
<body>
    <nav>
        <div class="container">
            <h1>${projectName || 'My App'}</h1>
            <a href="#home">${options?.language === 'zh' ? '首页' : 'Home'}</a>
            ${features.some(f => f.includes('登录') || f.includes('login')) ? 
              `<a href="#login">${options?.language === 'zh' ? '登录' : 'Login'}</a>` : ''}
            ${features.length > 0 ? 
              `<a href="#features">${options?.language === 'zh' ? '功能' : 'Features'}</a>` : ''}
        </div>
    </nav>
    
    <div class="container">
        <div id="app">
            <!-- AI生成的内容将插入这里 -->
            ${aiGeneratedCode}
        </div>
    </div>
    
    <script>
        // 基础JavaScript功能
        console.log('应用已加载');
        
        // 表单处理
        document.addEventListener('DOMContentLoaded', function() {
            const forms = document.querySelectorAll('form');
            forms.forEach(form => {
                form.addEventListener('submit', function(e) {
                    e.preventDefault();
                    console.log('表单提交:', new FormData(form));
                    alert('${options?.language === 'zh' ? '功能演示：表单已提交' : 'Demo: Form submitted'}');
                });
            });
            
            // 按钮点击处理
            const buttons = document.querySelectorAll('button[data-action]');
            buttons.forEach(btn => {
                btn.addEventListener('click', function() {
                    const action = this.getAttribute('data-action');
                    console.log('执行操作:', action);
                    alert('${options?.language === 'zh' ? '功能演示：' : 'Demo: '}' + action);
                });
            });
        });
        
        // 简单的路由
        function showSection(sectionId) {
            document.querySelectorAll('.section').forEach(s => s.style.display = 'none');
            const section = document.getElementById(sectionId);
            if (section) section.style.display = 'block';
        }
        
        // API模拟
        const mockAPI = {
            async get(endpoint) {
                console.log('GET', endpoint);
                return { success: true, data: [] };
            },
            async post(endpoint, data) {
                console.log('POST', endpoint, data);
                return { success: true, data: { id: Date.now() } };
            }
        };
    </script>
</body>
</html>`;

    // 返回结果
    const result = {
      pages: [{
        name: 'index',
        route: '/',
        html: htmlContent
      }],
      styles: [{
        name: 'styles.css',
        content: '/* 样式已内联到HTML中 */'
      }],
      scripts: [{
        name: 'app.js',
        content: '// JavaScript已内联到HTML中'
      }],
      apiEndpoints: apis.map((api, index) => ({
        method: 'GET',
        path: `/api/endpoint${index + 1}`,
        description: api
      }))
    };
    
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[AI代码生成] 错误:', error);
    return NextResponse.json(
      { error: error.message || '代码生成失败' },
      { status: 500 }
    );
  }
}
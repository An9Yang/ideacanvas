import { NextRequest, NextResponse } from 'next/server';
import { aiService } from '@/lib/services/ai-service';

// 解析文档内容，提取关键信息
function parseDocumentContent(content: string) {
  const lines = content.split('\n');
  const features: string[] = [];
  const apis: string[] = [];
  let projectName = '';
  
  // 更智能的解析逻辑
  let foundProjectName = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // 查找项目名称（可能在任何位置）
    if (!foundProjectName) {
      if (line.includes('项目名称') || line.includes('Project Name') || 
          line.includes('项目：') || line.includes('Project:') ||
          line.includes('应用名称') || line.includes('App Name')) {
        const colonIndex = line.indexOf(':') !== -1 ? line.indexOf(':') : line.indexOf('：');
        if (colonIndex !== -1) {
          projectName = line.substring(colonIndex + 1).trim();
          foundProjectName = true;
        }
      } else if (i === 0 && !line.startsWith('-') && !line.startsWith('•') && 
                 !line.toLowerCase().includes('requirement') && 
                 !line.toLowerCase().includes('需求')) {
        // 如果第一行不是列表项且不包含"需求"等词，可能是项目名
        projectName = line.replace(/[：:。.]/g, '');
        foundProjectName = true;
      }
    }
    
    // 提取功能列表
    if (line.startsWith('-') || line.startsWith('•') || 
        line.match(/^\d+\.\s/) || line.match(/^[一二三四五六七八九十]\、/)) {
      const cleanedLine = line.replace(/^[-•\d\.一二三四五六七八九十\、]\s*/, '');
      if (cleanedLine && !cleanedLine.toLowerCase().includes('api')) {
        features.push(cleanedLine);
      }
    }
    
    // 提取API
    if (line.toLowerCase().includes('api') || line.includes('接口') || 
        line.includes('endpoint') || line.includes('端点')) {
      if (line.includes(':') || line.includes('：')) {
        apis.push(line);
      }
    }
  }
  
  // 如果还没找到项目名，使用默认值或从内容推断
  if (!projectName) {
    if (content.includes('电商') || content.includes('e-commerce')) {
      projectName = '电子商务系统';
    } else if (content.includes('任务') || content.includes('task')) {
      projectName = '任务管理系统';
    } else if (content.includes('博客') || content.includes('blog')) {
      projectName = '博客系统';
    } else {
      projectName = 'Web应用系统';
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
    console.log('[AI代码生成] 解析结果:', { 
      projectName, 
      featuresCount: features.length, 
      apisCount: apis.length,
      documentLength: documentContent.length,
      features: features.slice(0, 3) // 显示前3个功能
    });

    // 构建详细的提示词 - 优化为专业的代码生成 prompt
    const systemPrompt = `You are an elite full-stack web developer with 15+ years of experience. Your task is to transform a flow diagram specification into a fully functional, production-ready web application.

YOUR CORE PRINCIPLES:
1. ACCURACY: Every feature mentioned in the flow MUST be implemented
2. COMPLETENESS: Generate ALL necessary UI components, interactions, and business logic
3. QUALITY: Write clean, maintainable, performant code following best practices
4. USER EXPERIENCE: Create intuitive, responsive, and visually appealing interfaces

CRITICAL REQUIREMENTS:
- READ the flow content CAREFULLY and implement EVERY feature mentioned
- DO NOT use placeholder text or mock data - create realistic, functional implementations
- DO NOT skip any functionality - if a feature is mentioned, it MUST work
- Generate COMPLETE HTML with inline CSS and JavaScript
- All code must be production-ready and error-free`;

    const prompt = `${systemPrompt}

PROJECT SPECIFICATION:
Project Name: ${projectName || 'Web Application'}
Features to Implement:
${features.map((f, i) => `${i + 1}. ${f} - This feature MUST be fully implemented with working UI and logic`).join('\n')}

API References (implement with realistic client-side simulation):
${apis.length > 0 ? apis.map(api => `- ${api}`).join('\n') : '- No specific APIs mentioned'}

IMPLEMENTATION REQUIREMENTS:
1. Language: Generate ALL UI text in ${options?.language === 'zh' ? 'Chinese (中文)' : 'English'}
2. Design: Use modern, professional design with ${options?.styling === 'tailwind' ? 'Tailwind CSS classes' : options?.styling === 'bootstrap' ? 'Bootstrap 5' : 'custom CSS'}
3. Functionality: Every feature must be FULLY FUNCTIONAL with:
   - Complete UI components
   - Form validation
   - Data persistence (localStorage)
   - Error handling
   - Loading states
   - Success feedback
4. For data management features:
   - Implement full CRUD operations
   - Use localStorage for persistence
   - Display data in tables/lists with sorting and filtering
   - Include edit/delete actions for each item
5. For authentication features:
   - Implement login/logout flow
   - Store auth state in localStorage
   - Protect authenticated routes
   - Show user info when logged in

OUTPUT FORMAT:
- Generate a COMPLETE HTML file including DOCTYPE, html, head, and body tags
- Include the project name in the <title> tag
- All CSS should be in a <style> tag in the <head>
- All JavaScript should be in <script> tags before the closing </body> tag
- DO NOT include any markdown, code blocks, or explanations
- Generate ONLY the complete HTML file content`;

    console.log('[AI代码生成] 调用AI服务...');
    
    let aiGeneratedCode = '';
    try {
      aiGeneratedCode = await aiService.generateCompletion({
        prompt,
        maxTokens: 100000  // o3 模型支持高达 100k tokens
      });
      console.log('[AI代码生成] AI响应成功，长度:', aiGeneratedCode.length);
      
      // 清理 AI 响应中的多余内容
      // 移除开头的 markdown 代码块标记
      aiGeneratedCode = aiGeneratedCode.replace(/^```html\s*\n?/i, '');
      aiGeneratedCode = aiGeneratedCode.replace(/\n?```\s*$/i, '');
      
      // 移除开头的单独 html 文字
      aiGeneratedCode = aiGeneratedCode.replace(/^html\s*\n?/i, '');
      
      // 确保以 <!DOCTYPE 开头
      if (!aiGeneratedCode.trim().startsWith('<!DOCTYPE')) {
        const doctypeIndex = aiGeneratedCode.indexOf('<!DOCTYPE');
        if (doctypeIndex > 0) {
          aiGeneratedCode = aiGeneratedCode.substring(doctypeIndex);
        }
      }
    } catch (aiError: any) {
      console.error('[AI代码生成] AI调用失败:', aiError);
      throw aiError;
    }

    // AI 已经生成了完整的 HTML，直接使用
    const htmlContent = aiGeneratedCode;

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
import { Node, Edge } from 'reactflow';
import JSZip from 'jszip';
import { 
  CodeGenerationService, 
  GenerationOptions, 
  GenerationResult,
  ParsedNode 
} from './types';
import { NodeParser } from './parsers/node-parser';
import { FlowAnalyzer } from './parsers/flow-analyzer';
import { HTMLGenerator } from './generators/html-generator';
import { CSSGenerator } from './generators/css-generator';
import { JSGenerator } from './generators/js-generator';
import { APIDocGenerator } from './generators/api-doc-generator';
import { indexTemplate } from './templates/page-templates';
import { CodeGenerationError, ErrorCodes, handleGenerationError } from './utils/error-handler';
import { PerformanceMonitor, memoize } from './utils/performance';
import { aiService } from '@/lib/services/ai-service';

export class CodeGenerationServiceImpl implements CodeGenerationService {
  private nodeParser: NodeParser;
  private flowAnalyzer: FlowAnalyzer;
  private htmlGenerator: HTMLGenerator;
  private cssGenerator: CSSGenerator;
  private jsGenerator: JSGenerator;
  private apiDocGenerator: APIDocGenerator;

  constructor() {
    this.nodeParser = new NodeParser();
    this.flowAnalyzer = new FlowAnalyzer();
    this.htmlGenerator = new HTMLGenerator();
    this.cssGenerator = new CSSGenerator();
    this.jsGenerator = new JSGenerator();
    this.apiDocGenerator = new APIDocGenerator();
  }

  async generateFromFlow(
    nodes: Node[],
    edges: Edge[],
    options: GenerationOptions = {
      language: 'zh',
      framework: 'vanilla',
      styling: 'tailwind',
      includeComments: true
    }
  ): Promise<GenerationResult> {
    const monitor = new PerformanceMonitor();
    monitor.mark('generation-start');

    try {
      // 验证输入
      if (!nodes || nodes.length === 0) {
        throw new CodeGenerationError(
          options.language === 'zh' ? '请先生成流程图' : 'Please generate a flow first',
          ErrorCodes.EMPTY_FLOW
        );
      }

      // 查找文档节点（绿色）或内容最丰富的节点
      let documentNode = nodes.find(node => node.type === 'document');
      
      // 如果没有文档节点，使用内容最丰富的节点
      if (!documentNode) {
        documentNode = nodes.reduce((best, node) => {
          const currentContent = node.data?.content || '';
          const bestContent = best?.data?.content || '';
          return currentContent.length > bestContent.length ? node : best;
        }, nodes[0]);
      }
      
      if (!documentNode || !documentNode.data?.content) {
        throw new CodeGenerationError(
          options.language === 'zh' ? '流程图中没有包含内容的节点' : 'No node with content found in the flow',
          ErrorCodes.EMPTY_FLOW
        );
      }

      monitor.mark('ai-generation-start');
      
      // 使用AI生成代码
      const systemPrompt = `You are an expert web developer. Based on the project document provided, generate a complete web application with HTML, CSS, and JavaScript.

Requirements:
1. Generate clean, modern, responsive HTML
2. Use ${options.styling === 'tailwind' ? 'Tailwind CSS' : options.styling === 'bootstrap' ? 'Bootstrap' : 'custom CSS'} for styling
3. Include interactive JavaScript for user interactions
4. Generate proper API endpoints based on the flow
5. Use ${options.language === 'zh' ? 'Chinese' : 'English'} for UI text
6. Include proper error handling and validation

Return the code in the following JSON format:
{
  "pages": [
    {
      "name": "page-name",
      "route": "/route",
      "html": "complete HTML content",
      "title": "Page Title"
    }
  ],
  "styles": [
    {
      "name": "styles.css",
      "content": "CSS content"
    }
  ],
  "scripts": [
    {
      "name": "app.js",
      "content": "JavaScript content"
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

      // 调用专门的代码生成API
      console.log('调用代码生成API，文档内容长度:', documentNode.data.content.length);
      
      // 调用AI生成真实代码
      const response = await fetch('/api/generate-code-ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          documentContent: documentNode.data.content,
          options: {
            language: options.language,
            styling: options.styling,
            framework: options.framework
          }
        }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API调用失败:', response.status, errorText);
        throw new CodeGenerationError(
          options.language === 'zh' 
            ? `代码生成API调用失败: ${response.status} ${errorText}` 
            : `Code generation API call failed: ${response.status} ${errorText}`,
          ErrorCodes.GENERATION_ERROR
        );
      }
      
      const aiResponse = await response.text();

      monitor.measure('ai-generation', 'ai-generation-start');

      // 解析AI生成的代码
      let generatedCode;
      try {
        generatedCode = JSON.parse(aiResponse);
      } catch (parseError) {
        // 尝试提取JSON部分
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/m);
        if (jsonMatch) {
          generatedCode = JSON.parse(jsonMatch[0]);
        } else {
          throw new CodeGenerationError(
            options.language === 'zh' ? 'AI生成的代码格式错误' : 'AI generated code format error',
            ErrorCodes.GENERATION_ERROR
          );
        }
      }

      // 转换AI生成的代码到标准格式
      const pages = generatedCode.pages || [];
      const styles = generatedCode.styles || [];
      const scripts = generatedCode.scripts || [];
      
      // 生成API文档
      const apiSpec = this.generateAPISpec(generatedCode.apiEndpoints || [], options);
      
      // 生成预览
      const preview = this.generatePreview(pages[0]);
      
      monitor.measure('total-generation', 'generation-start');
      
      if (process.env.NODE_ENV === 'development') {
        monitor.logReport();
      }
      
      return {
        pages: pages.map((page: any) => ({
          id: `page-${Date.now()}-${Math.random()}`,
          name: page.name,
          html: page.html,
          route: page.route,
          components: []
        })),
        styles,
        scripts,
        apiSpec,
        assets: [],
        preview
      };
    } catch (error) {
      console.error('Code generation failed:', error);
      const handledError = handleGenerationError(error, options.language);
      throw handledError;
    }
  }

  async previewPage(pageId: string): Promise<string> {
    // 实现页面预览逻辑
    return `<html><body><h1>Preview for ${pageId}</h1></body></html>`;
  }

  async exportProject(result: GenerationResult): Promise<Blob> {
    // 实现项目导出逻辑
    const zip = await this.createProjectZip(result);
    return new Blob([zip], { type: 'application/zip' });
  }

  // 使用memoize优化重复解析
  private parseNode = memoize(
    async (node: Node, language: 'zh' | 'en') => {
      return await this.nodeParser.parse(node, language);
    },
    (node, language) => `${node.id}-${language}-${node.data?.content}`
  );

  private async parseNodes(nodes: Node[], language: 'zh' | 'en'): Promise<ParsedNode[]> {
    const parsedNodes: ParsedNode[] = [];
    
    // 并行解析节点以提高性能
    const parsePromises = nodes.map(async (node) => {
      try {
        const parsed = await this.parseNode(node, language);
        if (parsed) {
          return parsed;
        }
      } catch (error) {
        console.warn(`Failed to parse node ${node.id}:`, error);
        return null;
      }
    });
    
    const results = await Promise.all(parsePromises);
    return results.filter((node): node is ParsedNode => node !== null);
  }

  private generatePreview(firstPage: any): string {
    if (!firstPage) {
      return '<html><body><h1>No pages generated</h1></body></html>';
    }
    
    // 创建一个自包含的预览HTML，不引用外部文件
    let previewHtml = firstPage.html;
    
    // 1. 替换外部CSS为内联样式
    previewHtml = previewHtml.replace(
      '<link rel="stylesheet" href="styles.css">',
      `<style>
        ${this.getPreviewStyles()}
      </style>`
    );
    
    // 2. 移除外部脚本引用和其他外部文件
    previewHtml = previewHtml.replace(/<script[^>]*src="[^"]*"[^>]*><\/script>/g, '');
    previewHtml = previewHtml.replace(/<link[^>]*href="components\.css"[^>]*>/g, '');
    
    // 3. 添加基础的内联JavaScript来处理表单和导航
    const inlineScript = `
      <script>
        // 基础的表单处理
        document.addEventListener('DOMContentLoaded', function() {
          const forms = document.querySelectorAll('form');
          forms.forEach(form => {
            form.addEventListener('submit', function(e) {
              e.preventDefault();
              alert('表单提交功能在预览中被禁用 / Form submission is disabled in preview');
            });
          });
          
          // 基础的导航处理
          const links = document.querySelectorAll('.nav-link');
          links.forEach(link => {
            link.addEventListener('click', function(e) {
              e.preventDefault();
              alert('导航功能在预览中被禁用 / Navigation is disabled in preview');
            });
          });
        });
      </script>
    `;
    
    // 在</body>前插入内联脚本
    previewHtml = previewHtml.replace('</body>', inlineScript + '</body>');
    
    return previewHtml;
  }
  
  private getPreviewStyles(): string {
    // 返回基础样式用于预览
    return `
      * { margin: 0; padding: 0; box-sizing: border-box; }
      :root {
        --primary-color: #3b82f6;
        --secondary-color: #6b7280;
        --light-color: #f3f4f6;
        --dark-color: #111827;
      }
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f9fafb; }
      .container { max-width: 1200px; margin: 0 auto; padding: 2rem; }
      .navigation { background-color: var(--dark-color); color: white; padding: 1rem 0; margin-bottom: 2rem; }
      .nav-brand { font-size: 1.5rem; font-weight: bold; padding: 0 2rem; }
      .main-content { padding: 2rem 0; }
      .page-title { text-align: center; margin-bottom: 2rem; color: var(--dark-color); }
      .form-component { background: white; padding: 2rem; border-radius: 0.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1); max-width: 400px; margin: 0 auto; }
      .form-component h3 { margin-bottom: 1.5rem; text-align: center; }
      .form-group { margin-bottom: 1.25rem; }
      .form-group label { display: block; margin-bottom: 0.5rem; font-weight: 500; color: #374151; font-size: 0.875rem; }
      .form-control { width: 100%; padding: 0.625rem 0.875rem; border: 1px solid #d1d5db; border-radius: 0.375rem; font-size: 1rem; }
      .btn { display: inline-block; padding: 0.75rem 1.5rem; border: none; border-radius: 0.375rem; font-size: 1rem; font-weight: 500; cursor: pointer; transition: all 0.3s; }
      .btn-primary { background-color: var(--primary-color); color: white; }
      .btn-primary:hover { background-color: #2563eb; }
      .btn-block { width: 100%; display: block; }
      .form-footer { text-align: center; margin-top: 1rem; }
      .link { color: var(--primary-color); font-size: 0.875rem; }
      .checkbox-label { display: flex; align-items: center; font-size: 0.875rem; }
      .checkbox-label input { margin-right: 0.5rem; }
    `;
  }

  private async createProjectZip(result: GenerationResult): Promise<ArrayBuffer> {
    const zip = new JSZip();
    
    // 创建index.html
    const indexHtml = indexTemplate(
      result.pages,
      result.pages[0]?.html.includes('zh-CN') ? 'zh' : 'en',
      this.detectStyling(result.styles)
    );
    zip.file('index.html', indexHtml);
    
    // 添加页面文件
    for (const page of result.pages) {
      const fileName = `${page.name}.html`;
      zip.file(fileName, page.html);
    }
    
    // 添加样式文件
    for (const style of result.styles) {
      zip.file(style.name, style.content);
    }
    
    // 添加脚本文件
    for (const script of result.scripts) {
      zip.file(script.name, script.content);
    }
    
    // 添加API文档
    if (result.apiSpec) {
      zip.file('api-documentation.json', JSON.stringify(result.apiSpec, null, 2));
      zip.file('api-documentation.html', this.generateAPIDocHTML(result.apiSpec));
    }
    
    // 添加README文件
    const readme = this.generateReadme(result);
    zip.file('README.md', readme);
    
    // 添加package.json
    const packageJson = this.generatePackageJson(result);
    zip.file('package.json', JSON.stringify(packageJson, null, 2));
    
    // 生成ZIP文件
    const content = await zip.generateAsync({ type: 'arraybuffer' });
    return content;
  }
  
  private detectStyling(styles: any[]): string {
    const mainStyle = styles.find(s => s.name === 'styles.css');
    if (!mainStyle) return 'custom';
    
    if (mainStyle.content.includes('tailwindcss')) return 'tailwind';
    if (mainStyle.content.includes('bootstrap')) return 'bootstrap';
    return 'custom';
  }
  
  private generateAPIDocHTML(apiSpec: any): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${apiSpec.info.title}</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@4/swagger-ui.css">
</head>
<body>
    <div id="swagger-ui"></div>
    <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@4/swagger-ui-bundle.js"></script>
    <script>
        window.onload = function() {
            SwaggerUIBundle({
                spec: ${JSON.stringify(apiSpec)},
                dom_id: '#swagger-ui',
                presets: [
                    SwaggerUIBundle.presets.apis,
                    SwaggerUIBundle.SwaggerUIStandalonePreset
                ],
                layout: "BaseLayout"
            });
        }
    </script>
</body>
</html>`;
  }
  
  private generateReadme(result: GenerationResult): string {
    const language = result.pages[0]?.html.includes('zh-CN') ? 'zh' : 'en';
    
    if (language === 'zh') {
      return `# 生成的Web应用

此项目由 IdeaCanvas 自动生成。

## 项目结构

- \`index.html\` - 应用首页
- \`styles.css\` - 主样式文件
- \`app.js\` - 主JavaScript文件
- \`api-client.js\` - API客户端
- \`utils.js\` - 工具函数
- \`api-documentation.html\` - API文档

## 运行项目

1. 在支持的Web服务器中打开项目
2. 或者使用本地服务器：
   \`\`\`bash
   npx serve .
   \`\`\`

## 页面列表

${result.pages.map(p => `- ${p.name} (${p.route})`).join('\n')}

## API端点

查看 \`api-documentation.html\` 获取完整的API文档。

---
由 IdeaCanvas 生成
`;
    }
    
    return `# Generated Web Application

This project was automatically generated by IdeaCanvas.

## Project Structure

- \`index.html\` - Application homepage
- \`styles.css\` - Main stylesheet
- \`app.js\` - Main JavaScript file
- \`api-client.js\` - API client
- \`utils.js\` - Utility functions
- \`api-documentation.html\` - API documentation

## Running the Project

1. Open the project in a web server
2. Or use a local server:
   \`\`\`bash
   npx serve .
   \`\`\`

## Pages

${result.pages.map(p => `- ${p.name} (${p.route})`).join('\n')}

## API Endpoints

See \`api-documentation.html\` for complete API documentation.

---
Generated by IdeaCanvas
`;
  }
  
  private generatePackageJson(result: GenerationResult): any {
    return {
      name: 'ideacanvas-generated-app',
      version: '1.0.0',
      description: 'Web application generated by IdeaCanvas',
      scripts: {
        start: 'serve .',
        dev: 'serve -p 3000'
      },
      keywords: ['ideacanvas', 'generated'],
      author: 'IdeaCanvas',
      license: 'MIT',
      devDependencies: {
        serve: '^14.0.0'
      }
    };
  }
  
  private generateAPISpec(endpoints: any[], options: GenerationOptions): any {
    if (!endpoints || endpoints.length === 0) {
      return null;
    }
    
    return {
      openapi: '3.0.0',
      info: {
        title: options.language === 'zh' ? '生成的API文档' : 'Generated API Documentation',
        version: '1.0.0',
        description: options.language === 'zh' ? '由IdeaCanvas自动生成' : 'Generated by IdeaCanvas'
      },
      servers: [
        {
          url: 'http://localhost:3000',
          description: options.language === 'zh' ? '本地开发服务器' : 'Local development server'
        }
      ],
      paths: endpoints.reduce((paths, endpoint) => {
        paths[endpoint.path] = {
          [endpoint.method.toLowerCase()]: {
            summary: endpoint.description,
            requestBody: endpoint.requestBody ? {
              required: true,
              content: {
                'application/json': {
                  schema: endpoint.requestBody
                }
              }
            } : undefined,
            responses: {
              '200': {
                description: 'Success',
                content: {
                  'application/json': {
                    schema: endpoint.responseBody || { type: 'object' }
                  }
                }
              }
            }
          }
        };
        return paths;
      }, {})
    };
  }
}

// 导出单例实例
export const codeGenerationService = new CodeGenerationServiceImpl();
import { NextResponse } from 'next/server';
import { OpenAIClient, AzureKeyCredential } from '@azure/openai';
import { NodeType } from '@/lib/types/flow';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const preferredRegion = 'auto';

const SYSTEM_PROMPT = `你是一个专业的产品设计助手。根据用户的需求，生成一个完整的产品流程图。这个流程图将作为 AI coder agent 执行的 prompt，用于自动生成对应的页面和功能。请严格按照以下规则输出数据，且返回的 JSON 格式必须完全合法、完整，不得使用省略号或不完整描述，所有字符串均使用英文双引号。

1. 输出必须是一个合法的 JSON 对象，包含两个数组字段：nodes 和 edges。

2. 每个节点（nodes 数组中的对象）必须包含以下字段：
   - type：节点类型，取值必须为 "product"（产品功能/页面）、"external"（外部资源/服务）或 "context"（上下文信息）。
   - title：节点标题，简短且唯一的描述。
   - content：节点内容，必须是一个详细描述，用于指导开发者实现该页面或功能。描述内容必须包括：
       a) 页面描述：对页面或功能的总体介绍、目的和业务逻辑说明。
       b) UI 组件：详细描述页面布局、响应式设计要求及核心组件（如按钮、输入框、列表等）的类型、位置、样式、状态和交互细节。
       c) 数据结构：输入数据和输出数据的字段、类型、验证规则和默认值。
       d) 交互逻辑：用户操作流程、跳转条件、数据传递、状态管理及异常处理方案。
       e) API 集成：涉及的接口路径、请求方法、参数格式及响应处理流程。
       f) 性能优化：包括懒加载、缓存策略及防抖/节流等优化措施。
       g) 扩展性设计：如支持配置项、主题和国际化等要求。
   - position：节点位置，必须是一个包含 x 和 y 数值的对象。主流程节点从左到右排列，每个主要步骤间距600像素；第一行从 y=200 开始，每行间距300像素；上下文节点必须在最上方，外部服务节点必须在最右侧；确保各节点之间间距至少300像素且不重叠交叉。

3. 每个边（edges 数组中的对象）必须包含以下字段：
   - source：源节点的 title。
   - target：目标节点的 title。
   - description：详细描述两节点之间的关系，包括：
       a) 跳转触发：触发条件和触发方式（自动或用户操作）。
       b) 数据传递：需要传递的数据、数据格式和处理方式。
       c) 状态变化：源节点与目标节点的状态变化描述。
       d) 异常处理：可能的异常情况及回退策略。

请确保每个节点的 content 部分都尽可能详细，以便后续作为 AI coder agent 的输入 prompt 完整地描述页面和功能设计。以下是示例格式：

{
  "nodes": [
    {
      "type": "context",
      "title": "项目背景",
      "content": "详细描述项目背景，说明用户需求、目标和业务场景，为整个系统设计提供上下文信息。",
      "position": { "x": 200, "y": 200 }
    },
    {
      "type": "product",
      "title": "用户数据输入",
      "content": "详细描述页面设计：\n1. 页面描述：介绍页面的主要功能，如收集用户健康指标。\n2. UI组件：采用单列垂直布局，顶部展示步骤指引，主体为表单模块；输入框用于录入身高、体重，采用圆角设计、不同状态提示；下拉选择器用于选择过敏源和口味偏好，支持搜索功能。\n3. 数据结构：输入数据包括身高（数字）、体重（数字）、过敏源（字符串列表）；验证规则为非空及合理范围。\n4. 交互逻辑：用户填写数据后，点击提交按钮触发数据校验与保存，错误时显示提示信息。\n5. API 集成：集成 /api/saveUserData 接口，使用 POST 请求提交数据。\n6. 性能优化：采用懒加载表单模块，优化响应速度。\n7. 扩展性设计：支持自定义表单字段和国际化配置。",
      "position": { "x": 800, "y": 200 }
    }
  ],
  "edges": [
    {
      "source": "项目背景",
      "target": "用户数据输入",
      "description": "当项目背景描述完毕后，系统自动跳转到用户数据输入页面，传递用户基础信息并初始化页面状态。"
    }
  ]
}`;

function fixInvalidJSON(jsonStr: string): string {
  // 替换中文全角引号为英文双引号
  jsonStr = jsonStr.replace(/“|”/g, '"');
  // 将多余的冒号 (如 "类型":: ) 替换为单个冒号
  jsonStr = jsonStr.replace(/":\s*:/g, '":');
  // 去除省略号
  jsonStr = jsonStr.replace(/\.\.\./g, '');
  return jsonStr;
}

// 初始化 Azure OpenAI 客户端
const endpoint = 'https://indieapp.openai.azure.com';
const apiKey = process.env.AZURE_OPENAI_API_KEY!;
const deploymentName = 'o3-mini';
const apiVersion = '2024-12-01-preview';

// 打印配置信息
console.log('Azure OpenAI Configuration:', {
  endpoint: endpoint?.replace(/\/+$/, ''),
  deploymentName,
  apiVersion,
  apiKey: '***'
});

// 初始化客户端
const client = new OpenAIClient(
  endpoint,
  new AzureKeyCredential(apiKey)
);

interface GeneratedNode {
  type: NodeType;
  title: string;
  content: string;
  position: { x: number; y: number };
}

interface GeneratedEdge {
  source: string;
  target: string;
}

interface GeneratedFlow {
  nodes: GeneratedNode[];
  edges: GeneratedEdge[];
}

export async function POST(request: Request) {
  try {
    // 验证环境变量
    const requiredEnvVars = {
      AZURE_OPENAI_ENDPOINT: process.env.AZURE_OPENAI_ENDPOINT,
      AZURE_OPENAI_API_KEY: process.env.AZURE_OPENAI_API_KEY,
      AZURE_OPENAI_DEPLOYMENT_NAME: process.env.AZURE_OPENAI_DEPLOYMENT_NAME,
      AZURE_OPENAI_API_VERSION: process.env.AZURE_OPENAI_API_VERSION
    };

    console.log('Environment variables:', {
      ...requiredEnvVars,
      AZURE_OPENAI_API_KEY: requiredEnvVars.AZURE_OPENAI_API_KEY ? '***' : undefined
    });

    const missingVars = Object.entries(requiredEnvVars)
      .filter(([_, value]) => !value)
      .map(([key]) => key);

    if (missingVars.length > 0) {
      const error = `Missing required environment variables: ${missingVars.join(', ')}`;
      console.error(error);
      return NextResponse.json({ error }, { status: 500 });
    }

    // 解析请求体
    const body = await request.json().catch((error) => {
      console.error('Error parsing request body:', error);
      return null;
    });

    if (!body?.prompt) {
      return NextResponse.json(
        { error: 'Missing prompt in request body' },
        { status: 400 }
      );
    }

    const { prompt } = body;

    // 调用 Azure OpenAI
    console.log('Generating flow for prompt:', prompt);
    // 调试信息
    console.log('API Configuration:', {
      endpoint: process.env.AZURE_OPENAI_ENDPOINT,
      deploymentName: process.env.AZURE_OPENAI_DEPLOYMENT_NAME,
      apiVersion: process.env.AZURE_OPENAI_API_VERSION
    });

    let response;
    try {
      console.log('Making API request to:', `${endpoint}/openai/deployments/${deploymentName}/chat/completions?api-version=${apiVersion}`);

      // 初始化客户端
      const client = new OpenAIClient(
        endpoint,
        new AzureKeyCredential(apiKey),
        { apiVersion }
      );

      response = await client.getChatCompletions(
        deploymentName,
        [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: prompt }
        ]
      );
    } catch (error: any) {
      console.error('Error calling Azure OpenAI:', error);
      
      // 检查是否是身份验证错误
      const errorMessage = error.message || 'Unknown error';
      const isAuthError = errorMessage.includes('401') || 
                         errorMessage.includes('authentication') || 
                         errorMessage.includes('key') || 
                         errorMessage.includes('credentials');

      if (isAuthError) {
        console.error('Authentication error - please check your Azure OpenAI credentials');
      }

      // 打印详细的调试信息
      console.error('Debug information:', {
        error: errorMessage,
        endpoint: endpoint?.replace(/\/+$/, ''),
        deploymentName,
        apiVersion,
        hasApiKey: !!apiKey,
        isAuthError
      });

      return NextResponse.json(
        { 
          error: isAuthError ? 'Authentication failed' : 'Failed to call Azure OpenAI',
          details: errorMessage,
          debug: {
            endpoint: endpoint?.replace(/\/+$/, ''),
            deploymentName,
            apiVersion,
            hasApiKey: !!apiKey,
            isAuthError
          }
        },
        { status: isAuthError ? 401 : 500 }
      );
    }

    if (!response.choices || response.choices.length === 0) {
      console.error('No completion choices returned from Azure OpenAI');
      return NextResponse.json(
        { error: 'Failed to generate flow data' },
        { status: 500 }
      );
    }

    const content = response.choices[0].message?.content;
    if (!content) {
      console.error('Empty completion from Azure OpenAI');
      return NextResponse.json(
        { error: 'Failed to generate flow content' },
        { status: 500 }
      );
    }

    let cleanedContent = content.trim();
    console.log('Raw AI response:', cleanedContent);

    // 如果返回内容被代码块包裹，提取代码块内容
    const codeBlockRegex = /```(?:json)?\s*([\s\S]*?)\s*```/;
    const codeBlockMatch = cleanedContent.match(codeBlockRegex);
    if (codeBlockMatch) {
      cleanedContent = codeBlockMatch[1].trim();
      console.log('Extracted from code block:', cleanedContent);
    }

    // 尝试提取 JSON 对象
    const jsonRegex = /{[\s\S]*}/;
    const jsonMatch = cleanedContent.match(jsonRegex);
    if (!jsonMatch) {
      console.error('No valid JSON object found in response');
      return NextResponse.json(
        { error: 'Invalid response format from AI' },
        { status: 500 }
      );
    }

    cleanedContent = jsonMatch[0];
    console.log('Extracted JSON:', cleanedContent);

    // 修复常见的 JSON 格式问题
    cleanedContent = fixInvalidJSON(cleanedContent);
    
    // 解析生成的 JSON
    let flowData: GeneratedFlow;
    try {
      flowData = JSON.parse(cleanedContent);
    } catch (error) {
      console.error('Error parsing JSON:', error);
      console.error('Failed content:', cleanedContent);
      return NextResponse.json(
        { error: 'Invalid flow data format', details: (error as Error).message },
        { status: 500 }
      );
    }

    // 验证数据结构
    if (!flowData.nodes || !Array.isArray(flowData.nodes) || !flowData.edges || !Array.isArray(flowData.edges)) {
      console.error('Invalid flow data structure:', flowData);
      return NextResponse.json(
        { error: 'Invalid flow data structure' },
        { status: 500 }
      );
    }

    // 验证每个节点的必要字段
    for (const node of flowData.nodes) {
      if (!node.type || !node.title || !node.content || !node.position || 
          typeof node.position.x !== 'number' || typeof node.position.y !== 'number') {
        console.error('Invalid node data:', node);
        return NextResponse.json(
          { error: 'Invalid node data structure' },
          { status: 500 }
        );
      }
    }

    // 验证每条边的必要字段
    for (const edge of flowData.edges) {
      if (!edge.source || !edge.target) {
        console.error('Invalid edge data:', edge);
        return NextResponse.json(
          { error: 'Invalid edge data structure' },
          { status: 500 }
        );
      }
    }

    // 格式化数据
    const formattedData = {
      nodes: flowData.nodes.map(node => ({
        type: node.type,
        title: node.title,
        content: typeof node.content === 'object' ? JSON.stringify(node.content) : node.content,
        position: {
          x: Math.round(node.position.x),
          y: Math.round(node.position.y)
        }
      })),
      edges: flowData.edges.map(edge => ({
        source: edge.source,
        target: edge.target
      }))
    };

    console.log('Successfully generated flow data');
    return NextResponse.json(formattedData);

  } catch (error: any) {
    console.error('Error in generate-flow API:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate flow',
        details: error.message || 'Unknown error'
      },
      { status: 500 }
    );
  }
}
import { NextResponse } from 'next/server';
import { OpenAIClient, AzureKeyCredential } from '@azure/openai';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const preferredRegion = 'auto';

// 请在 SYSTEM_PROMPT 中强调返回的 JSON 格式必须严格合法，使用英文双引号，不得出现多余符号或省略号
const SYSTEM_PROMPT = `你是一个专业的产品设计助手。根据用户的需求，生成一个完整的产品流程图。这个流程图的内容将作为 AI coding 工具的输入，用于自动生成相应的页面和功能。

请遵循以下规则：
1. 输出必须是一个合法的JSON对象，包含nodes和edges两个数组，所有字符串必须使用英文双引号，不允许使用中文全角引号，不得出现多余的冒号或省略号。
2. 每个节点必须包含以下字段：
   - type: 节点类型，取值必须为 "product"、"external" 或 "context"。
   - title: 节点标题，简短的描述，且必须唯一。
   - content: 详细描述，要求是字符串，不得嵌套其他对象或省略部分内容。
   - position: 节点位置，必须包含 x 和 y 两个数值。
3. 每条边必须包含以下字段：
   - source: 源节点的标题。
   - target: 目标节点的标题。
   - description: （可选）描述两节点之间的关系。
示例输出：
{
  "nodes": [
    {
      "type": "context",
      "title": "项目背景",
      "content": "用户需要一个待办事项管理应用",
      "position": { "x": 100, "y": 100 }
    },
    {
      "type": "product",
      "title": "待办列表",
      "content": "显示所有待办事项，支持标记完成状态",
      "position": { "x": 400, "y": 100 }
    },
    {
      "type": "product",
      "title": "任务详情",
      "content": "显示待办事项的详细信息",
      "position": { "x": 700, "y": 100 }
    },
    {
      "type": "external",
      "title": "通知服务",
      "content": "发送任务到期提醒",
      "position": { "x": 1000, "y": 100 }
    }
  ],
  "edges": [
    { "source": "项目背景", "target": "待办列表", "description": "从项目背景跳转到待办列表" },
    { "source": "待办列表", "target": "任务详情", "description": "点击待办项跳转到任务详情" },
    { "source": "任务详情", "target": "通知服务", "description": "任务详情中触发通知服务提醒任务到期" }
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

export async function POST(request: Request) {
  try {
    console.log('API endpoint called');
    const { prompt } = await request.json();
    console.log('Received prompt:', prompt);

    const endpoint = process.env.AZURE_OPENAI_ENDPOINT!;
    const apiKey = process.env.AZURE_OPENAI_API_KEY!;
    const deploymentName = process.env.AZURE_OPENAI_DEPLOYMENT_NAME!;

    console.log('Azure OpenAI config:', { endpoint, deploymentName });

    const client = new OpenAIClient(
      endpoint,
      new AzureKeyCredential(apiKey),
      { apiVersion: "2024-02-15-preview" }
    );

    console.log('Sending request to Azure OpenAI...');
    const response = await client.getChatCompletions(
      deploymentName,
      [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
      {
        temperature: 0.7,
        maxTokens: 2000,
      }
    );

    console.log('Azure OpenAI response:', response);

    const content = response.choices[0].message?.content;
    console.log('Raw AI response content:', content);

    if (!content) {
      console.error('Empty response content from AI');
      return NextResponse.json(
        { error: 'Empty response from AI' },
        { status: 500 }
      );
    }

    let cleanedContent = content.trim();
    console.log('Trimmed content:', cleanedContent);

    // 如果返回内容被代码块包裹，提取代码块内部内容
    const codeBlockRegex = /```(?:json)?\s*([\s\S]*?)\s*```/;
    const codeBlockMatch = cleanedContent.match(codeBlockRegex);
    if (codeBlockMatch) {
      console.log('Found code block, extracting content');
      cleanedContent = codeBlockMatch[1];
    } else {
      // 尝试直接提取完整 JSON 对象
      const jsonRegex = /{[\s\S]*}/;
      const jsonMatch = cleanedContent.match(jsonRegex);
      if (jsonMatch) {
        cleanedContent = jsonMatch[0];
      } else {
        console.error('No valid JSON object found in response');
        return NextResponse.json(
          { error: 'Invalid response format from AI', details: 'No valid JSON object found in response' },
          { status: 500 }
        );
      }
    }

    console.log('Content before fixing:', cleanedContent);
    // 修复常见的 JSON 格式问题（全角引号、多余冒号、省略号等）
    cleanedContent = fixInvalidJSON(cleanedContent);
    console.log('Content after fixing:', cleanedContent);

    let flowData;
    try {
      flowData = JSON.parse(cleanedContent);
      console.log('Successfully parsed JSON:', flowData);
    } catch (parseError: any) {
      console.error('JSON parse error:', parseError);
      console.log('Failed content:', cleanedContent);
      return NextResponse.json(
        { error: 'Invalid response format from AI', details: parseError.message },
        { status: 500 }
      );
    }

    // 验证返回数据格式
    if (!flowData.nodes || !Array.isArray(flowData.nodes) || !flowData.edges || !Array.isArray(flowData.edges)) {
      console.error('Invalid flow data structure');
      return NextResponse.json(
        { error: 'Invalid response format from AI', details: 'Response missing required fields' },
        { status: 500 }
      );
    }

    // 验证每个节点的必要字段
    for (const node of flowData.nodes) {
      if (
        !node.type ||
        !node.title ||
        !node.content ||
        !node.position ||
        typeof node.position.x !== 'number' ||
        typeof node.position.y !== 'number'
      ) {
        console.error('Invalid node data:', node);
        return NextResponse.json(
          { error: 'Invalid response format from AI', details: 'Node missing required fields' },
          { status: 500 }
        );
      }
    }

    // 验证每条边的必要字段
    for (const edge of flowData.edges) {
      if (!edge.source || !edge.target) {
        console.error('Invalid edge data:', edge);
        return NextResponse.json(
          { error: 'Invalid response format from AI', details: 'Edge missing required fields' },
          { status: 500 }
        );
      }
    }

    interface AINode {
      type: 'product' | 'external' | 'context';
      title: string;
      content: string;
      position: {
        x: number;
        y: number;
      };
    }

    interface AIEdge {
      source: string;
      target: string;
      description?: string;
    }

    // 转换成最终格式并确保数字正确
    const formattedData = {
      nodes: flowData.nodes.map((node: AINode) => ({
        type: node.type,
        title: node.title,
        // 如果 content 是对象，则转为字符串
        content: typeof node.content === 'object' ? JSON.stringify(node.content) : node.content,
        position: {
          x: Math.round(node.position.x),
          y: Math.round(node.position.y)
        }
      })),
      edges: flowData.edges.map((edge: AIEdge) => ({
        source: edge.source,
        target: edge.target
      }))
    };

    return NextResponse.json(formattedData);
  } catch (error: any) {
    console.error('Error generating flow:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate flow', 
        details: error.message,
        code: error.code,
        statusCode: error.statusCode,
      },
      { status: 500 }
    );
  }
}
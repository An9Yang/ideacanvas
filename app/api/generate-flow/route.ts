import { NextResponse } from 'next/server';
import { NodeType, GeneratedNode, GeneratedEdge, GeneratedFlow } from '@/lib/types/flow';
import { azureOpenAI } from '@/lib/config/azure-openai';
import { handleAPIError, sanitizeJSON, validateJSON } from '@/lib/utils/error-handler';
import { FLOW_GENERATION_PROMPT } from '@/lib/prompts/flow-generation';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const preferredRegion = 'auto';

export async function POST(request: Request) {
  try {
    // 验证配置和请求
    const validation = azureOpenAI.validateConfig();
    if (!validation.isValid) {
      throw new Error(`Azure OpenAI configuration validation failed: ${validation.errors.join(', ')}`);
    }

    const body = await request.json().catch((error) => {
      console.error('Error parsing request body:', error);
      throw new Error('Invalid request body format');
    });

    if (!body?.prompt) {
      return NextResponse.json(
        { error: 'Missing prompt in request body' },
        { status: 400 }
      );
    }

    // 生成流程图数据
    const client = azureOpenAI.getClient();
    const config = azureOpenAI.getConfig();
    
    console.log('Generating flow for prompt:', body.prompt);
    const response = await client.chat.completions.create({
      model: config.deploymentName,
      messages: [
        { role: 'system', content: FLOW_GENERATION_PROMPT },
        { role: 'user', content: body.prompt }
      ],
      temperature: 0.7,
      max_tokens: 2000
    });

    if (!response.choices?.[0]?.message?.content) {
      throw new Error('Invalid or empty AI response');
    }

    // 处理 AI 响应
    const cleanedContent = sanitizeJSON(response.choices[0].message.content.trim());
    const { isValid, error } = validateJSON(cleanedContent);
    if (!isValid) {
      throw new Error(`JSON validation failed: ${error}`);
    }

    const flowData: GeneratedFlow = JSON.parse(cleanedContent);

    // 格式化数据
    const formattedData = {
      nodes: flowData.nodes.map(node => ({
        type: node.type as NodeType,
        title: node.title,
        content: typeof node.content === 'object' ? JSON.stringify(node.content) : node.content,
        position: {
          x: Math.round(node.position.x),
          y: Math.round(node.position.y)
        }
      })),
      edges: flowData.edges.map(edge => ({
        source: edge.source,
        target: edge.target,
        description: edge.description
      }))
    };

    console.log('Successfully generated flow data');
    return NextResponse.json(formattedData);

  } catch (error) {
    const { error: errorMessage, details, statusCode } = handleAPIError(error);
    return NextResponse.json({ error: errorMessage, details }, { status: statusCode });
  }
}
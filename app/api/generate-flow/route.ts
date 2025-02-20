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
    console.log('Using deployment:', config.deploymentName);
    
    const response = await client.chat.completions.create({
      model: config.deploymentName,
      messages: [
        { role: 'system', content: FLOW_GENERATION_PROMPT },
        { role: 'user', content: body.prompt }
      ],
      max_tokens: 100000  // 增加总 token 限制
    });

    console.log('Raw AI response:', response);
    
    if (!response.choices?.[0]?.message?.content) {
      console.error('Invalid response structure:', response);
      throw new Error('Invalid or empty AI response');
    }

    // 处理 AI 响应
    console.log('Raw AI response content:', response.choices[0].message.content);
    
    const trimmedContent = response.choices[0].message.content.trim();
    console.log('Trimmed content:', trimmedContent);
    
    const cleanedContent = sanitizeJSON(trimmedContent);
    console.log('Cleaned content:', cleanedContent);
    
    const { isValid, error } = validateJSON(cleanedContent);
    if (!isValid) {
      console.error('JSON validation error:', error);
      console.error('Content that failed validation:', cleanedContent);
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
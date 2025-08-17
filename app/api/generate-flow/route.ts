import { NextResponse } from 'next/server';
import { GeneratedFlow, GeneratedNode, GeneratedEdge } from '@/lib/types/flow';
import { azureOpenAI } from '@/lib/config/azure-openai';
import { configService } from '@/lib/config';
import { errorService, ErrorCode } from '@/lib/services/error-service';
import {
  detectLanguage,
  validateNodeContent,
  validateRequestBody
} from '@/lib/utils/api-validators';
import {
  generateSystemPrompt,
  generateRetryPrompt,
  cleanAIResponse
} from '@/lib/utils/prompt-generator';
import { handleAPIError, sanitizeJSON, validateJSON } from '@/lib/utils/error-handler';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const preferredRegion = 'auto';

/**
 * Generate flow from AI response
 */
async function generateFlowWithAI(
  prompt: string,
  systemPrompt: string,
  isRetry: boolean = false
): Promise<string> {
  const generationParams = configService.getGenerationParams();
  
  const client = azureOpenAI.getClient();
  const azureConfig = configService.getAzureConfig();
  const completion = await client.chat.completions.create({
    model: azureConfig.deploymentName,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt }
    ],
    temperature: generationParams.temperature,
    max_completion_tokens: generationParams.maxTokens,
    // 移除response_format参数，让AI自然返回JSON
  });
  
  const content = completion.choices[0]?.message?.content;
  
  if (!content) {
    throw errorService.createError(
      ErrorCode.AI_INVALID_RESPONSE,
      'AI没有返回有效内容'
    );
  }
  
  return content;
}

/**
 * Validate and process flow data
 */
function validateFlowData(flowData: any): GeneratedFlow {
  // Validate structure
  if (!flowData.nodes || !Array.isArray(flowData.nodes)) {
    throw errorService.createError(
      ErrorCode.FLOW_INVALID_FORMAT,
      '响应格式错误：缺少nodes数组'
    );
  }
  
  if (!flowData.edges || !Array.isArray(flowData.edges)) {
    throw errorService.createError(
      ErrorCode.FLOW_INVALID_FORMAT,
      '响应格式错误：缺少edges数组'
    );
  }
  
  // Transform nodes from o3 format to our format
  const transformedNodes: GeneratedNode[] = flowData.nodes.map((node: any, index: number) => {
    // Debug log for the first few nodes
    if (index < 3) {
      console.log(`Node ${index} raw data:`, JSON.stringify(node, null, 2));
    }
    
    // Extract title and content from various possible locations
    let title = '';
    let content = '';
    
    // Try to get title from various places
    if (node.data?.label) {
      title = node.data.label;
    } else if (node.data?.title) {
      title = node.data.title;
    } else if (node.title) {
      title = node.title;
    } else if (node.label) {
      title = node.label;
    }
    
    // Try to get content from various places  
    if (node.data?.content) {
      content = node.data.content;
    } else if (node.content) {
      content = node.content;
    } else if (node.data?.description) {
      content = node.data.description;
    } else if (node.description) {
      content = node.description;
    }
    
    // If still no title, generate one based on type
    if (!title || title.trim() === '') {
      console.log(`Node ${node.id} has no title, type is ${node.type}`);
      if (node.type === 'external') {
        title = '外部服务';
      } else if (node.type === 'context') {
        title = '上下文信息';
      } else if (node.type === 'product') {
        title = '产品功能';
      } else if (node.type === 'document') {
        title = '文档说明';
      } else {
        title = 'Untitled';
      }
    }
    
    const result = {
      id: node.id,
      type: node.type,
      title: title,
      content: content || '(无内容)',
      position: node.position || { x: 100, y: 100 }
    };
    
    // Debug log transformed result for first few nodes
    if (index < 3) {
      console.log(`Node ${index} transformed:`, result);
    }
    
    return result;
  });
  
  // Transform edges
  const transformedEdges: GeneratedEdge[] = flowData.edges.map((edge: any) => {
    return {
      source: edge.source,
      target: edge.target,
      description: edge.label || edge.description || ''
    };
  });
  
  // Validate transformed nodes
  const validationErrors: string[] = [];
  const validationWarnings: string[] = [];
  
  for (const node of transformedNodes) {
    const validation = validateNodeContent(node);
    if (!validation.isValid) {
      // Only treat as error if it's not an empty title issue
      if (validation.error && !validation.error.includes('""')) {
        validationErrors.push(validation.error!);
      } else {
        // Treat empty titles as warnings
        validationWarnings.push(validation.error || 'Unknown validation warning');
      }
    }
  }
  
  // Log warnings but don't fail
  if (validationWarnings.length > 0) {
    console.warn('Validation warnings:', validationWarnings);
  }
  
  // Only fail if there are real errors (not just warnings)
  if (validationErrors.length > 0) {
    console.error('Validation errors:', validationErrors);
    console.error('Transformed nodes:', JSON.stringify(transformedNodes, null, 2));
    throw errorService.createError(
      ErrorCode.FLOW_VALIDATION_FAILED,
      '节点验证失败',
      { errors: validationErrors }
    );
  }
  
  return {
    nodes: transformedNodes,
    edges: transformedEdges
  } as GeneratedFlow;
}

/**
 * 创建SSE流式响应
 */
function createSSEStream() {
  const encoder = new TextEncoder();
  let controller: ReadableStreamDefaultController;
  
  const stream = new ReadableStream({
    start(c) {
      controller = c;
    },
    cancel() {
      // 清理资源
    }
  });
  
  const send = (data: any) => {
    const message = `data: ${JSON.stringify(data)}\n\n`;
    controller.enqueue(encoder.encode(message));
  };
  
  const close = () => {
    controller.close();
  };
  
  return { stream, send, close };
}

/**
 * POST /api/generate-flow
 * Generate a flow diagram from user prompt with SSE to avoid timeout
 */
export async function POST(request: Request) {
  // 创建SSE流
  const { stream, send, close } = createSSEStream();
  
  // 设置心跳定时器
  const heartbeatInterval = setInterval(() => {
    send({ type: 'heartbeat', timestamp: Date.now() });
  }, 5000); // 每5秒发送一次心跳
  
  try {
    // Step 1: Validate request
    const body = await request.json();
    const validation = validateRequestBody(body);
    
    if (!validation.isValid) {
      send({ type: 'error', error: validation.error });
      clearInterval(heartbeatInterval);
      close();
      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    }
    
    const prompt = validation.prompt!;
    
    // Step 2: Detect language
    const userLanguage = detectLanguage(prompt);
    const systemPrompt = generateSystemPrompt(userLanguage);
    
    // 发送开始生成的消息
    send({ type: 'status', message: '开始生成流程图...', progress: 10 });
    
    // Step 3: Generate flow (with retry logic)
    let flowData: GeneratedFlow | null = null;
    let lastError: string | null = null;
    
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        // Generate prompt
        const finalPrompt = attempt === 0 
          ? prompt 
          : generateRetryPrompt(prompt, lastError!, userLanguage);
        
        // 发送AI调用状态
        send({ 
          type: 'status', 
          message: attempt === 0 ? '正在分析需求...' : '正在重试生成...', 
          progress: attempt === 0 ? 30 : 50 
        });
        
        // Call AI
        const aiResponse = await generateFlowWithAI(
          finalPrompt,
          systemPrompt,
          attempt > 0
        );
        
        // Log raw response for debugging
        console.log('Raw AI response length:', aiResponse.length);
        if (aiResponse.length > 1000) {
          console.log('Raw AI response (first 500 chars):', aiResponse.substring(0, 500));
          console.log('Raw AI response (last 500 chars):', aiResponse.substring(aiResponse.length - 500));
        } else {
          console.log('Raw AI response:', aiResponse);
        }
        
        // Clean and parse response
        const cleanedContent = cleanAIResponse(aiResponse);
        console.log('Cleaned content length:', cleanedContent.length);
        
        const sanitizedContent = sanitizeJSON(cleanedContent);
        console.log('Sanitized content length:', sanitizedContent.length);
        
        // Try to identify the exact position of the error
        try {
          const parsedData = validateJSON(sanitizedContent);
          console.log('Parsed data successfully, nodes count:', parsedData.nodes?.length || 0);
          console.log('Parsed data successfully, edges count:', parsedData.edges?.length || 0);
        } catch (parseError) {
          // Extract more context around the error position
          if (parseError instanceof Error && parseError.message.includes('position')) {
            const match = parseError.message.match(/position (\d+)/);
            if (match) {
              const position = parseInt(match[1]);
              const start = Math.max(0, position - 100);
              const end = Math.min(sanitizedContent.length, position + 100);
              console.error('JSON parse error at position', position);
              console.error('Context around error:', sanitizedContent.substring(start, end));
              console.error('Character at position:', sanitizedContent.charCodeAt(position));
            }
          }
          throw parseError;
        }
        
        const parsedData = validateJSON(sanitizedContent);
        
        // 发送验证状态
        send({ type: 'status', message: '正在验证数据...', progress: 80 });
        
        // Validate flow data
        flowData = validateFlowData(parsedData);
        
        // 发送成功状态
        send({ type: 'status', message: '生成成功！', progress: 100 });
        break; // Success, exit retry loop
        
      } catch (error) {
        lastError = error instanceof Error ? error.message : '未知错误';
        console.error(`Attempt ${attempt + 1} failed:`, error);
        
        if (attempt === 1) {
          // Final attempt failed
          throw error;
        }
      }
    }
    
    if (!flowData) {
      throw errorService.createError(
        ErrorCode.FLOW_GENERATION_FAILED,
        '生成流程失败'
      );
    }
    
    // Step 4: 发送最终数据并关闭流
    send({
      type: 'complete',
      data: {
        ...flowData,
        userLanguage
      }
    });
    
    clearInterval(heartbeatInterval);
    close();
    
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no' // 禁用Nginx缓冲
      },
    });
    
  } catch (error) {
    console.error('Flow generation error:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    // 发送错误消息
    send({
      type: 'error',
      error: error instanceof Error ? error.message : '生成失败',
      code: error && typeof error === 'object' && 'code' in error ? (error as any).code : 'UNKNOWN_ERROR'
    });
    
    clearInterval(heartbeatInterval);
    close();
    
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  }
}
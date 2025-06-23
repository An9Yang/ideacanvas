import { NextResponse } from 'next/server';
import { GeneratedFlow } from '@/lib/types/flow';
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
  const transformedNodes: GeneratedNode[] = flowData.nodes.map((node: any) => {
    // Handle o3 format where title is in data.label
    if (node.data && node.data.label && node.data.content) {
      return {
        id: node.id,
        type: node.type,
        title: node.data.label,
        content: node.data.content,
        position: node.position
      };
    }
    // Handle standard format
    return {
      id: node.id,
      type: node.type,
      title: node.title || node.data?.label || '',
      content: node.content || node.data?.content || '',
      position: node.position
    };
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
  
  for (const node of transformedNodes) {
    const validation = validateNodeContent(node);
    if (!validation.isValid) {
      validationErrors.push(validation.error!);
    }
  }
  
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
 * POST /api/generate-flow
 * Generate a flow diagram from user prompt
 */
export async function POST(request: Request) {
  try {
    // Step 1: Validate request
    const body = await request.json();
    const validation = validateRequestBody(body);
    
    if (!validation.isValid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }
    
    const prompt = validation.prompt!;
    
    // Step 2: Detect language
    const userLanguage = detectLanguage(prompt);
    const systemPrompt = generateSystemPrompt(userLanguage);
    
    // Step 3: Generate flow (with retry logic)
    let flowData: GeneratedFlow | null = null;
    let lastError: string | null = null;
    
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        // Generate prompt
        const finalPrompt = attempt === 0 
          ? prompt 
          : generateRetryPrompt(prompt, lastError!, userLanguage);
        
        // Call AI
        const aiResponse = await generateFlowWithAI(
          finalPrompt,
          systemPrompt,
          attempt > 0
        );
        
        // Log raw response for debugging
        console.log('Raw AI response:', aiResponse);
        
        // Clean and parse response
        const cleanedContent = cleanAIResponse(aiResponse);
        console.log('Cleaned content:', cleanedContent);
        
        const sanitizedContent = sanitizeJSON(cleanedContent);
        console.log('Sanitized content:', sanitizedContent);
        
        const parsedData = validateJSON(sanitizedContent);
        console.log('Parsed data:', parsedData);
        
        // Validate flow data
        flowData = validateFlowData(parsedData);
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
    
    // Step 4: Return response
    return NextResponse.json({
      ...flowData,
      userLanguage
    });
    
  } catch (error) {
    console.error('Flow generation error:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    // Handle different error types
    if (error && typeof error === 'object' && 'code' in error) {
      const appError = error as any;
      return NextResponse.json(
        {
          error: appError.message,
          code: appError.code,
          details: appError.details
        },
        { status: appError.statusCode || 500 }
      );
    }
    
    // Generic error handling
    return handleAPIError(error);
  }
}
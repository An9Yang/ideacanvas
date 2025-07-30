import { aiClient } from './ai-client';
import { configService } from '@/lib/config';
import { errorService, ErrorCode } from './error-service';

export interface GenerateOptions {
  prompt: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
}

export interface FlowGenerationRequest {
  prompt: string;
  language?: string;
}

export interface FlowGenerationResponse {
  nodes: Array<{
    id: string;
    type: string;
    data: {
      label: string;
      content: string;
    };
    position: { x: number; y: number };
  }>;
  edges: Array<{
    id: string;
    source: string;
    target: string;
  }>;
}

/**
 * Unified AI service for all AI-related operations
 */
export class AIService {
  private static instance: AIService;
  
  private constructor() {}
  
  static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService();
    }
    return AIService.instance;
  }
  
  /**
   * Generate text completion
   */
  async generateCompletion(options: GenerateOptions): Promise<string> {
    return errorService.wrapAsync(
      async () => {
        const client = aiClient.getClient();
        const params = configService.getCompletionParams();
        
        console.log('[AI Service] 生成完成请求:', {
          promptLength: options.prompt.length,
          maxTokens: options.maxTokens,
          hasSystemPrompt: !!options.systemPrompt
        });
        
        const messages: any[] = [];
        
        if (options.systemPrompt) {
          messages.push({ role: 'system', content: options.systemPrompt });
        }
        
        messages.push({ role: 'user', content: options.prompt });
        
        // 检查模型类型来决定使用哪个参数
        const modelName = configService.getAzureConfig().deploymentName;
        const isO3Model = modelName.toLowerCase().includes('o3');
        const isO4Model = modelName.toLowerCase().includes('o4');
        
        const completionParams: any = {
          model: modelName,
          messages,
        };
        
        // o3 和 o4 模型都使用 max_completion_tokens
        if (isO3Model || isO4Model) {
          completionParams.max_completion_tokens = options.maxTokens ?? params.MAX_TOKENS;
          
          // o4-mini 支持其他参数，但 o3 不支持
          if (isO4Model) {
            completionParams.temperature = options.temperature ?? params.TEMPERATURE;
            completionParams.top_p = options.topP ?? params.TOP_P;
            completionParams.frequency_penalty = options.frequencyPenalty ?? params.FREQUENCY_PENALTY;
            completionParams.presence_penalty = options.presencePenalty ?? params.PRESENCE_PENALTY;
          }
        } else {
          // 其他模型使用标准参数
          completionParams.max_tokens = options.maxTokens ?? params.MAX_TOKENS;
          completionParams.temperature = options.temperature ?? params.TEMPERATURE;
          completionParams.top_p = options.topP ?? params.TOP_P;
          completionParams.frequency_penalty = options.frequencyPenalty ?? params.FREQUENCY_PENALTY;
          completionParams.presence_penalty = options.presencePenalty ?? params.PRESENCE_PENALTY;
        }
        
        console.log('[AI Service] 发送请求参数:', JSON.stringify(completionParams, null, 2));
        
        const response = await client.chat.completions.create(completionParams);
        
        console.log('[AI Service] 收到响应:', {
          hasChoices: !!response.choices,
          choicesLength: response.choices?.length,
          hasContent: !!response.choices?.[0]?.message?.content,
          contentLength: response.choices?.[0]?.message?.content?.length
        });
        
        if (!response.choices || response.choices.length === 0) {
          throw errorService.createError(
            ErrorCode.AI_INVALID_RESPONSE,
            'AI响应中没有choices'
          );
        }
        
        const messageContent = response.choices[0]?.message?.content;
        
        // o4-mini 模型可能在 reasoning 阶段使用 token，检查是否有推理内容
        if (!messageContent && response.usage?.completion_tokens_details?.reasoning_tokens && response.usage.completion_tokens_details.reasoning_tokens > 0) {
          console.warn('[AI Service] o4-mini 模型返回了推理token但没有内容，可能需要更多token');
          // 对于o4-mini，如果没有内容但有推理token，说明token限制太低
          throw errorService.createError(
            ErrorCode.AI_INVALID_RESPONSE,
            'o4-mini模型需要更多token来完成响应，请增加maxTokens参数'
          );
        }
        
        if (!messageContent) {
          console.error('[AI Service] 响应结构:', JSON.stringify(response, null, 2));
          throw errorService.createError(
            ErrorCode.AI_INVALID_RESPONSE,
            'AI没有返回有效内容'
          );
        }
        
        return messageContent;
      },
      'generateCompletion',
      ErrorCode.AI_COMPLETION_FAILED
    );
  }
  
  /**
   * Generate flow from prompt with SSE streaming
   */
  async generateFlow(
    request: FlowGenerationRequest,
    onProgress?: (status: string, progress: number) => void
  ): Promise<FlowGenerationResponse> {
    return errorService.wrapAsync(
      async () => {
        const response = await fetch('/api/generate-flow', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(request),
        });
        
        if (!response.ok || !response.body) {
          throw errorService.createError(
            ErrorCode.FLOW_GENERATION_FAILED,
            `生成流程失败: ${response.statusText}`,
            { statusCode: response.status }
          );
        }
        
        // 处理SSE流
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) break;
          
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              
              try {
                const event = JSON.parse(data);
                
                switch (event.type) {
                  case 'heartbeat':
                    // 心跳，忽略
                    break;
                    
                  case 'status':
                    // 进度更新
                    if (onProgress) {
                      onProgress(event.message, event.progress);
                    }
                    break;
                    
                  case 'complete':
                    // 完成，返回数据
                    const flowData = event.data;
                    
                    // Validate response format
                    if (!flowData.nodes || !Array.isArray(flowData.nodes) || 
                        !flowData.edges || !Array.isArray(flowData.edges)) {
                      throw errorService.createError(
                        ErrorCode.FLOW_INVALID_FORMAT,
                        '响应格式错误: 缺少 nodes 或 edges'
                      );
                    }
                    
                    return flowData;
                    
                  case 'error':
                    // 错误
                    throw errorService.createError(
                      event.code || ErrorCode.FLOW_GENERATION_FAILED,
                      event.error || '生成失败'
                    );
                }
              } catch (e) {
                // 忽略解析错误，可能是不完整的JSON
                if (e instanceof Error && !e.message.includes('JSON')) {
                  throw e;
                }
              }
            }
          }
        }
        
        // 如果没有收到complete事件
        throw errorService.createError(
          ErrorCode.FLOW_GENERATION_FAILED,
          '流式响应未正常结束'
        );
      },
      'generateFlow',
      ErrorCode.FLOW_GENERATION_FAILED
    );
  }
}

// Export singleton instance
export const aiService = AIService.getInstance();
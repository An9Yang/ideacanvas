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
        
        const messages: any[] = [];
        
        if (options.systemPrompt) {
          messages.push({ role: 'system', content: options.systemPrompt });
        }
        
        messages.push({ role: 'user', content: options.prompt });
        
        const response = await client.chat.completions.create({
          model: configService.getAzureConfig().deploymentName,
          messages,
          temperature: options.temperature ?? params.TEMPERATURE,
          max_tokens: options.maxTokens ?? params.MAX_TOKENS,
          top_p: options.topP ?? params.TOP_P,
          frequency_penalty: options.frequencyPenalty ?? params.FREQUENCY_PENALTY,
          presence_penalty: options.presencePenalty ?? params.PRESENCE_PENALTY,
        });
        
        if (!response.choices[0]?.message?.content) {
          throw errorService.createError(
            ErrorCode.AI_INVALID_RESPONSE,
            'AI没有返回有效内容'
          );
        }
        
        return response.choices[0].message.content;
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
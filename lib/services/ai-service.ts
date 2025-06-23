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
   * Generate flow from prompt (delegates to API endpoint)
   */
  async generateFlow(request: FlowGenerationRequest): Promise<FlowGenerationResponse> {
    return errorService.wrapAsync(
      async () => {
        const response = await fetch('/api/generate-flow', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(request),
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          throw errorService.createError(
            ErrorCode.FLOW_GENERATION_FAILED,
            errorData?.error || `生成流程失败: ${response.statusText}`,
            { statusCode: response.status, errorData }
          );
        }
        
        const data = await response.json();
        
        // Validate response format
        if (!data.nodes || !Array.isArray(data.nodes) || !data.edges || !Array.isArray(data.edges)) {
          throw errorService.createError(
            ErrorCode.FLOW_INVALID_FORMAT,
            '响应格式错误: 缺少 nodes 或 edges'
          );
        }
        
        return data;
      },
      'generateFlow',
      ErrorCode.FLOW_GENERATION_FAILED
    );
  }
}

// Export singleton instance
export const aiService = AIService.getInstance();
import { AI_CONFIG } from './constants';

/**
 * Unified configuration service for the application
 * Provides a single source of truth for all configuration values
 */
export class ConfigService {
  private static instance: ConfigService;
  
  private constructor() {}
  
  static getInstance(): ConfigService {
    if (!ConfigService.instance) {
      ConfigService.instance = new ConfigService();
    }
    return ConfigService.instance;
  }
  
  /**
   * Get Azure OpenAI configuration
   */
  getAzureConfig() {
    return {
      endpoint: process.env.AZURE_OPENAI_ENDPOINT || AI_CONFIG.AZURE.DEFAULT_ENDPOINT,
      apiKey: process.env.AZURE_OPENAI_API_KEY || '',
      apiVersion: process.env.AZURE_OPENAI_API_VERSION || AI_CONFIG.AZURE.API_VERSION,
      deploymentName: process.env.AZURE_OPENAI_DEPLOYMENT_NAME || AI_CONFIG.AZURE.DEPLOYMENT_NAME,
    };
  }
  
  /**
   * Get model parameters for flow generation
   */
  getGenerationParams() {
    return {
      temperature: Number(process.env.AI_TEMPERATURE) || AI_CONFIG.GENERATION.TEMPERATURE,
      maxTokens: Number(process.env.AI_MAX_TOKENS) || AI_CONFIG.GENERATION.MAX_TOKENS,
      topP: Number(process.env.AI_TOP_P) || AI_CONFIG.GENERATION.TOP_P,
      frequencyPenalty: Number(process.env.AI_FREQUENCY_PENALTY) || AI_CONFIG.GENERATION.FREQUENCY_PENALTY,
      presencePenalty: Number(process.env.AI_PRESENCE_PENALTY) || AI_CONFIG.GENERATION.PRESENCE_PENALTY,
    };
  }
  
  /**
   * Get model parameters for simple completions
   */
  getCompletionParams() {
    return AI_CONFIG.COMPLETION;
  }
  
  /**
   * Get assistant configuration
   */
  getAssistantConfig() {
    return AI_CONFIG.ASSISTANT;
  }
  
  /**
   * Get validation rules
   */
  getValidationRules() {
    return AI_CONFIG.VALIDATION;
  }
  
  /**
   * Validate configuration on startup
   */
  validateConfig(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const azureConfig = this.getAzureConfig();
    
    if (!azureConfig.apiKey) {
      errors.push('AZURE_OPENAI_API_KEY is not set');
    }
    
    if (!azureConfig.endpoint) {
      errors.push('AZURE_OPENAI_ENDPOINT is not set');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

// Export singleton instance
export const configService = ConfigService.getInstance();

// Export constants for direct access
export { AI_CONFIG, APP_CONFIG, COMMON_EXTERNAL_SERVICES, NODE_TYPES, NODE_COLORS } from './constants';
import { AzureOpenAI } from 'openai';
import { configService } from '@/lib/config';

/**
 * Unified AI client service
 * Provides a single OpenAI client instance for all services
 */
export class AIClientService {
  private static instance: AIClientService;
  private client: AzureOpenAI | null = null;
  
  private constructor() {}
  
  static getInstance(): AIClientService {
    if (!AIClientService.instance) {
      AIClientService.instance = new AIClientService();
    }
    return AIClientService.instance;
  }
  
  /**
   * Get or create the Azure OpenAI client
   */
  getClient(): AzureOpenAI {
    if (!this.client) {
      const config = configService.getAzureConfig();
      
      if (!config.apiKey) {
        throw new Error('Azure OpenAI API key is not configured');
      }
      
      this.client = new AzureOpenAI({
        endpoint: config.endpoint,
        apiKey: config.apiKey,
        apiVersion: config.apiVersion,
        deployment: config.deploymentName,
      });
    }
    
    return this.client;
  }
  
  /**
   * Reset the client (useful for testing or configuration changes)
   */
  resetClient(): void {
    this.client = null;
  }
}

// Export singleton instance
export const aiClient = AIClientService.getInstance();
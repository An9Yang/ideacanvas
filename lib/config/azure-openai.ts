import { AzureKeyCredential, OpenAIClient } from '@azure/openai';

interface AzureOpenAIConfig {
  endpoint: string;
  apiKey: string;
  deploymentName: string;
  apiVersion: string;
}

class AzureOpenAIService {
  private static instance: AzureOpenAIService;
  private client: OpenAIClient | null = null;
  private config: AzureOpenAIConfig;

  private constructor() {
    // 从环境变量加载配置
    this.config = {
      endpoint: process.env.AZURE_OPENAI_ENDPOINT || 'https://aictopus-test.openai.azure.com',
      apiKey: process.env.AZURE_OPENAI_API_KEY || '',
      deploymentName: process.env.AZURE_OPENAI_DEPLOYMENT_NAME || 'o3-mini',
      apiVersion: process.env.AZURE_OPENAI_API_VERSION || '2024-12-01-preview'
    };
  }

  public static getInstance(): AzureOpenAIService {
    if (!AzureOpenAIService.instance) {
      AzureOpenAIService.instance = new AzureOpenAIService();
    }
    return AzureOpenAIService.instance;
  }

  public getConfig(): AzureOpenAIConfig {
    return { ...this.config };
  }

  public getClient(): OpenAIClient {
    if (!this.client) {
      if (!this.config.apiKey) {
        throw new Error('Azure OpenAI API key is not configured');
      }

      this.client = new OpenAIClient(
        this.config.endpoint,
        new AzureKeyCredential(this.config.apiKey),
        { apiVersion: this.config.apiVersion }
      );
    }
    return this.client;
  }

  public validateConfig(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.config.endpoint?.startsWith('https://')) {
      errors.push('Endpoint must start with https://');
    }

    if (!this.config.apiKey) {
      errors.push('API key is not configured');
    }

    if (!this.config.deploymentName) {
      errors.push('Deployment name is not configured');
    }

    if (!this.config.apiVersion) {
      errors.push('API version is not configured');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  public async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      const client = this.getClient();
      const response = await client.getChatCompletions(
        this.config.deploymentName,
        [{ role: 'user', content: '你好，这是一个测试消息。请回复"测试成功"。' }]
      );

      return {
        success: true,
        message: response.choices[0].message?.content || '测试成功，但没有收到预期的响应'
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || '连接测试失败'
      };
    }
  }
}

export const azureOpenAI = AzureOpenAIService.getInstance();

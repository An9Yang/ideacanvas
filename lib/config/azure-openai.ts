import { AzureOpenAI, OpenAI } from 'openai';

interface AzureOpenAIConfig {
  endpoint: string;
  apiKey: string;
  deploymentName: string;
  apiVersion: string;
}

class AzureOpenAIService {
  private static instance: AzureOpenAIService;
  private client: AzureOpenAI | null = null;
  private config: AzureOpenAIConfig;

  private constructor() {
    // 获取基本配置
    let endpoint = process.env.AZURE_OPENAI_ENDPOINT || '';
    let apiVersion = process.env.AZURE_OPENAI_API_VERSION || '2024-04-01-preview';
    
    // 修正端点URL - 如果包含完整路径（包括/openai/deployments/...），则提取基本URL
    if (endpoint.includes('/openai/deployments/')) {
      endpoint = endpoint.split('/openai/deployments/')[0];
    }
    
    // 确保端点URL不以斜杠结尾
    if (endpoint.endsWith('/')) {
      endpoint = endpoint.slice(0, -1);
    }
    
    // 修正API版本 - 移除末尾的分号
    if (apiVersion.endsWith(';')) {
      apiVersion = apiVersion.slice(0, -1);
    }
    
    // 加载并修正配置
    this.config = {
      endpoint: endpoint,
      apiKey: process.env.AZURE_OPENAI_API_KEY || '',
      deploymentName: process.env.AZURE_OPENAI_DEPLOYMENT_NAME || '',
      apiVersion: apiVersion
    };
    
    // Log configuration (without API key)
    console.log('Azure OpenAI Configuration:', {
      endpoint: this.config.endpoint,
      deploymentName: this.config.deploymentName,
      apiVersion: this.config.apiVersion,
      hasApiKey: !!this.config.apiKey
    });
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

  public getClient(): AzureOpenAI {
    if (!this.client) {
      if (!this.config.apiKey) {
        throw new Error('Azure OpenAI API key is not configured');
      }

      this.client = new AzureOpenAI({
        apiKey: this.config.apiKey,
        endpoint: this.config.endpoint,
        deployment: this.config.deploymentName,
        apiVersion: this.config.apiVersion
      });
    }
    return this.client;
  }

  public validateConfig(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.config.endpoint) {
      errors.push('Azure OpenAI endpoint is not configured');
    } else if (!this.config.endpoint.startsWith('https://')) {
      errors.push('Azure OpenAI endpoint must start with https://');
    }

    if (!this.config.apiKey) {
      errors.push('Azure OpenAI API key is not configured');
    }

    if (!this.config.deploymentName) {
      errors.push('Azure OpenAI deployment name is not configured');
    }

    if (!this.config.apiVersion) {
      errors.push('Azure OpenAI API version is not configured');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  public async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      const client = this.getClient();
      const response = await client.chat.completions.create({
        model: this.config.deploymentName,
        messages: [{ role: 'user', content: 'Hello, this is a test message. Please reply with "Test successful".' }]
      });

      return {
        success: true,
        message: response.choices[0].message?.content || 'Test successful but no expected response received'
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Unknown error occurred'
      };
    }
  }
}

export const azureOpenAI = AzureOpenAIService.getInstance();

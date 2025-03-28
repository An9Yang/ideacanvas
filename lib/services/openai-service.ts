import { AzureOpenAI } from 'openai';
import { config } from '../config';

let openaiClient: AzureOpenAI | null = null;

function getOpenAIClient() {
  if (!openaiClient) {
    if (!config.openai.apiKey) {
      throw new Error('Azure OpenAI API密钥缺失');
    }
    const apiKey = config.openai.apiKey || '';
    openaiClient = new AzureOpenAI({
      apiKey,
      endpoint: config.openai.endpoint,
      deployment: config.openai.deploymentName,
      apiVersion: config.openai.apiVersion,
      dangerouslyAllowBrowser: true,
    });
  }
  return openaiClient;
}

export async function generateCompletion(prompt: string) {
  const client = getOpenAIClient();
  
  try {
    const completion = await client.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: config.openai.modelName,
      max_tokens: 800,
      temperature: 1,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
    });

    return completion.choices[0].message.content;
  } catch (error) {
    console.error('生成内容时出错:', error);
    throw error;
  }
}

// PDF 相关功能已移除
// export async function createVectorStore(name: string) { ... }

// PDF 相关功能已移除
// export async function uploadFileToVectorStore(vectorStoreId: string, file: File) { ... }
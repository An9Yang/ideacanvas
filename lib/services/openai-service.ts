import OpenAI from 'openai';
import { config } from '../config';

let openaiClient: OpenAI | null = null;

function getOpenAIClient() {
  if (!openaiClient) {
    if (!config.openai.apiKey) {
      throw new Error('OpenAI API key is missing');
    }
    openaiClient = new OpenAI({
      apiKey: config.openai.apiKey,
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
      model: 'gpt-4o',
    });

    return completion.choices[0].message.content;
  } catch (error) {
    console.error('Error in completion:', error);
    throw error;
  }
}

// PDF 相关功能已移除
// export async function createVectorStore(name: string) { ... }

// PDF 相关功能已移除
// export async function uploadFileToVectorStore(vectorStoreId: string, file: File) { ... }
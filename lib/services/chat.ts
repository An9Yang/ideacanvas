import { AzureOpenAI } from 'openai';
import type { ChatCompletionMessageParam } from 'openai/resources';
import { config, validateConfig } from '../config';

// 仅在API密钥可用时初始化Azure OpenAI客户端
let openai: AzureOpenAI | null = null;

function getOpenAIClient() {
  if (!openai) {
    validateConfig();
    // 确保apiKey不为null
    const apiKey = config.openai.apiKey || '';
    openai = new AzureOpenAI({
      apiKey,
      endpoint: config.openai.endpoint,
      deployment: config.openai.deploymentName,
      apiVersion: config.openai.apiVersion,
    });
  }
  return openai;
}

export async function getChatCompletion(messages: Array<ChatCompletionMessageParam>) {
  try {
    const client = getOpenAIClient();
    const completion = await client.chat.completions.create({
      messages,
      model: config.openai.modelName,
      max_tokens: 800,
      temperature: 1,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
    });

    return completion.choices[0].message;
  } catch (error) {
    console.error('错误信息：', error);
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        throw new Error('Azure OpenAI API密钥无效或缺失。请检查您的配置。');
      }
    }
    throw error;
  }
}
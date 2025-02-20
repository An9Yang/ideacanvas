import OpenAI from 'openai';
import { config, validateConfig } from './config';

// Initialize OpenAI client only if API key is available
let openai: OpenAI | null = null;

function getOpenAIClient() {
  if (!openai) {
    validateConfig();
    openai = new OpenAI({
      apiKey: config.openai.apiKey,
      baseURL: `${config.openai.endpoint}openai/deployments/${config.openai.deploymentName}`,
      defaultQuery: { 'api-version': config.openai.apiVersion },
    });
  }
  return openai;
}

export async function getChatCompletion(messages: Array<OpenAI.Chat.ChatCompletionMessageParam>) {
  try {
    const client = getOpenAIClient();
    const completion = await client.chat.completions.create({
      messages,
      model: config.openai.deploymentName || '',
    });

    return completion.choices[0].message;
  } catch (error) {
    console.error('Error in chat completion:', error);
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        throw new Error('Azure OpenAI API key is invalid or missing. Please check your configuration.');
      }
    }
    throw error;
  }
}
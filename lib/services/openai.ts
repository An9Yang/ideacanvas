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

// PDF 相关功能已移除
// export async function createVectorStore(name: string) { ... }

// PDF 相关功能已移除
// export async function uploadFileToVectorStore(vectorStoreId: string, file: File) { ... }

export async function createAssistant() {
  const client = getOpenAIClient();
  
  return await client.beta.assistants.create({
    name: "IdeaCanvas助手",
    instructions: "你是一个有用的助手，帮助用户理解和发展他们的想法。",
    model: config.openai.modelName,
    tools: []
  });
}

export async function createThread() {
  const client = getOpenAIClient();
  return await client.beta.threads.create();
}

export async function createMessage(threadId: string, content: string) {
  const client = getOpenAIClient();
  return await client.beta.threads.messages.create(threadId, {
    role: "user",
    content
  });
}

export async function createRun(threadId: string, assistantId: string) {
  const client = getOpenAIClient();
  return await client.beta.threads.runs.create(threadId, {
    assistant_id: assistantId
  });
}

export async function getRunStatus(threadId: string, runId: string) {
  const client = getOpenAIClient();
  return await client.beta.threads.runs.retrieve(threadId, runId);
}

export async function getMessages(threadId: string) {
  const client = getOpenAIClient();
  return await client.beta.threads.messages.list(threadId);
}
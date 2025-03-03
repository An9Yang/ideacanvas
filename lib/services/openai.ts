import OpenAI from 'openai';
import { config } from './config';

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

// PDF 相关功能已移除
// export async function createVectorStore(name: string) { ... }

// PDF 相关功能已移除
// export async function uploadFileToVectorStore(vectorStoreId: string, file: File) { ... }

export async function createAssistant() {
  const client = getOpenAIClient();
  
  return await client.beta.assistants.create({
    name: "IdeaCanvas Assistant",
    instructions: "You are a helpful assistant that helps users understand and develop their ideas.",
    model: "gpt-4o",
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
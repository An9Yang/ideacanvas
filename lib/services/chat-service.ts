import { AzureOpenAI } from 'openai';
import { config } from '../config';

let openaiClient: AzureOpenAI | null = null;

function getOpenAIClient() {
  if (!openaiClient) {
    if (!config.openai.apiKey) {
      throw new Error('Azure OpenAI API key is missing');
    }
    
    openaiClient = new AzureOpenAI({
      apiKey: config.openai.apiKey,
      endpoint: config.openai.endpoint,
      deployment: config.openai.deploymentName,
      apiVersion: config.openai.apiVersion,
      dangerouslyAllowBrowser: true,
    });
  }
  return openaiClient;
}

export async function createAssistant() {
  const client = getOpenAIClient();
  return await client.beta.assistants.create({
    name: "IdeaCanvas助手",
    instructions: "你是一个专业助手，帮助用户分析和理解他们的想法。提供清晰简洁的回答。",
    model: config.openai.modelName,
    tools: [],
  });
}

export async function createThread() {
  const client = getOpenAIClient();
  return await client.beta.threads.create();
}

// PDF 相关功能已移除
// export async function uploadPDFAndAttachToThread(file: File, threadId: string) { ... }

export async function sendMessage(threadId: string, assistantId: string, content: string) {
  const client = getOpenAIClient();

  // Add the user's message to the thread
  await client.beta.threads.messages.create(threadId, {
    role: "user",
    content
  });

  // Create a run
  const run = await client.beta.threads.runs.create(threadId, {
    assistant_id: assistantId
  });

  // Poll for the run completion
  let runStatus = await client.beta.threads.runs.retrieve(threadId, run.id);
  
  while (runStatus.status === "queued" || runStatus.status === "in_progress") {
    await new Promise(resolve => setTimeout(resolve, 1000));
    runStatus = await client.beta.threads.runs.retrieve(threadId, run.id);
  }

  if (runStatus.status === "completed") {
    // Retrieve messages after completion
    const messages = await client.beta.threads.messages.list(threadId);
    return messages.data[0]; // Get the latest message
  } else {
    throw new Error(`Run failed with status: ${runStatus.status}`);
  }
}

export async function getMessages(threadId: string) {
  const client = getOpenAIClient();
  const messages = await client.beta.threads.messages.list(threadId);
  return messages.data;
}
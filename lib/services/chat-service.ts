import { aiClient } from './ai-client';
import { configService, AI_CONFIG } from '@/lib/config';

export async function createAssistant() {
  const client = aiClient.getClient();
  const assistantConfig = configService.getAssistantConfig();
  const azureConfig = configService.getAzureConfig();
  
  return await client.beta.assistants.create({
    name: assistantConfig.NAME,
    instructions: assistantConfig.INSTRUCTIONS,
    model: azureConfig.deploymentName,
    tools: [],
  });
}

export async function createThread() {
  const client = aiClient.getClient();
  return await client.beta.threads.create();
}

// PDF 相关功能已移除
// export async function uploadPDFAndAttachToThread(file: File, threadId: string) { ... }

export async function sendMessage(threadId: string, assistantId: string, content: string) {
  const client = aiClient.getClient();

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
  
  const assistantConfig = configService.getAssistantConfig();
  
  while (runStatus.status === "queued" || runStatus.status === "in_progress") {
    await new Promise(resolve => setTimeout(resolve, assistantConfig.POLLING_INTERVAL));
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
  const client = aiClient.getClient();
  const messages = await client.beta.threads.messages.list(threadId);
  return messages.data;
}
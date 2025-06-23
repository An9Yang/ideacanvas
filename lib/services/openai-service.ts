import { aiService } from './ai-service';

/**
 * Generate completion using unified AI service
 * @deprecated Use aiService.generateCompletion() directly
 */
export async function generateCompletion(prompt: string) {
  try {
    return await aiService.generateCompletion({ prompt });
  } catch (error) {
    console.error('生成内容时出错:', error);
    throw error;
  }
}

// PDF 相关功能已移除
// export async function createVectorStore(name: string) { ... }

// PDF 相关功能已移除
// export async function uploadFileToVectorStore(vectorStoreId: string, file: File) { ... }
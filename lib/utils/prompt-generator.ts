import { FLOW_GENERATION_PROMPT } from '@/lib/prompts/flow-generation';

/**
 * Generate system prompt based on language
 */
export function generateSystemPrompt(language: string): string {
  const languageInstructions = {
    zh: '请用中文回答。生成的所有节点标题和内容都必须是中文。',
    ja: '日本語で回答してください。生成されるすべてのノードのタイトルと内容は日本語でなければなりません。',
    ko: '한국어로 답변해 주세요. 생성되는 모든 노드 제목과 내용은 한국어여야 합니다.',
    en: 'Please respond in English. All generated node titles and content must be in English.'
  };
  
  const instruction = languageInstructions[language as keyof typeof languageInstructions] 
    || languageInstructions.en;
  
  const jsonFormatInstruction = `

CRITICAL REQUIREMENT FOR OUTPUT FORMAT:
1. Your response MUST be a valid JSON object only.
2. Do NOT include any markdown code blocks like \`\`\`json or \`\`\`.
3. Do NOT include any explanatory text before or after the JSON.
4. The JSON MUST have this exact structure:
{
  "nodes": [
    {
      "id": "unique_id_1",
      "type": "product|external|context",
      "data": {
        "label": "Node Title",
        "content": "Detailed content..."
      },
      "position": { "x": 100, "y": 200 }
    }
  ],
  "edges": [
    {
      "id": "edge_1",
      "source": "source_node_id",
      "target": "target_node_id",
      "label": "Edge description..."
    }
  ]
}

IMPORTANT: Each node MUST have id, type, data (with label and content), and position fields.`;
  
  return `${FLOW_GENERATION_PROMPT}\n\n${instruction}${jsonFormatInstruction}`;
}

/**
 * Generate retry prompt with feedback
 */
export function generateRetryPrompt(
  originalPrompt: string,
  error: string,
  language: string
): string {
  const retryInstructions = {
    zh: `之前的生成失败了，原因是：${error}\n\n请重新生成，确保所有节点都有足够详细的内容，并修复上述问题。\n\n原始需求：${originalPrompt}`,
    ja: `前回の生成に失敗しました。理由：${error}\n\nすべてのノードに十分な詳細なコンテンツがあることを確認し、上記の問題を修正して再生成してください。\n\n元の要件：${originalPrompt}`,
    ko: `이전 생성이 실패했습니다. 이유: ${error}\n\n모든 노드에 충분히 상세한 내용이 있는지 확인하고 위의 문제를 수정하여 다시 생성해주세요.\n\n원래 요구사항: ${originalPrompt}`,
    en: `The previous generation failed because: ${error}\n\nPlease regenerate, ensuring all nodes have sufficiently detailed content and fixing the above issues.\n\nOriginal requirement: ${originalPrompt}`
  };
  
  return retryInstructions[language as keyof typeof retryInstructions] 
    || retryInstructions.en;
}

/**
 * Clean and format AI response
 */
export function cleanAIResponse(content: string): string {
  return content
    .replace(/```json\s*/g, '')
    .replace(/```\s*$/g, '')
    .trim()
    .replace(/[\u00A0\u1680\u180E\u2000-\u200B\u202F\u205F\u3000\uFEFF]/g, ' ');
}
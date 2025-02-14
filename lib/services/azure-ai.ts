import { NodeType } from '@/lib/types/flow';

interface GeneratedNode {
  type: NodeType;
  title: string;
  content: string;
  position: { x: number; y: number };
}

interface GeneratedEdge {
  source: string;
  target: string;
}

interface GeneratedFlow {
  nodes: GeneratedNode[];
  edges: GeneratedEdge[];
}

export async function generateFlowFromPrompt(prompt: string): Promise<GeneratedFlow> {
  // 这里应该调用Azure OpenAI API，目前使用模拟数据
  const response = await fetch('/api/generate-flow', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ prompt }),
  });

  if (!response.ok) {
    throw new Error('Failed to generate flow');
  }

  return response.json();
}

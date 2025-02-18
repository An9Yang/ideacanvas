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

interface ErrorResponse {
  error: string;
  details?: string;
}

export async function generateFlowFromPrompt(prompt: string): Promise<GeneratedFlow> {
  try {
    const response = await fetch('/api/generate-flow', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt }),
    });

    const data = await response.json();

    if (!response.ok) {
      const errorMessage = data.details 
        ? `${data.error}: ${data.details}`
        : data.error || `Failed to generate flow: ${response.status} ${response.statusText}`;
      throw new Error(errorMessage);
    }

    // 验证返回的数据结构
    if (!data.nodes || !Array.isArray(data.nodes) || !data.edges || !Array.isArray(data.edges)) {
      throw new Error('Invalid response format: missing nodes or edges');
    }

    // 验证节点数据
    for (const node of data.nodes) {
      if (!node.type || !node.title || !node.content || !node.position || 
          typeof node.position.x !== 'number' || typeof node.position.y !== 'number') {
        throw new Error('Invalid response format: invalid node data');
      }
    }

    // 验证边数据
    for (const edge of data.edges) {
      if (!edge.source || !edge.target) {
        throw new Error('Invalid response format: invalid edge data');
      }
    }

    return data;
  } catch (error: any) {
    console.error('Error in generateFlowFromPrompt:', error);
    throw new Error(error.message || 'Failed to generate flow');
  }
}

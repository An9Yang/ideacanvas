import { GeneratedFlow } from '@/lib/types/flow';
import { handleAPIError } from '@/lib/utils/error-handler';

export async function generateFlowFromPrompt(prompt: string): Promise<GeneratedFlow> {
  try {
    // 打印请求详情
    console.log('Sending request to generate flow with prompt:', prompt);

    const response = await fetch('/api/generate-flow', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt }),
      cache: 'no-store',
    });

    // 打印响应状态
    console.log('Response status:', response.status);
    console.log('Response status text:', response.statusText);

    const data = await response.json();
    console.log('Response data:', data);

    if (!response.ok) {
      const errorMessage = data.details 
        ? `${data.error}: ${data.details}`
        : data.error || `Failed to generate flow: ${response.status} ${response.statusText}`;
      console.error('Error in generate flow:', errorMessage);
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

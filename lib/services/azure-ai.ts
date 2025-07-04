// azure-ai.ts
import { GeneratedFlow, GeneratedNode, GeneratedEdge } from '@/lib/types/flow';
import { handleAPIError } from '@/lib/utils/error-handler';
import { aiService } from './ai-service';

/**
 * Generate flow from prompt using unified AI service with progress callback
 * @deprecated Use aiService.generateFlow() directly
 */
export async function generateFlowFromPrompt(
  prompt: string,
  onProgress?: (status: string, progress: number) => void
): Promise<GeneratedFlow> {
  try {
    console.log('发送生成流程请求，prompt:', prompt);

    const data = await aiService.generateFlow({ prompt }, onProgress);
    console.log('响应数据:', data);

    // 验证返回的数据结构是否符合预期
    if (!data.nodes || !Array.isArray(data.nodes) || !data.edges || !Array.isArray(data.edges)) {
      throw new Error('响应格式错误: 缺少 nodes 或 edges');
    }

    // 转换节点格式从 API 响应到 GeneratedFlow 格式
    const generatedNodes: GeneratedNode[] = data.nodes.map((node: any) => {
      // 节点已经是正确的格式（从后端转换过了）
      if (!node.type || !node.title || !node.content || !node.position ||
          typeof node.position.x !== 'number' || typeof node.position.y !== 'number') {
        console.error('Invalid node:', node);
        throw new Error('响应格式错误: 节点数据无效');
      }
      
      return {
        id: node.id,
        type: node.type,
        title: node.title,
        content: node.content,
        position: node.position
      };
    });

    // 转换边格式
    const generatedEdges: GeneratedEdge[] = data.edges.map((edge: any) => {
      if (!edge.source || !edge.target) {
        throw new Error('响应格式错误: 边数据无效');
      }
      
      return {
        source: edge.source,
        target: edge.target,
        description: edge.label || ''
      };
    });
    
    return {
      nodes: generatedNodes,
      edges: generatedEdges
    } as GeneratedFlow;
  } catch (error: any) {
    console.error('generateFlowFromPrompt 错误:', error);
    throw new Error(error.message || '生成流程失败');
  }
}

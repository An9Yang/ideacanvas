// azure-ai.ts
import { GeneratedFlow } from '@/lib/types/flow';
import { handleAPIError } from '@/lib/utils/error-handler';
import { useLanguageStore } from '@/lib/stores/language-store';

export async function generateFlowFromPrompt(prompt: string): Promise<GeneratedFlow> {
  try {
    console.log('发送生成流程请求，prompt:', prompt);

    // 发送 POST 请求到内部 API 接口
    const response = await fetch('/api/generate-flow', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ prompt }),
      cache: 'no-store'
    });

    console.log('响应状态码:', response.status);
    console.log('响应状态文本:', response.statusText);

    const data = await response.json();
    console.log('响应数据:', data);

    if (!response.ok) {
      const errorMessage = data.details 
        ? `${data.error}: ${data.details}`
        : data.error || `生成流程失败: ${response.status} ${response.statusText}`;
      console.error('生成流程出错:', errorMessage);
      throw new Error(errorMessage);
    }

    // 验证返回的数据结构是否符合预期
    if (!data.nodes || !Array.isArray(data.nodes) || !data.edges || !Array.isArray(data.edges)) {
      throw new Error('响应格式错误: 缺少 nodes 或 edges');
    }

    // 验证每个节点的数据
    for (const node of data.nodes) {
      if (!node.type || !node.title || !node.content || !node.position ||
          typeof node.position.x !== 'number' || typeof node.position.y !== 'number') {
        throw new Error('响应格式错误: 节点数据无效');
      }
    }

    // 验证每条边的数据
    for (const edge of data.edges) {
      if (!edge.source || !edge.target) {
        throw new Error('响应格式错误: 边数据无效');
      }
    }

    // 如果响应中包含用户语言信息，更新UI语言
    if (data.userLanguage) {
      console.log('从响应中检测到用户语言:', data.userLanguage);
      const setLanguage = useLanguageStore.getState().setLanguage;
      setLanguage(data.userLanguage);
    }
    
    return data;
  } catch (error: any) {
    console.error('generateFlowFromPrompt 错误:', error);
    throw new Error(error.message || '生成流程失败');
  }
}

import { Node, NodeType, Edge } from '@/lib/types/flow';
import { Node as ReactFlowNode, Edge as ReactFlowEdge } from 'reactflow';

/**
 * 从流程图中收集所有连接到文档节点的节点内容
 */
export function collectNodeContents(nodes: ReactFlowNode[], documentNodeId: string, edges: ReactFlowEdge[]): {
  contextNodes: ReactFlowNode[];
  externalNodes: ReactFlowNode[];
  guideNodes: ReactFlowNode[];
  productNodes: ReactFlowNode[];
} {
  // 找出所有连接到文档节点的节点
  const connectedNodeIds = edges
    .filter(edge => edge.target === documentNodeId)
    .map(edge => edge.source);
  
  // 找到所有连接的节点
  const connectedNodes = nodes.filter(node => connectedNodeIds.includes(node.id));
  
  // 确保节点数据包含所需信息
  const validNodes = connectedNodes.filter(node => 
    node.data && 
    typeof node.data === 'object' && 
    node.data.title && 
    node.data.content);

  // 按类型分类节点
  return {
    contextNodes: validNodes.filter(node => node.type === 'context'),
    externalNodes: validNodes.filter(node => node.type === 'external'),
    guideNodes: validNodes.filter(node => node.type === 'guide'),
    productNodes: validNodes.filter(node => node.type === 'product'),
  };
}

/**
 * 生成项目文档内容
 */
export function generateDocumentContent(nodes: ReactFlowNode[], documentNodeId: string, edges: ReactFlowEdge[]): string {
  const { contextNodes, externalNodes, guideNodes, productNodes } = collectNodeContents(
    nodes,
    documentNodeId,
    edges
  );

  // 文档标题
  let document = '# 项目开发文档\n\n';

  // 项目介绍 (从上下文节点获取)
  if (contextNodes.length > 0) {
    document += '## 1. 项目介绍\n\n';
    contextNodes.forEach((node, index) => {
      document += `### 1.${index + 1}. ${node.data.title}\n\n`;
      document += `${cleanNodeContent(node.data.content)}\n\n`;
    });
  }

  // 产品功能 (从产品节点获取)
  if (productNodes.length > 0) {
    document += '## 2. 产品功能\n\n';
    productNodes.forEach((node, index) => {
      document += `### 2.${index + 1}. ${node.data.title}\n\n`;
      document += `${cleanNodeContent(node.data.content)}\n\n`;
    });
  }

  // 外部服务集成 (从外部服务节点获取)
  if (externalNodes.length > 0) {
    document += '## 3. 外部服务集成\n\n';
    externalNodes.forEach((node, index) => {
      document += `### 3.${index + 1}. ${node.data.title}\n\n`;
      document += `${cleanNodeContent(node.data.content)}\n\n`;
    });
  }

  // 开发指南 (从指南节点获取)
  if (guideNodes.length > 0) {
    document += '## 4. 开发指南\n\n';
    guideNodes.forEach((node, index) => {
      document += `### 4.${index + 1}. ${node.data.title}\n\n`;
      document += `${cleanNodeContent(node.data.content)}\n\n`;
    });
  }

  // 最后总结
  document += '## 5. 总结\n\n';
  document += '本文档基于项目流程图中的连接节点自动生成，包含了项目介绍、产品功能、外部服务集成以及开发指南等关键信息。开发团队可以根据此文档进行系统设计和开发工作。\n\n';
  document += '文档生成时间: ' + new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }) + '\n';

  return document;
}

/**
 * 处理节点内容，去除不必要的格式和标记
 */
function cleanNodeContent(content: string): string {
  // 移除可能的JSON格式
  if (content.trim().startsWith('{') && content.trim().endsWith('}')) {
    try {
      const parsed = JSON.parse(content);
      if (typeof parsed === 'object') {
        // 如果是对象，提取所有文本值并合并
        return extractTextFromObject(parsed);
      }
    } catch (e) {
      // JSON解析失败，保持原始内容
    }
  }

  // 处理Markdown的节编号
  let cleaned = content;
  
  // 移除节编号 (如 "1. ", "1.1. " 等)
  cleaned = cleaned.replace(/^\d+(\.\d+)*\.\s+/gm, '');
  
  return cleaned;
}

/**
 * 从JSON对象中提取所有文本值
 */
function extractTextFromObject(obj: any): string {
  if (typeof obj === 'string') {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => extractTextFromObject(item)).join('\n\n');
  }
  
  if (typeof obj === 'object' && obj !== null) {
    return Object.values(obj)
      .map(value => extractTextFromObject(value))
      .filter(text => text.trim() !== '')
      .join('\n\n');
  }
  
  return '';
}

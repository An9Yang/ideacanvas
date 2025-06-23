import { useState, useEffect, useCallback } from 'react';
import { useReactFlow } from 'reactflow';
import { NodeType } from '@/lib/types/flow';
import { generateDocumentContent } from '@/lib/utils/document-generator';
import { translateNodeTitle } from '@/lib/utils/translate-node';
import { useTranslation } from './useTranslation';

interface UseFlowNodeParams {
  id: string;
  type: NodeType;
  title: string;
  content: string;
  updateNodeContent?: (id: string, content: string) => void;
}

/**
 * Custom hook for flow node logic
 * Separates business logic from UI components
 */
export function useFlowNode({
  id,
  type,
  title,
  content,
  updateNodeContent
}: UseFlowNodeParams) {
  const [showDetails, setShowDetails] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const { t } = useTranslation();
  const reactFlowInstance = useReactFlow();
  
  // Get translated title
  const translatedTitle = translateNodeTitle(title, 'zh');
  
  // Get content summary
  const getContentSummary = useCallback(() => {
    const firstSection = content.split('2.')[0];
    const description = firstSection
      .split('\n')
      .filter(line => line.trim() && !line.startsWith('1.'))
      .map(line => line.trim())
      .join(' ');
    
    return description.length > 100 
      ? description.substring(0, 100) + '...' 
      : description || content.substring(0, 100) + '...';
  }, [content]);
  
  // Generate document content
  const generateDocumentNode = useCallback(async () => {
    if (!updateNodeContent || type !== 'document') return;
    
    setIsGenerating(true);
    try {
      const allNodes = reactFlowInstance.getNodes();
      const allEdges = reactFlowInstance.getEdges();
      
      // Find nodes connected to this document node
      const connectedEdges = allEdges.filter(edge => edge.target === id);
      const connectedNodeIds = new Set(connectedEdges.map(edge => edge.source));
      const connectedNodes = allNodes.filter(node => connectedNodeIds.has(node.id));
      
      if (connectedNodes.length === 0) {
        updateNodeContent(id, '没有找到连接的节点');
        return;
      }
      
      // Generate document content
      const documentContent = generateDocumentContent(allNodes, id, allEdges);
      updateNodeContent(id, documentContent);
    } catch (error) {
      console.error('生成文档内容失败：', error);
      updateNodeContent(id, '文档生成失败');
    } finally {
      setIsGenerating(false);
    }
  }, [id, type, updateNodeContent, reactFlowInstance]);
  
  // Auto-generate document for document nodes
  useEffect(() => {
    if (type === 'document') {
      const edges = reactFlowInstance.getEdges();
      const hasIncomingEdges = edges.some(edge => edge.target === id);
      
      const shouldAutoGenerate = hasIncomingEdges && (
        content.trim() === '' || 
        content.includes('正在生成项目文档') ||
        content.includes('本文档基于项目流程图中的连接节点自动生成')
      );
      
      if (shouldAutoGenerate) {
        generateDocumentNode();
      }
    }
  }, [type, id, content, generateDocumentNode, reactFlowInstance]);
  
  return {
    showDetails,
    setShowDetails,
    isGenerating,
    translatedTitle,
    summary: getContentSummary(),
    generateDocumentNode,
    t
  };
}
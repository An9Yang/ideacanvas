"use client";

import { memo, useState, useEffect } from 'react';
import { Handle, Position, useReactFlow } from 'reactflow';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, ChevronRight, RefreshCw } from 'lucide-react';
import { NodeType } from '@/lib/types/flow';
import { NodeDetails } from './node-details';
import { NodeProps } from 'reactflow';
import { useTranslation } from '@/hooks/useTranslation';
import { translateNodeTitle } from '@/lib/utils/translate-node';
import { generateDocumentContent } from '@/lib/utils/document-generator';

interface FlowNodeData {
  title: string;
  content: string;
  results?: Array<{ fileId: string; result: string }>;
  isProcessing?: boolean;
  error?: string;
  updateNodeContent?: (id: string, content: string) => void;
}

interface FlowNodeProps extends NodeProps<FlowNodeData> {
  type: NodeType;
}

const getNodeStyle = (type: NodeType) => {
  switch (type) {
    case 'external':
      return 'border-blue-500 bg-blue-50 dark:bg-blue-950';
    case 'context':
      return 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950';
    case 'guide':
      return 'border-green-500 bg-green-50 dark:bg-green-950';
    case 'document':
      return 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950';
    default:
      return 'border-white bg-background';
  }
};

const getContentSummary = (content: string) => {
  // 获取第一个部分（页面描述）的内容
  const firstSection = content.split('2.')[0];
  const description = firstSection
    .split('\n')
    .filter(line => line.trim() && !line.startsWith('1.'))
    .map(line => line.trim())
    .join(' ');
  return description || '';
};

const FlowNodeComponent = ({ id, type, data, isConnectable, selected }: FlowNodeProps) => {
  const [showDetails, setShowDetails] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const nodeStyle = getNodeStyle(type);
  const { title, content, results, isProcessing, error } = data;
  const summary = getContentSummary(content);
  const { t, language } = useTranslation();
  const reactFlowInstance = useReactFlow();
  
  // 翻译节点标题
  const translatedTitle = translateNodeTitle(title, language);

  // document节点特殊处理：生成整合文档内容
  const generateDocumentNode = () => {
    if (type !== 'document') return;
    
    setIsGenerating(true);
    try {
      const allNodes = reactFlowInstance.getNodes();
      const allEdges = reactFlowInstance.getEdges();
      const documentContent = generateDocumentContent(allNodes, id, allEdges);
      
      // 如果有更新节点内容的方法，就更新
      if (data.updateNodeContent) {
        data.updateNodeContent(id, documentContent);
      }
    } catch (error) {
      console.error('生成文档内容失败：', error);
    } finally {
      setIsGenerating(false);
    }
  };
  
  // 当节点类型为document且有连接到它的边时，自动生成文档内容
  useEffect(() => {
    if (type === 'document') {
      const edges = reactFlowInstance.getEdges();
      const hasIncomingEdges = edges.some(edge => edge.target === id);
      
      if (hasIncomingEdges && (content.trim() === '' || content.includes('本文档基于项目流程图中的连接节点自动生成'))) {
        // 如果是空文档或者已经是生成的文档，则自动更新
        generateDocumentNode();
      }
    }
  }, [type, id, reactFlowInstance.getNodes()]);
  
  // 这个效果主要用于手动初始化
  useEffect(() => {
    if (type === 'document' && content.trim() === '') {
      const edges = reactFlowInstance.getEdges();
      const hasIncomingEdges = edges.some(edge => edge.target === id);
      
      if (hasIncomingEdges) {
        generateDocumentNode();
      }
    }
  }, []);
  
  return (
    <>
      <div className="relative group">
        <Card 
          className={`w-[300px] p-4 border-2 shadow-lg transition-all ${nodeStyle} ${
            selected ? 'ring-2 ring-primary' : ''
          }`}
        >
          {/* 左侧输入点 */}
          <Handle
            type="target"
            position={Position.Left}
            id="left"
            isConnectable={isConnectable}
            className="w-3 h-3 !bg-primary hover:w-4 hover:h-4 transition-all"
            style={{ left: -6 }}
          />
          
          {/* 右侧输出点 */}
          <Handle
            type="source"
            position={Position.Right}
            id="right"
            isConnectable={isConnectable}
            className="w-3 h-3 !bg-primary hover:w-4 hover:h-4 transition-all"
            style={{ right: -6 }}
          />
          
          <div className="space-y-2">
            <h3 className="font-semibold text-lg">{translatedTitle}</h3>
            <p className="text-sm text-muted-foreground line-clamp-3">{summary}</p>
            {type === 'document' ? (
              <div className="flex justify-between gap-2 mt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-1"
                  onClick={() => setShowDetails(true)}
                >
                  {t('viewDetails')}
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-none"
                  onClick={generateDocumentNode}
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                </Button>
              </div>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                className="w-full mt-2"
                onClick={() => setShowDetails(true)}
              >
                {t('viewDetails')}
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            )}
            
            {isProcessing && (
              <div className="flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            )}
            
            {error && (
              <div className="p-2 bg-destructive/20 rounded-md">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}
          </div>
        </Card>

        {results && results.length > 0 && (
          <div className="absolute left-[320px] top-0 space-y-4">
            {results.map((result, index) => (
              <Card key={index} className="p-4 bg-background/95 backdrop-blur shadow-lg w-[300px]">
                <div className="prose prose-sm dark:prose-invert">
                  {result.result}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {showDetails && (
        <NodeDetails
          title={translatedTitle}
          content={content}
          type={type}
          onClose={() => setShowDetails(false)}
        />
      )}
    </>
  );
};

export const FlowNode = memo(FlowNodeComponent) as unknown as React.ComponentType<NodeProps>;

FlowNode.displayName = 'FlowNode';

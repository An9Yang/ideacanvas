"use client";

import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, ChevronRight, RefreshCw } from 'lucide-react';
import { NodeType } from '@/lib/types/flow';
import { NodeDetails } from './node-details';
import { useFlowNode } from '@/hooks/use-flow-node';
import { getNodeStyle } from '@/lib/utils/node-styles';

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

/**
 * Flow node component - optimized version
 * Business logic is separated into useFlowNode hook
 */
export const FlowNode = memo(({ 
  id, 
  data, 
  type, 
  selected, 
  isConnectable 
}: FlowNodeProps) => {
  const { title, content, updateNodeContent } = data;
  
  // Use custom hook for business logic
  const {
    showDetails,
    setShowDetails,
    isGenerating,
    translatedTitle,
    summary,
    generateDocumentNode,
    t
  } = useFlowNode({
    id,
    type,
    title,
    content,
    updateNodeContent
  });
  
  // Get node styling
  const nodeStyle = getNodeStyle(type);
  
  return (
    <>
      <div className="relative group">
        <Card 
          className={`w-[300px] p-4 border-2 shadow-lg transition-all ${nodeStyle} ${
            selected ? 'ring-2 ring-primary' : ''
          }`}
        >
          {/* Connection handles */}
          <Handle
            type="target"
            position={Position.Left}
            id="left"
            isConnectable={isConnectable}
            className="w-3 h-3 !bg-primary hover:w-4 hover:h-4 transition-all"
            style={{ left: -6 }}
          />
          
          <Handle
            type="source"
            position={Position.Right}
            id="right"
            isConnectable={isConnectable}
            className="w-3 h-3 !bg-primary hover:w-4 hover:h-4 transition-all"
            style={{ right: -6 }}
          />
          
          {/* Node content */}
          <div className="space-y-2">
            <h3 className="font-semibold text-lg">{translatedTitle}</h3>
            <p className="text-sm text-muted-foreground line-clamp-3">{summary}</p>
            
            {/* Actions */}
            {type === 'document' ? (
              <DocumentNodeActions
                onViewDetails={() => setShowDetails(true)}
                onRegenerate={generateDocumentNode}
                isGenerating={isGenerating}
                t={(key: string) => t(key as any)}
              />
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
            
            {/* Error state */}
            {data.error && (
              <div className="text-sm text-destructive mt-2">
                {data.error}
              </div>
            )}
            
            {/* Processing state */}
            {data.isProcessing && (
              <div className="flex items-center justify-center mt-2">
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                <span className="text-sm text-muted-foreground">
                  {t('processing' as any)}
                </span>
              </div>
            )}
          </div>
        </Card>
      </div>
      
      {/* Details dialog */}
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
});

FlowNode.displayName = 'FlowNode';

/**
 * Document node specific actions
 */
const DocumentNodeActions = memo(({ 
  onViewDetails, 
  onRegenerate, 
  isGenerating, 
  t 
}: {
  onViewDetails: () => void;
  onRegenerate: () => void;
  isGenerating: boolean;
  t: (key: string) => string;
}) => {
  return (
    <div className="flex justify-between gap-2 mt-2">
      <Button
        variant="ghost"
        size="sm"
        className="flex-1"
        onClick={onViewDetails}
      >
        {t('viewDetails')}
        <ChevronRight className="w-4 h-4 ml-1" />
      </Button>
      <Button
        variant="outline"
        size="sm"
        className="flex-none"
        onClick={onRegenerate}
        disabled={isGenerating}
      >
        {isGenerating ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <RefreshCw className="w-4 h-4" />
        )}
      </Button>
    </div>
  );
});

DocumentNodeActions.displayName = 'DocumentNodeActions';
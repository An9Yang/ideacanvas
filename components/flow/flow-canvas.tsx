"use client";

import React, { useCallback, Suspense, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Connection, Edge, NodeChange, applyNodeChanges, Node as ReactFlowNode } from 'reactflow';
import { Node, NodeType } from '@/lib/types/flow';
import 'reactflow/dist/style.css';
import { useFlowStore } from '@/lib/stores/flow-store';
import { useI18nToast } from '@/hooks/use-i18n-toast';
import { Button } from '@/components/ui/button';
import { NODE_TYPES, EDGE_OPTIONS, FLOW_PROPS } from './flow-config';
import { PromptNode } from './prompt-node';
import { FlowToolbar } from './flow-toolbar';
import { generateCompletion } from '@/lib/services/openai-service';
import { useTranslation } from '@/hooks/useTranslation';

// 动态导入所有 ReactFlow 组件
const ReactFlowComponent = dynamic(
  async () => {
    const { default: ReactFlow, Background, Controls, Panel } = await import('reactflow');
    const Wrapper = ({ children, ...props }: any) => {
      const { t } = useTranslation();
      return (
        <ReactFlow {...props}>
          <Background color="#999" gap={16} />
          <Controls />
          <Panel position="top-right" className="space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const flowInstance = document.querySelector('.react-flow__viewport') as HTMLElement;
                if (flowInstance) {
                  flowInstance.style.transform = 'translate(0px, 0px) scale(1)';
                  window.dispatchEvent(new Event('resize'));
                }
              }}
            >
              {t('resetView')}
            </Button>
          </Panel>
          {children}
        </ReactFlow>
      );
    };
    return Wrapper;
  },
  {
    ssr: false,
    loading: () => {
      const { t } = useTranslation();
      return (
        <div className="h-full w-full flex items-center justify-center">
          <p>{t('loading')}</p>
        </div>
      );
    },
  }
);

export function FlowCanvas() {
  const [isClient, setIsClient] = useState(false);
  const { t } = useTranslation();
  const toast = useI18nToast();
  const { addNode } = useFlowStore();
  
  useEffect(() => {
    setIsClient(true);
  }, []);

  const {
    nodes,
    edges,
    updateNodes,
    connectNodes,
    removeNode,
    removeEdge,
  } = useFlowStore();

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      requestAnimationFrame(() => {
        const updatedNodes = applyNodeChanges(changes, nodes as ReactFlowNode[]);
        updateNodes(updatedNodes as Node[]);
      });
    },
    [nodes, updateNodes]
  );

  const onConnect = useCallback(
    (connection: Connection) => {
      if (connection.source && connection.target) {
        const existingEdge = edges.find(
          edge => edge.source === connection.source && edge.target === connection.target
        );
        
        if (existingEdge) {
          toast.error('nodeConnectError');
          return;
        }
        
        connectNodes(connection.source, connection.target);
        toast.success('nodeConnected');
      }
    },
    [connectNodes, edges, toast]
  );

  const onNodesDelete = useCallback((nodesToDelete: any[]) => {
    nodesToDelete.forEach(node => removeNode(node.id));
    toast.success('nodeDeleted');
  }, [removeNode, toast]);

  const onEdgesDelete = useCallback((edgesToDelete: Edge[]) => {
    edgesToDelete.forEach(edge => removeEdge(edge.id));
    toast.success('edgeDeleted');
  }, [removeEdge, toast]);
  
  // 处理添加节点
  const handleAddNode = useCallback((nodeType = 'product' as NodeType) => {
    // 计算视窗中心位置
    const reactFlowBounds = document.querySelector('.react-flow')?.getBoundingClientRect();
    if (!reactFlowBounds) return;
    
    const position = {
      x: reactFlowBounds.width / 2 - 75,
      y: reactFlowBounds.height / 2 - 75,
    };
    
    // 根据不同节点类型设置不同标题
    let nodeTitle = '';
    switch(nodeType) {
      case 'context':
        nodeTitle = '上下文节点';
        break;
      case 'external':
        nodeTitle = '外部服务节点';
        break;
      case 'guide':
        nodeTitle = '开发指南节点';
        break;
      case 'document':
        nodeTitle = '项目文档节点';
        break;
      default:
        nodeTitle = '新节点';
    }
    
    // 添加新节点
    addNode(position, nodeType as NodeType, nodeTitle, '');
    toast.success('nodeAdded' as any);
  }, [addNode, toast]);

  if (!isClient) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <p>{t('loading')}</p>
      </div>
    );
  }

  return (
    <div className="h-full w-full">
      <FlowToolbar onAddNode={handleAddNode} onExecuteFlow={() => {}} />
      <Suspense fallback={<div>{t('loading')}</div>}>
        <ReactFlowComponent
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onNodesDelete={onNodesDelete}
          onEdgesDelete={onEdgesDelete}
          onConnect={onConnect}
          nodeTypes={NODE_TYPES}
          defaultEdgeOptions={EDGE_OPTIONS}
          {...FLOW_PROPS}
          className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80"
        />
      </Suspense>

      {nodes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-background/50 backdrop-blur">
          <div className="text-center space-y-4 text-muted-foreground">
            <p className="text-lg font-medium">{t('canvasEmpty')}</p>
            <p className="text-sm">{t('enterRequirements')}</p>
          </div>
        </div>
      )}
    </div>
  );
}
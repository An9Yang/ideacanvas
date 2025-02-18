"use client";

import { useCallback, Suspense, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Connection, Edge, NodeChange, applyNodeChanges } from 'reactflow';
import { Node } from '@/lib/types/flow';
import 'reactflow/dist/style.css';
import { useFlowStore } from '@/lib/stores/flow-store';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { NODE_TYPES, EDGE_OPTIONS, FLOW_PROPS } from './flow-config';

// 动态导入所有 ReactFlow 组件
const ReactFlowComponent = dynamic(
  async () => {
    const { default: ReactFlow, Background, Controls, Panel } = await import('reactflow');
    const Wrapper = ({ children, ...props }: any) => (
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
            重置视图
          </Button>
        </Panel>
        {children}
      </ReactFlow>
    );
    return Wrapper;
  },
  {
    ssr: false,
    loading: () => (
      <div className="h-full w-full flex items-center justify-center">
        <p>加载中...</p>
      </div>
    ),
  }
);

export function FlowCanvas() {
  const [isClient, setIsClient] = useState(false);
  
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
        const updatedNodes = applyNodeChanges(changes, nodes as any);
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
          toast.error('节点已经连接');
          return;
        }
        
        connectNodes(connection.source, connection.target);
        toast.success('节点连接成功');
      }
    },
    [connectNodes, edges]
  );

  const onNodesDelete = useCallback((nodesToDelete: any[]) => {
    nodesToDelete.forEach(node => removeNode(node.id));
    toast.success('节点删除成功');
  }, [removeNode]);

  const onEdgesDelete = useCallback((edgesToDelete: Edge[]) => {
    edgesToDelete.forEach(edge => removeEdge(edge.id));
    toast.success('连线删除成功');
  }, [removeEdge]);

  if (!isClient) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <p>加载中...</p>
      </div>
    );
  }

  return (
    <div className="h-full w-full">
      <Suspense fallback={<div>加载中...</div>}>
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
            <p className="text-lg font-medium">画布为空</p>
            <p className="text-sm">请在上方输入框中输入您的需求</p>
          </div>
        </div>
      )}
    </div>
  );
}
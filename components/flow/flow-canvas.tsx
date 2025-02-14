"use client";

import { useCallback } from 'react';
import ReactFlow, {
  Background,
  Controls,
  Connection,
  Edge,
  NodeChange,
  applyNodeChanges,
  Panel,
  Node as ReactFlowNode,
  NodeProps,
  NodeTypes,
  MarkerType,
  ConnectionMode,
  useEdgesState,
  addEdge,
  EdgeChange,
  applyEdgeChanges,
} from 'reactflow';
import { Node, NodeType } from '@/lib/types/flow';
import 'reactflow/dist/style.css';
import { useFlowStore } from '@/lib/stores/flow-store';
import { FlowNode } from '@/components/flow/flow-node';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

const nodeTypes: NodeTypes = {
  product: FlowNode,
  external: FlowNode,
  context: FlowNode,
};

const flowStyle = {
  backgroundColor: 'var(--background)',
  width: '100vw',
  height: '100vh',
};

const defaultEdgeOptions = {
  type: 'bezier',
  animated: true,
  markerEnd: {
    type: MarkerType.ArrowClosed,
    width: 20,
    height: 20,
    color: '#666666',
  },
  style: {
    strokeWidth: 2,
    stroke: '#666666',
  },
  selectedStyle: {
    stroke: '#0ea5e9',
    strokeWidth: 3,
  },
} as const;

export function FlowCanvas() {
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
      const updatedNodes = applyNodeChanges(changes, nodes as any);
      updateNodes(updatedNodes as Node[]);
    },
    [nodes, updateNodes]
  );

  const onConnect = useCallback(
    (connection: Connection) => {
      if (connection.source && connection.target) {
        // 检查是否已存在连接
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

  return (
    <div className="h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onNodesDelete={nodes => {
          nodes.forEach(node => removeNode(node.id));
          toast.success('节点删除成功');
        }}
        onEdgesDelete={edges => {
          edges.forEach(edge => removeEdge(edge.id));
          toast.success('连线删除成功');
        }}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        connectionMode={ConnectionMode.Loose}
        minZoom={0.1}
        maxZoom={1.5}
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
        fitView
        style={flowStyle}
        className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80"
        deleteKeyCode={['Backspace', 'Delete']}
        multiSelectionKeyCode={['Meta', 'Shift']}
        selectionKeyCode="Shift"
      >
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
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const viewport = document.querySelector('.react-flow-viewport') as HTMLElement;
              if (viewport) {
                viewport.style.transform = 'translate(0px, 0px) scale(1)';
                window.dispatchEvent(new Event('resize'));
              }
            }}
          >
            重置视图
          </Button>
        </Panel>
      </ReactFlow>

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
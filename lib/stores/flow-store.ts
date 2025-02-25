import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { MarkerType } from 'reactflow';
import type { FlowState, Flow, Node, Edge, NodeResult, NodeType, HistoryState } from '@/lib/types/flow';
import { generateFlowFromPrompt } from '@/lib/services/azure-ai';

const MAX_HISTORY = 10; // 减少历史记录数量限制

// 优化清理历史记录函数
const cleanHistory = (history: HistoryState[], currentIndex: number) => {
  // 如果历史记录超过限制，只保留最近的记录
  if (history.length > MAX_HISTORY) {
    const start = Math.max(0, history.length - MAX_HISTORY);
    return history.slice(start);
  }
  return history;
};

// 优化节点数据清理函数
const cleanNodeData = (nodes: Node[]) => 
  nodes.map(({ id, type, position, data }) => ({
    id,
    type,
    position: {
      x: Math.round(position.x * 100) / 100, // 只保留两位小数
      y: Math.round(position.y * 100) / 100
    },
    data: {
      title: data.title,
      content: data.content?.slice(0, 4000) // 限制内容长度
    },
    draggable: true
  }));

export const useFlowStore = create<FlowState>()(
  persist(
    (set, get) => ({
      // 初始状态
      flows: [],
      currentFlow: null,
      nodes: [],
      edges: [],
      history: [],
      currentHistoryIndex: -1,

      // 节点管理
      addNode: (position, type = 'product', title = '新节点', content = '') => {
        const { nodes, edges, history = [], currentHistoryIndex = -1 } = get();
        const newNode = {
          id: uuidv4(),
          type,
          position,
          data: {
            title,
            content,
            results: [],
            isProcessing: false,
          },
          draggable: true,
        };

        const newHistory = {
          nodes: cleanNodeData(nodes),
          edges,
          timestamp: Date.now(),
        };

        const newHistoryList = cleanHistory(
          [...history.slice(0, currentHistoryIndex + 1), newHistory],
          currentHistoryIndex + 1
        );

        set({
          nodes: [...nodes, newNode],
          history: newHistoryList,
          currentHistoryIndex: newHistoryList.length - 1,
        });
      },

      updateNodeResults: (id, results) => {
        const { nodes } = get();
        const updatedNodes = nodes.map((node) =>
          node.id === id ? { ...node, data: { ...node.data, results } } : node
        );
        set({ nodes: updatedNodes });
      },

      setNodeProcessing: (id, isProcessing) => {
        const { nodes } = get();
        const updatedNodes = nodes.map((node) =>
          node.id === id ? { ...node, data: { ...node.data, isProcessing } } : node
        );
        set({ nodes: updatedNodes });
      },

      setNodeError: (id, error) => {
        const { nodes } = get();
        const updatedNodes = nodes.map((node) =>
          node.id === id ? { ...node, data: { ...node.data, error } } : node
        );
        set({ nodes: updatedNodes });
      },

      updateNodePrompt: (id, prompt) => {
        const { nodes } = get();
        const updatedNodes = nodes.map((node) =>
          node.id === id ? { ...node, data: { ...node.data, prompt } } : node
        );
        set({ nodes: updatedNodes });
      },

      updateNodeResult: (id, result) => {
        const { nodes } = get();
        const updatedNodes = nodes.map((node) =>
          node.id === id ? { ...node, data: { ...node.data, result } } : node
        );
        set({ nodes: updatedNodes });
      },


      generateFlow: async (prompt: string) => {
        try {
          const flowData = await generateFlowFromPrompt(prompt);
          
          // 生成节点ID的映射
          const idMap = new Map();
          flowData.nodes.forEach((node) => {
            idMap.set(node.title, uuidv4());
          });

          // 创建新节点，使用映射的ID
          const nodes = flowData.nodes.map((node) => ({
            id: idMap.get(node.title),
            type: node.type,
            position: node.position,
            data: {
              title: node.title,
              content: node.content,
            },
            draggable: true,
          }));

          // 创建新边，使用映射的ID
          const edges = flowData.edges.map((edge) => ({
            id: uuidv4(),
            source: idMap.get(edge.source),
            target: idMap.get(edge.target),
            type: 'default',
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
          }));

          // 创建新的历史记录
          const { history = [], currentHistoryIndex = -1 } = get();
          const newHistory = {
            nodes: cleanNodeData(nodes),
            edges,
            timestamp: Date.now(),
          };

          const newHistoryList = cleanHistory(
            [...history.slice(0, currentHistoryIndex + 1), newHistory],
            currentHistoryIndex + 1
          );

          // 更新状态
          const cleanedNodes = cleanNodeData(nodes);
          set({
            nodes: cleanedNodes,
            edges,
            history: newHistoryList,
            currentHistoryIndex: newHistoryList.length - 1,
          });
        } catch (error) {
          console.error('Failed to generate flow:', error);
          throw error;
        }
      },

      updateNodes: (nodes) => {
        const { nodes: oldNodes, edges, history = [], currentHistoryIndex = -1 } = get();
        const newHistory = {
          nodes,
          edges,
          timestamp: Date.now(),
        };

        set({
          nodes,
          history: [...history.slice(0, currentHistoryIndex + 1), newHistory],
          currentHistoryIndex: currentHistoryIndex + 1,
        });
      },

      updateEdges: (edges) => {
        const { nodes, edges: oldEdges, history = [], currentHistoryIndex = -1 } = get();
        const newHistory = {
          nodes,
          edges: oldEdges,
          timestamp: Date.now(),
        };

        set({
          edges,
          history: [...history.slice(0, currentHistoryIndex + 1), newHistory],
          currentHistoryIndex: currentHistoryIndex + 1,
        });
      },

      updateNodeContent: (id, content) => {
        const { nodes, edges, history = [], currentHistoryIndex = -1 } = get();
        const newHistory = {
          nodes,
          edges,
          timestamp: Date.now(),
        };

        const updatedNodes = nodes.map((node) =>
          node.id === id ? { ...node, data: { ...node.data, content } } : node
        );

        set({
          nodes: updatedNodes,
          history: [...history.slice(0, currentHistoryIndex + 1), newHistory],
          currentHistoryIndex: currentHistoryIndex + 1,
        });
      },

      connectNodes: (source, target) => {
        const { nodes, edges, history = [], currentHistoryIndex = -1 } = get();
        const newEdge: Edge = {
          id: uuidv4(),
          source,
          target,
          type: 'default',
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
        };

        const newHistory = {
          nodes: cleanNodeData(nodes),
          edges,
          timestamp: Date.now(),
        };

        const newHistoryList = cleanHistory(
          [...history.slice(0, currentHistoryIndex + 1), newHistory],
          currentHistoryIndex + 1
        );

        set({
          edges: [...edges, newEdge],
          history: newHistoryList,
          currentHistoryIndex: newHistoryList.length - 1,
        });
      },

      removeNode: (id) => {
        const { nodes, edges, history = [], currentHistoryIndex = -1 } = get();
        const newHistory = {
          nodes: cleanNodeData(nodes),
          edges,
          timestamp: Date.now(),
        };

        const newHistoryList = cleanHistory(
          [...history.slice(0, currentHistoryIndex + 1), newHistory],
          currentHistoryIndex + 1
        );

        set({
          nodes: nodes.filter((node) => node.id !== id),
          edges: edges.filter(
            (edge) => edge.source !== id && edge.target !== id
          ),
          history: newHistoryList,
          currentHistoryIndex: newHistoryList.length - 1,
        });
      },

      removeEdge: (id) => {
        const { nodes, edges, history = [], currentHistoryIndex = -1 } = get();
        const newHistory = {
          nodes: cleanNodeData(nodes),
          edges,
          timestamp: Date.now(),
        };

        const newHistoryList = cleanHistory(
          [...history.slice(0, currentHistoryIndex + 1), newHistory],
          currentHistoryIndex + 1
        );

        set({
          edges: edges.filter((edge) => edge.id !== id),
          history: newHistoryList,
          currentHistoryIndex: newHistoryList.length - 1,
        });
      },

      saveFlow: (name: string) => {
        const { nodes, edges } = get();
        const flow = {
          id: uuidv4(),
          name,
          nodes,
          edges,
          createdAt: new Date().toISOString(),
        };

        set((state) => ({
          flows: [...state.flows, flow],
          currentFlow: flow,
        }));

        return flow;
      },

      loadFlow: (id: string) => {
        const { flows } = get();
        const flow = flows.find((f) => f.id === id);
        if (flow) {
          set({
            currentFlow: flow,
            nodes: flow.nodes,
            edges: flow.edges,
            history: [],
            currentHistoryIndex: -1,
          });
        }
      },

      deleteFlow: (id: string) => {
        set((state) => ({
          flows: state.flows.filter((f) => f.id !== id),
          currentFlow:
            state.currentFlow?.id === id ? null : state.currentFlow,
        }));
      },

      undo: () => {
        const { currentHistoryIndex = -1, history = [] } = get();
        if (currentHistoryIndex > 0) {
          const previousState = history[currentHistoryIndex - 1];
          set({
            nodes: previousState.nodes,
            edges: previousState.edges,
            currentHistoryIndex: currentHistoryIndex - 1,
          });
          return true;
        }
        return false;
      },

      redo: () => {
        const { currentHistoryIndex = -1, history = [] } = get();
        if (currentHistoryIndex < history.length - 1) {
          const nextState = history[currentHistoryIndex + 1];
          set({
            nodes: nextState.nodes,
            edges: nextState.edges,
            currentHistoryIndex: currentHistoryIndex + 1,
          });
          return true;
        }
        return false;
      },
    }),
    {
      name: 'flow-storage',
    }
  )
);
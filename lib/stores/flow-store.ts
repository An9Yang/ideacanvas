import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { MarkerType } from 'reactflow';
import type { FlowState, Flow, Node, Edge, NodeResult, NodeType, HistoryState } from '@/lib/types/flow';
import { generateFlowFromPrompt } from '@/lib/services/azure-ai';
import { APP_CONFIG } from '@/lib/config';
import { flowGenerationService } from '@/lib/services/flow-generation.service';
import { cleanNodeData, addToHistory, createHistoryState } from '@/lib/utils/history.utils';
import { cloudStorageService } from '@/lib/services/cloud-storage.service';

// History utilities are now imported from history.utils.ts

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
      generationProgress: { status: '', progress: 0 },
      isGenerating: false,

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

        const { history: newHistoryList } = addToHistory(
          history,
          currentHistoryIndex,
          newHistory
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

      setGenerationProgress: (status: string, progress: number) => {
        set({ 
          generationProgress: { status, progress },
          isGenerating: progress < 100
        });
      },

      generateFlow: async (prompt: string) => {
        try {
          // 设置生成状态
          set({ isGenerating: true });
          
          // Step 1: Generate flow from AI with progress callback
          const flowData = await generateFlowFromPrompt(prompt, (status, progress) => {
            get().setGenerationProgress(status, progress);
          });
          
          // Step 2: Process flow data using service
          const { nodes, edges, documentNode, documentEdges } = 
            flowGenerationService.processFlowData(flowData);
          
          // Step 3: Combine all nodes and edges
          const allNodes = [...nodes, documentNode];
          const allEdges = [...edges, ...documentEdges];
          
          // Step 4: Update history
          const { history = [], currentHistoryIndex = -1 } = get();
          const newHistoryState = createHistoryState(allNodes, allEdges);
          const { history: newHistory, index: newIndex } = addToHistory(
            history,
            currentHistoryIndex,
            newHistoryState
          );
          
          // Step 5: Update store state
          set({
            nodes: cleanNodeData(allNodes),
            edges: allEdges,
            history: newHistory,
            currentHistoryIndex: newIndex,
          });
          
          // Step 6: Generate document content asynchronously
          setTimeout(async () => {
            try {
              const documentContent = flowGenerationService.generateDocumentContent(nodes, edges);
              get().updateNodeContent(documentNode.id, documentContent);
            } catch (error) {
              console.error('生成文档内容失败:', error);
              get().updateNodeContent(documentNode.id, '文档生成失败');
            }
          }, 100);
          
          // Step 7: Save to cloud storage (async, non-blocking)
          setTimeout(async () => {
            try {
              const flowName = `Flow - ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`;
              await cloudStorageService.saveFlow({
                name: flowName,
                nodes: allNodes,
                edges: allEdges,
              });
              console.log('Flow saved to cloud storage');
            } catch (error) {
              console.error('Failed to save flow to cloud:', error);
              // Don't throw - cloud save is optional
            }
          }, 200);
        } catch (error) {
          console.error('Failed to generate flow:', error);
          // 重置生成状态
          set({ 
            isGenerating: false,
            generationProgress: { status: '生成失败', progress: 0 }
          });
          throw error;
        } finally {
          // 确保重置生成状态
          set({ isGenerating: false });
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

        const { history: newHistoryList } = addToHistory(
          history,
          currentHistoryIndex,
          newHistory
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

        const { history: newHistoryList } = addToHistory(
          history,
          currentHistoryIndex,
          newHistory
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

        const { history: newHistoryList } = addToHistory(
          history,
          currentHistoryIndex,
          newHistory
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
      
      loadCloudFlow: async (flowId: string) => {
        try {
          // Fetch flow from cloud storage
          const response = await fetch(`/api/flows/${flowId}`);
          if (!response.ok) {
            throw new Error('Failed to load cloud flow');
          }
          const cloudFlow = await response.json();
          
          // Ensure nodes have proper data structure
          const nodes = (cloudFlow.nodes || []).map((node: any) => {
            // If node doesn't have data property, create it from title/content
            if (!node.data) {
              return {
                ...node,
                data: {
                  title: node.title || 'Untitled',
                  content: node.content || '',
                updateNodeContent: get().updateNodeContent,
              }
            };
          }
          // If data exists but missing updateNodeContent
          return {
            ...node,
            data: {
              ...node.data,
              updateNodeContent: get().updateNodeContent,
            }
          };
        });
        
        set({
          nodes,
          edges: cloudFlow.edges || [],
          history: [],
          currentHistoryIndex: -1,
        });
        } catch (error) {
          console.error('Error loading cloud flow:', error);
          throw error;
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
      storage: {
        getItem: (name) => {
          try {
            if (typeof window === 'undefined') {
              return null;
            }
            const str = localStorage.getItem(name);
            if (!str) return null;
            
            const parsed = JSON.parse(str);
            // Ensure nodes have proper data structure when loading
            if (parsed?.state?.nodes) {
              parsed.state.nodes = parsed.state.nodes.map((node: any) => ({
                ...node,
                data: node.data || {
                  title: node.title || 'Untitled',
                  content: node.content || '',
                }
              }));
            }
            
            return parsed;
          } catch (error) {
            console.error('Failed to load from localStorage:', error);
            return null;
          }
        },
        setItem: (name, value) => {
          try {
            if (typeof window === 'undefined') {
              return;
            }
            // Only store essential data to minimize storage usage
            const minimalState = {
              ...value,
              state: {
                ...value.state,
                // Don't store flows array (redundant with cloud storage)
                flows: [],
                // Limit history to last 3 items
                history: (value.state.history || []).slice(-3),
                // Store minimal node data
                nodes: (value.state.nodes || []).map((node: any) => ({
                  id: node.id,
                  type: node.type,
                  position: node.position,
                  // Store minimal data to ensure structure consistency
                  data: {
                    title: node.data?.title || '',
                    content: node.data?.content || '',
                  }
                })),
                edges: (value.state.edges || []).map((edge: any) => ({
                  id: edge.id,
                  source: edge.source,
                  target: edge.target,
                })),
              }
            };
            
            localStorage.setItem(name, JSON.stringify(minimalState));
          } catch (error) {
            console.error('localStorage quota exceeded:', error);
            
            // If still failing, clear localStorage and continue
            if (error instanceof DOMException && error.name === 'QuotaExceededError') {
              try {
                if (typeof window !== 'undefined') {
                  localStorage.clear();
                  console.log('Cleared localStorage due to quota exceeded');
                }
              } catch (clearError) {
                console.error('Failed to clear localStorage:', clearError);
              }
            }
          }
        },
        removeItem: (name) => {
          if (typeof window !== 'undefined') {
            localStorage.removeItem(name);
          }
        },
      },
    }
  )
);
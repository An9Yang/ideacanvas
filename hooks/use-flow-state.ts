import { useCallback, useMemo } from 'react';
import { useFlowStore } from '@/lib/stores/flow-store';
import { Node, Edge } from '@/lib/types/flow';

/**
 * Custom hook for flow state management with selectors
 */
export function useFlowState() {
  // Use selectors to prevent unnecessary re-renders
  const nodes = useFlowStore((state) => state.nodes);
  const edges = useFlowStore((state) => state.edges);
  const history = useFlowStore((state) => state.history);
  const currentHistoryIndex = useFlowStore((state) => state.currentHistoryIndex);
  
  // Actions
  const generateFlow = useFlowStore((state) => state.generateFlow);
  const updateNodes = useFlowStore((state) => state.updateNodes);
  const updateEdges = useFlowStore((state) => state.updateEdges);
  const updateNodeContent = useFlowStore((state) => state.updateNodeContent);
  const undo = useFlowStore((state) => state.undo);
  const redo = useFlowStore((state) => state.redo);
  
  // Computed values
  const canUndo = useMemo(() => {
    return (currentHistoryIndex ?? -1) > 0 && (history?.length ?? 0) > 1;
  }, [currentHistoryIndex, history]);
  
  const canRedo = useMemo(() => {
    return (currentHistoryIndex ?? -1) < (history?.length ?? 0) - 1;
  }, [currentHistoryIndex, history]);
  
  // Node helpers
  const getNodeById = useCallback((id: string): Node | undefined => {
    return nodes.find(node => node.id === id);
  }, [nodes]);
  
  const getConnectedNodes = useCallback((nodeId: string): Node[] => {
    const connectedNodeIds = new Set<string>();
    
    // Find all edges connected to this node
    edges.forEach(edge => {
      if (edge.source === nodeId) {
        connectedNodeIds.add(edge.target);
      }
      if (edge.target === nodeId) {
        connectedNodeIds.add(edge.source);
      }
    });
    
    // Return connected nodes
    return nodes.filter(node => connectedNodeIds.has(node.id));
  }, [nodes, edges]);
  
  return {
    // State
    nodes,
    edges,
    history,
    currentHistoryIndex,
    
    // Computed
    canUndo,
    canRedo,
    
    // Actions
    generateFlow,
    updateNodes,
    updateEdges,
    updateNodeContent,
    undo,
    redo,
    
    // Helpers
    getNodeById,
    getConnectedNodes
  };
}

/**
 * Hook for individual node state
 */
export function useNodeState(nodeId: string) {
  const node = useFlowStore((state) => 
    state.nodes.find(n => n.id === nodeId)
  );
  
  const updateContent = useFlowStore((state) => state.updateNodeContent);
  const setNodeProcessing = useFlowStore((state) => state.setNodeProcessing);
  const setNodeError = useFlowStore((state) => state.setNodeError);
  
  const updateNodeContent = useCallback((content: string) => {
    updateContent(nodeId, content);
  }, [nodeId, updateContent]);
  
  const setProcessing = useCallback((isProcessing: boolean) => {
    setNodeProcessing?.(nodeId, isProcessing);
  }, [nodeId, setNodeProcessing]);
  
  const setError = useCallback((error: string) => {
    setNodeError?.(nodeId, error);
  }, [nodeId, setNodeError]);
  
  return {
    node,
    updateNodeContent,
    setProcessing,
    setError
  };
}
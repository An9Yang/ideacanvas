import { APP_CONFIG } from '@/lib/config';
import { HistoryState, Node, Edge } from '@/lib/types/flow';

/**
 * Clean node data to optimize storage
 */
export function cleanNodeData(nodes: any[]): Node[] {
  return nodes.map(node => ({
    ...node,
    position: {
      x: Math.round(node.position.x * 100) / 100,
      y: Math.round(node.position.y * 100) / 100
    },
    data: {
      ...node.data,
      content: typeof node.data?.content === 'string'
        ? node.data.content.slice(0, APP_CONFIG.FLOW.CONTENT_MAX_LENGTH)
        : typeof node.data?.content === 'object'
          ? JSON.stringify(node.data.content).slice(0, APP_CONFIG.FLOW.CONTENT_MAX_LENGTH)
          : String(node.data?.content || '').slice(0, APP_CONFIG.FLOW.CONTENT_MAX_LENGTH)
    }
  }));
}

/**
 * Clean history to maintain size limits
 */
export function cleanHistory(history: HistoryState[], currentIndex: number): HistoryState[] {
  const maxHistory = APP_CONFIG.FLOW.HISTORY_LIMIT;
  
  if (history.length <= maxHistory) {
    return history;
  }
  
  // Keep half before current and half after current
  const halfMax = Math.floor(maxHistory / 2);
  const start = Math.max(0, currentIndex - halfMax);
  const end = Math.min(history.length, start + maxHistory);
  
  return history.slice(start, end);
}

/**
 * Create a new history state
 */
export function createHistoryState(nodes: Node[], edges: Edge[]): HistoryState {
  return {
    nodes: cleanNodeData(nodes),
    edges,
    timestamp: Date.now(),
  };
}

/**
 * Add new history state and maintain history limits
 */
export function addToHistory(
  currentHistory: HistoryState[],
  currentIndex: number,
  newState: HistoryState
): { history: HistoryState[]; index: number } {
  // Remove any history after current index (for new branches)
  const trimmedHistory = currentHistory.slice(0, currentIndex + 1);
  
  // Add new state
  const newHistory = [...trimmedHistory, newState];
  
  // Clean history to maintain limits
  const cleanedHistory = cleanHistory(newHistory, newHistory.length - 1);
  
  return {
    history: cleanedHistory,
    index: cleanedHistory.length - 1
  };
}
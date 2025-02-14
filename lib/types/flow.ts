export type NodeType = 'product' | 'external' | 'context';

export interface Flow {
  id: string;
  name: string;
  nodes: Node[];
  edges: Edge[];
  createdAt: string;
}

export interface NodeResult {
  fileId: string;
  result: string;
}

export interface Node {
  id: string;
  type: NodeType;
  position: { x: number; y: number };
  data: {
    title: string;
    content: string;
    results?: NodeResult[];
    isProcessing?: boolean;
    error?: string;
    updateNodeContent?: (id: string, content: string) => void;
  };
  draggable: boolean;
}

import { Edge as ReactFlowEdge } from 'reactflow';

export type Edge = ReactFlowEdge;

export interface HistoryState {
  nodes: Node[];
  edges: Edge[];
  timestamp: number;
}

export interface GeneratedNode {
  id: string;
  type: NodeType;
  title: string;
  content: string;
  position: { x: number; y: number };
}

export interface GeneratedEdge {
  source: string;
  target: string;
}

export interface GeneratedFlow {
  nodes: GeneratedNode[];
  edges: GeneratedEdge[];
}

export interface FlowState {
  flows: Flow[];
  currentFlow: Flow | null;
  nodes: Node[];
  edges: Edge[];
  addNode: (position: { x: number; y: number }, type?: NodeType, title?: string, content?: string) => void;
  updateNodes: (nodes: Node[]) => void;
  updateEdges: (edges: Edge[]) => void;
  updateNodeContent: (id: string, content: string) => void;
  updateNodeResults: (id: string, results: NodeResult[]) => void;
  setNodeProcessing: (id: string, isProcessing: boolean) => void;
  setNodeError: (id: string, error: string) => void;
  connectNodes: (source: string, target: string) => void;
  removeNode: (id: string) => void;
  removeEdge: (id: string) => void;
  generateFlow: (prompt: string) => Promise<void>;
  saveFlow: (name: string) => Flow;
  loadFlow: (id: string) => void;
  deleteFlow: (id: string) => void;
  undo?: () => boolean;
  redo?: () => boolean;
  history?: HistoryState[];
  currentHistoryIndex?: number;
}
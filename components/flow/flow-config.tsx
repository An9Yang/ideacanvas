import { NodeTypes, MarkerType, ConnectionMode, ReactFlowProps } from 'reactflow';
import { FlowNode } from './flow-node';

export const NODE_TYPES: NodeTypes = {
  product: FlowNode,
  external: FlowNode,
  context: FlowNode,
};

export const EDGE_OPTIONS = {
  type: 'default',
  animated: false, // 禁用动画以提高性能
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

export const FLOW_PROPS: Partial<ReactFlowProps> = {
  connectionMode: ConnectionMode.Loose,
  minZoom: 0.1,
  maxZoom: 1.5,
  defaultViewport: { x: 0, y: 0, zoom: 1 },
  fitView: true,
  deleteKeyCode: ['Backspace', 'Delete'] as string[],
  multiSelectionKeyCode: ['Meta', 'Shift'] as string[],
  selectionKeyCode: 'Shift',
}; 
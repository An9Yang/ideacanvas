import { NodeTypes } from 'reactflow';
import { FlowNode } from './flow-node';

export const createNodeTypes = (): NodeTypes => ({
  product: FlowNode,
  external: FlowNode,
  context: FlowNode,
  guide: FlowNode,
  document: FlowNode,
}); 
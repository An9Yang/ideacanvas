"use client";

import { NodeProps } from 'reactflow';
import { FlowNode } from './flow-node';
import { NodeType } from '@/lib/types/flow';

/**
 * Wrapper component to handle ReactFlow's generic NodeProps
 * and convert to our typed FlowNodeProps
 */
export function createNodeComponent(nodeType: NodeType) {
  return function NodeWrapper(props: NodeProps) {
    return <FlowNode {...props} type={nodeType} />;
  };
}

// Create typed node components
export const ProductNode = createNodeComponent('product');
export const ExternalNode = createNodeComponent('external');
export const ContextNode = createNodeComponent('context');
export const GuideNode = createNodeComponent('guide');
export const DocumentNode = createNodeComponent('document');
import { NodeTypes } from 'reactflow';
import { 
  ProductNode,
  ExternalNode,
  ContextNode,
  GuideNode,
  DocumentNode
} from './flow-node-wrapper';

export const createNodeTypes = (): NodeTypes => ({
  product: ProductNode,
  external: ExternalNode,
  context: ContextNode,
  guide: GuideNode,
  document: DocumentNode,
}); 
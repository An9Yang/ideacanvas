import { v4 as uuidv4 } from 'uuid';
import { MarkerType } from 'reactflow';
import { NodeType, GeneratedFlow, GeneratedNode, GeneratedEdge } from '@/lib/types/flow';
import { NODE_COLORS } from '@/lib/config';

export interface ProcessedNode {
  id: string;
  type: NodeType;
  position: { x: number; y: number };
  data: {
    title: string;
    content: string;
  };
  draggable: boolean;
}

export interface ProcessedEdge {
  id: string;
  source: string;
  target: string;
  type: string;
  animated: boolean;
  markerEnd: {
    type: MarkerType;
    width: number;
    height: number;
    color: string;
  };
  style: {
    strokeWidth: number;
    stroke: string;
  };
}

/**
 * Service for processing and transforming flow generation data
 */
export class FlowGenerationService {
  /**
   * Create ID mapping for nodes
   */
  private createNodeIdMapping(nodes: GeneratedNode[]): Map<string, string> {
    const idMap = new Map<string, string>();
    nodes.forEach((node) => {
      const newId = uuidv4();
      // Map the original ID to the new ID
      idMap.set(node.id, newId);
      // Also map the title if it exists (for edge references)
      const title = node.title || node.data?.label || node.data?.title;
      if (title && title !== node.id) {
        idMap.set(title, newId);
      }
    });
    return idMap;
  }

  /**
   * Transform generated nodes to processed nodes
   */
  private transformNodes(generatedNodes: GeneratedNode[], idMap: Map<string, string>): ProcessedNode[] {
    return generatedNodes.map((node) => {
      // Try to get title from various possible locations
      const title = node.title || node.data?.label || node.data?.title || 'Untitled';
      // Try to get content from various possible locations
      const content = node.content || node.data?.content || '';
      const nodeId = idMap.get(node.id) || uuidv4();
      
      return {
        id: nodeId,
        type: node.type,
        position: node.position,
        data: {
          title: title,
          content: content,
        },
        draggable: true,
      };
    });
  }

  /**
   * Transform generated edges to processed edges
   */
  private transformEdges(generatedEdges: GeneratedEdge[], idMap: Map<string, string>): ProcessedEdge[] {
    return generatedEdges
      .map((edge) => {
        const sourceId = idMap.get(edge.source);
        const targetId = idMap.get(edge.target);
        
        // Skip edges if source or target not found
        if (!sourceId || !targetId) {
          console.warn(`Edge skipped: source="${edge.source}" target="${edge.target}" not found in ID map`);
          return null;
        }
        
        return {
          id: uuidv4(),
          source: sourceId,
          target: targetId,
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
      })
      .filter((edge): edge is ProcessedEdge => edge !== null);
  }

  /**
   * Create document node
   */
  private createDocumentNode(nodes: ProcessedNode[]): ProcessedNode {
    const documentNodeId = uuidv4();
    const maxX = Math.max(...nodes.map(n => n.position.x));
    const maxY = Math.max(...nodes.map(n => n.position.y));

    return {
      id: documentNodeId,
      type: 'document' as NodeType,
      position: {
        x: maxX + 300,
        y: maxY + 100
      },
      data: {
        title: '项目文档',
        content: '正在生成项目文档...',
      },
      draggable: true
    };
  }

  /**
   * Create edges from context nodes to document node
   */
  private createDocumentEdges(nodes: ProcessedNode[], documentNodeId: string): ProcessedEdge[] {
    const contextNodes = nodes.filter(node => node.type === 'context');
    
    return contextNodes.map(node => ({
      id: uuidv4(),
      source: node.id,
      target: documentNodeId,
      type: 'default',
      animated: false,
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 20,
        height: 20,
        color: '#66bb6a',
      },
      style: {
        strokeWidth: 1.5,
        stroke: '#66bb6a',
      },
    }));
  }

  /**
   * Generate document content
   */
  generateDocumentContent(nodes: ProcessedNode[], edges: ProcessedEdge[]): string {
    let documentContent = '# 项目开发文档\n\n';
    
    // Add nodes information
    nodes.forEach((node, index) => {
      documentContent += `## ${index + 1}. ${node.data.title}\n\n`;
      
      if (node.data && node.data.content) {
        let content = node.data.content;
        if (typeof content === 'object') {
          try {
            content = JSON.stringify(content, null, 2);
          } catch (e) {
            content = '无法显示内容';
          }
        }
        documentContent += `${content}\n\n`;
      }
    });
    
    // Add edges information
    documentContent += '## 组件之间的关系\n\n';
    edges.forEach((edge, index) => {
      const sourceNode = nodes.find(n => n.id === edge.source);
      const targetNode = nodes.find(n => n.id === edge.target);
      
      if (sourceNode && targetNode) {
        documentContent += `${index + 1}. **${sourceNode.data.title}** -> **${targetNode.data.title}**\n\n`;
      }
    });
    
    return documentContent;
  }

  /**
   * Process generated flow data
   */
  processFlowData(flowData: GeneratedFlow): {
    nodes: ProcessedNode[];
    edges: ProcessedEdge[];
    documentNode: ProcessedNode;
    documentEdges: ProcessedEdge[];
  } {
    const idMap = this.createNodeIdMapping(flowData.nodes);
    const nodes = this.transformNodes(flowData.nodes, idMap);
    const edges = this.transformEdges(flowData.edges, idMap);
    const documentNode = this.createDocumentNode(nodes);
    const documentEdges = this.createDocumentEdges(nodes, documentNode.id);

    return {
      nodes,
      edges,
      documentNode,
      documentEdges
    };
  }
}

export const flowGenerationService = new FlowGenerationService();
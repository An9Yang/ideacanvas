import { Edge } from 'reactflow';
import { ParsedNode } from '../types';

export interface FlowStructure {
  pages: PageStructure[];
  apis: APIStructure[];
  dataModels: DataModelStructure[];
  navigation: NavigationStructure;
}

export interface PageStructure {
  id: string;
  node: ParsedNode;
  connectedAPIs: string[];
  connectedData: string[];
  nextPages: string[];
}

export interface APIStructure {
  id: string;
  node: ParsedNode;
  connectedPages: string[];
  dataModels: string[];
}

export interface DataModelStructure {
  id: string;
  node: ParsedNode;
  usedByPages: string[];
  usedByAPIs: string[];
}

export interface NavigationStructure {
  mainPages: string[];
  flows: NavigationFlow[];
}

export interface NavigationFlow {
  from: string;
  to: string;
  trigger?: string;
}

export class FlowAnalyzer {
  analyze(nodes: ParsedNode[], edges: Edge[]): FlowStructure {
    const pages: PageStructure[] = [];
    const apis: APIStructure[] = [];
    const dataModels: DataModelStructure[] = [];
    const navigation: NavigationStructure = {
      mainPages: [],
      flows: []
    };

    // 分类节点
    for (const node of nodes) {
      switch (node.type) {
        case 'page':
          pages.push(this.createPageStructure(node, edges));
          break;
        case 'api':
          apis.push(this.createAPIStructure(node, edges));
          break;
        case 'data':
          dataModels.push(this.createDataModelStructure(node, edges));
          break;
      }
    }

    // 分析导航结构
    navigation.mainPages = this.findMainPages(pages, edges);
    navigation.flows = this.analyzeNavigationFlows(edges, nodes);

    // 建立连接关系
    this.establishConnections(pages, apis, dataModels, edges);

    return {
      pages,
      apis,
      dataModels,
      navigation
    };
  }

  private createPageStructure(node: ParsedNode, edges: Edge[]): PageStructure {
    return {
      id: node.id,
      node,
      connectedAPIs: [],
      connectedData: [],
      nextPages: []
    };
  }

  private createAPIStructure(node: ParsedNode, edges: Edge[]): APIStructure {
    return {
      id: node.id,
      node,
      connectedPages: [],
      dataModels: []
    };
  }

  private createDataModelStructure(node: ParsedNode, edges: Edge[]): DataModelStructure {
    return {
      id: node.id,
      node,
      usedByPages: [],
      usedByAPIs: []
    };
  }

  private findMainPages(pages: PageStructure[], edges: Edge[]): string[] {
    const mainPages: string[] = [];
    const pageIds = pages.map(p => p.id);
    
    // 找出没有入边的页面作为主页面
    for (const pageId of pageIds) {
      const hasIncomingEdge = edges.some(edge => 
        edge.target === pageId && pageIds.includes(edge.source)
      );
      
      if (!hasIncomingEdge) {
        mainPages.push(pageId);
      }
    }

    // 如果没有找到主页面，选择第一个页面
    if (mainPages.length === 0 && pages.length > 0) {
      mainPages.push(pages[0].id);
    }

    return mainPages;
  }

  private analyzeNavigationFlows(edges: Edge[], nodes: ParsedNode[]): NavigationFlow[] {
    const flows: NavigationFlow[] = [];
    const pageNodes = nodes.filter(n => n.type === 'page');
    const pageIds = new Set(pageNodes.map(n => n.id));

    for (const edge of edges) {
      if (pageIds.has(edge.source) && pageIds.has(edge.target)) {
        flows.push({
          from: edge.source,
          to: edge.target,
          trigger: edge.label || undefined
        });
      }
    }

    return flows;
  }

  private establishConnections(
    pages: PageStructure[],
    apis: APIStructure[],
    dataModels: DataModelStructure[],
    edges: Edge[]
  ): void {
    const pageMap = new Map(pages.map(p => [p.id, p]));
    const apiMap = new Map(apis.map(a => [a.id, a]));
    const dataMap = new Map(dataModels.map(d => [d.id, d]));

    for (const edge of edges) {
      const source = edge.source;
      const target = edge.target;

      // Page -> API
      if (pageMap.has(source) && apiMap.has(target)) {
        pageMap.get(source)!.connectedAPIs.push(target);
        apiMap.get(target)!.connectedPages.push(source);
      }

      // API -> Page
      if (apiMap.has(source) && pageMap.has(target)) {
        apiMap.get(source)!.connectedPages.push(target);
        pageMap.get(target)!.connectedAPIs.push(source);
      }

      // Page -> Data
      if (pageMap.has(source) && dataMap.has(target)) {
        pageMap.get(source)!.connectedData.push(target);
        dataMap.get(target)!.usedByPages.push(source);
      }

      // Data -> Page
      if (dataMap.has(source) && pageMap.has(target)) {
        dataMap.get(source)!.usedByPages.push(target);
        pageMap.get(target)!.connectedData.push(source);
      }

      // API -> Data
      if (apiMap.has(source) && dataMap.has(target)) {
        apiMap.get(source)!.dataModels.push(target);
        dataMap.get(target)!.usedByAPIs.push(source);
      }

      // Data -> API
      if (dataMap.has(source) && apiMap.has(target)) {
        dataMap.get(source)!.usedByAPIs.push(target);
        apiMap.get(target)!.dataModels.push(source);
      }

      // Page -> Page
      if (pageMap.has(source) && pageMap.has(target)) {
        pageMap.get(source)!.nextPages.push(target);
      }
    }
  }
}
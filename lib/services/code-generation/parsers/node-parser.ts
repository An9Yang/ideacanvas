import { Node } from 'reactflow';
import { ParsedNode, UIComponent, UserAction, DataField, APICall } from '../types';
import { ContentExtractor } from './content-extractor';

export class NodeParser {
  private contentExtractor: ContentExtractor;

  constructor() {
    this.contentExtractor = new ContentExtractor();
  }

  async parse(node: Node, language: 'zh' | 'en'): Promise<ParsedNode | null> {
    if (!node.data || !node.data.content) {
      return null;
    }

    const content = node.data.content as string;
    const nodeType = this.determineNodeType(node);
    
    return {
      id: node.id,
      type: nodeType,
      title: node.data.label || this.extractTitle(content, language),
      components: await this.contentExtractor.extractComponents(content, language),
      actions: await this.contentExtractor.extractActions(content, language),
      dataModel: await this.contentExtractor.extractDataModel(content, language),
      apiCalls: await this.contentExtractor.extractAPICalls(content, language)
    };
  }

  private determineNodeType(node: Node): 'page' | 'api' | 'data' | 'integration' {
    const nodeType = node.type;
    const content = (node.data.content || '').toLowerCase();
    
    if (nodeType === 'product' || content.includes('页面') || content.includes('page')) {
      return 'page';
    }
    
    if (nodeType === 'external' || content.includes('api') || content.includes('接口')) {
      return 'api';
    }
    
    if (nodeType === 'context' || content.includes('数据') || content.includes('data')) {
      return 'data';
    }
    
    return 'integration';
  }

  private extractTitle(content: string, language: 'zh' | 'en'): string {
    const lines = content.split('\n');
    const firstLine = lines[0] || '';
    
    // 尝试提取标题
    const titleMatch = firstLine.match(/^(?:标题|Title|名称|Name)[:：]?\s*(.+)/i);
    if (titleMatch) {
      return titleMatch[1].trim();
    }
    
    // 如果没有明确的标题，使用第一行
    return firstLine.trim().substring(0, 50);
  }
}
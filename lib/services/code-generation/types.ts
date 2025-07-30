import { Node, Edge } from 'reactflow';

export interface ParsedNode {
  id: string;
  type: 'page' | 'api' | 'data' | 'integration';
  title: string;
  components: UIComponent[];
  actions: UserAction[];
  dataModel: DataField[];
  apiCalls: APICall[];
}

export interface UIComponent {
  id: string;
  type: 'form' | 'list' | 'card' | 'navigation' | 'button' | 'input' | 'table' | 'header' | 'footer';
  name: string;
  properties: Record<string, any>;
  children?: UIComponent[];
}

export interface UserAction {
  id: string;
  trigger: 'click' | 'submit' | 'change' | 'load';
  target: string;
  action: 'navigate' | 'api-call' | 'update-data' | 'validate' | 'show-message';
  payload?: any;
}

export interface DataField {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'array' | 'object';
  required: boolean;
  defaultValue?: any;
  validation?: ValidationRule[];
}

export interface ValidationRule {
  type: 'required' | 'minLength' | 'maxLength' | 'pattern' | 'min' | 'max' | 'email' | 'url';
  value?: any;
  message: string;
}

export interface APICall {
  id: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  endpoint: string;
  parameters?: Record<string, any>;
  requestBody?: any;
  responseHandler?: string;
}

export interface GenerationOptions {
  language: 'zh' | 'en';
  framework: 'vanilla' | 'react' | 'vue';
  styling: 'tailwind' | 'bootstrap' | 'custom';
  includeComments: boolean;
}

export interface GeneratedPage {
  id: string;
  name: string;
  html: string;
  route: string;
  components: string[];
}

export interface StyleSheet {
  name: string;
  content: string;
}

export interface JavaScript {
  name: string;
  content: string;
  type: 'module' | 'script';
}

export interface OpenAPISpec {
  openapi: string;
  info: {
    title: string;
    version: string;
    description?: string;
  };
  paths: Record<string, any>;
  components?: {
    schemas?: Record<string, any>;
  };
}

export interface Asset {
  name: string;
  type: 'image' | 'font' | 'icon';
  content: string | Buffer;
}

export interface GenerationResult {
  pages: GeneratedPage[];
  styles: StyleSheet[];
  scripts: JavaScript[];
  apiSpec: OpenAPISpec;
  assets: Asset[];
  preview: string;
}

export interface CodeGenerationService {
  generateFromFlow(
    nodes: Node[], 
    edges: Edge[],
    options?: GenerationOptions
  ): Promise<GenerationResult>;
  
  previewPage(pageId: string): Promise<string>;
  
  exportProject(result: GenerationResult): Promise<Blob>;
}
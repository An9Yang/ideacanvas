import { JavaScript, GenerationOptions } from '../types';
import { FlowStructure } from '../parsers/flow-analyzer';

export class JSGenerator {
  async generateScripts(
    flowStructure: FlowStructure,
    options: GenerationOptions
  ): Promise<JavaScript[]> {
    const scripts: JavaScript[] = [];

    // 生成主应用脚本
    const appScript = await this.generateAppScript(flowStructure, options);
    scripts.push({
      name: 'app.js',
      content: appScript,
      type: 'module'
    });

    // 生成API客户端
    const apiClient = await this.generateAPIClient(flowStructure, options);
    scripts.push({
      name: 'api-client.js',
      content: apiClient,
      type: 'module'
    });

    // 生成工具函数
    const utils = await this.generateUtils(options);
    scripts.push({
      name: 'utils.js',
      content: utils,
      type: 'module'
    });

    return scripts;
  }

  private async generateAppScript(
    flowStructure: FlowStructure,
    options: GenerationOptions
  ): Promise<string> {
    const imports = this.generateImports();
    const pageHandlers = this.generatePageHandlers(flowStructure, options);
    const navigation = this.generateNavigationLogic(flowStructure, options);
    const initialization = this.generateInitialization(options);

    return `${imports}

${pageHandlers}

${navigation}

${initialization}
`;
  }

  private generateImports(): string {
    return `import { apiClient } from './api-client.js';
import { validateForm, showMessage, formatDate } from './utils.js';`;
  }

  private generatePageHandlers(
    flowStructure: FlowStructure,
    options: GenerationOptions
  ): string {
    const handlers: string[] = [];

    for (const page of flowStructure.pages) {
      const handler = this.generatePageHandler(page, flowStructure, options);
      handlers.push(handler);
    }

    return handlers.join('\n\n');
  }

  private generatePageHandler(page: any, flowStructure: FlowStructure, options: GenerationOptions): string {
    const functionName = this.toCamelCase(`init_${page.node.title}_page`);
    const actions = this.generateActionHandlers(page.node.actions, page, flowStructure, options);

    return `// ${page.node.title} Page Handler
function ${functionName}() {
  console.log('Initializing ${page.node.title}');
  
  ${actions}
  
  // Load initial data
  loadPageData('${page.id}');
}`;
  }

  private generateActionHandlers(actions: any[], page: any, flowStructure: FlowStructure, options: GenerationOptions): string {
    const handlers: string[] = [];

    for (const action of actions) {
      const handler = this.generateActionHandler(action, page, flowStructure, options);
      handlers.push(handler);
    }

    return handlers.join('\n  ');
  }

  private generateActionHandler(action: any, page: any, flowStructure: FlowStructure, options: GenerationOptions): string {
    const elementSelector = action.target || `#${action.id}`;
    
    switch (action.action) {
      case 'navigate':
        return `// Navigation action
  document.querySelector('${elementSelector}')?.addEventListener('${action.trigger}', (e) => {
    e.preventDefault();
    navigateTo('${action.payload || '/'}');
  });`;

      case 'api-call':
        return `// API call action
  document.querySelector('${elementSelector}')?.addEventListener('${action.trigger}', async (e) => {
    e.preventDefault();
    try {
      const response = await apiClient.${action.payload?.method || 'get'}('${action.payload?.endpoint || '/api/data'}');
      handleAPIResponse(response);
    } catch (error) {
      showMessage('${options.language === 'zh' ? 'API调用失败' : 'API call failed'}', 'error');
    }
  });`;

      case 'update-data':
        return `// Update data action
  document.querySelector('${elementSelector}')?.addEventListener('${action.trigger}', (e) => {
    updatePageData(e.target.value);
  });`;

      case 'validate':
        return `// Validation action
  document.querySelector('${elementSelector}')?.addEventListener('${action.trigger}', (e) => {
    const isValid = validateForm(e.target.closest('form'));
    if (!isValid) {
      e.preventDefault();
      showMessage('${options.language === 'zh' ? '请检查表单输入' : 'Please check form input'}', 'warning');
    }
  });`;

      case 'show-message':
        return `// Show message action
  document.querySelector('${elementSelector}')?.addEventListener('${action.trigger}', (e) => {
    showMessage('${action.payload?.message || (options.language === 'zh' ? '操作成功' : 'Operation successful')}', 'success');
  });`;

      default:
        return `// Custom action: ${action.action}
  document.querySelector('${elementSelector}')?.addEventListener('${action.trigger}', (e) => {
    console.log('Custom action triggered:', '${action.action}');
  });`;
    }
  }

  private generateNavigationLogic(flowStructure: FlowStructure, options: GenerationOptions): string {
    return `// Navigation Logic
function navigateTo(path) {
  // Simple client-side routing
  window.history.pushState({}, '', path);
  loadPage(path);
}

function loadPage(path) {
  // Hide all pages
  document.querySelectorAll('.page').forEach(page => {
    page.style.display = 'none';
  });
  
  // Show the requested page
  const pageElement = document.querySelector(\`[data-path="\${path}"]\`);
  if (pageElement) {
    pageElement.style.display = 'block';
    
    // Initialize page-specific logic
    const pageId = pageElement.getAttribute('data-page-id');
    initializePage(pageId);
  }
}

function initializePage(pageId) {
  switch (pageId) {
    ${flowStructure.pages.map(page => `
    case '${page.id}':
      ${this.toCamelCase(`init_${page.node.title}_page`)}();
      break;`).join('')}
    default:
      console.log('Unknown page:', pageId);
  }
}`;
  }

  private generateInitialization(options: GenerationOptions): string {
    return `// Application Initialization
document.addEventListener('DOMContentLoaded', () => {
  console.log('${options.language === 'zh' ? '应用程序初始化中...' : 'Application initializing...'}');
  
  // Set up routing
  window.addEventListener('popstate', (e) => {
    loadPage(window.location.pathname);
  });
  
  // Initialize the current page
  loadPage(window.location.pathname || '/');
  
  // Set up global error handling
  window.addEventListener('error', (e) => {
    console.error('Global error:', e.error);
    showMessage('${options.language === 'zh' ? '发生错误，请重试' : 'An error occurred, please try again'}', 'error');
  });
});

// Helper Functions
function loadPageData(pageId) {
  // Implement data loading logic
  console.log('Loading data for page:', pageId);
}

function handleAPIResponse(response) {
  // Implement response handling
  console.log('API Response:', response);
}

function updatePageData(data) {
  // Implement data update logic
  console.log('Updating page data:', data);
}`;
  }

  private async generateAPIClient(flowStructure: FlowStructure, options: GenerationOptions): Promise<string> {
    const apiEndpoints = this.extractAPIEndpoints(flowStructure);
    
    return `// API Client Module
const API_BASE_URL = window.location.origin + '/api';

class APIClient {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.headers = {
      'Content-Type': 'application/json',
    };
  }

  async request(method, endpoint, data = null) {
    const url = \`\${this.baseURL}\${endpoint}\`;
    const config = {
      method,
      headers: this.headers,
    };

    if (data && ['POST', 'PUT', 'PATCH'].includes(method)) {
      config.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(\`HTTP error! status: \${response.status}\`);
      }
      
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      }
      
      return await response.text();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // HTTP Methods
  get(endpoint) {
    return this.request('GET', endpoint);
  }

  post(endpoint, data) {
    return this.request('POST', endpoint, data);
  }

  put(endpoint, data) {
    return this.request('PUT', endpoint, data);
  }

  delete(endpoint) {
    return this.request('DELETE', endpoint);
  }

  // Generated API Methods
  ${this.generateAPIMethods(apiEndpoints, options)}
}

export const apiClient = new APIClient();`;
  }

  private extractAPIEndpoints(flowStructure: FlowStructure): any[] {
    const endpoints: any[] = [];
    
    for (const api of flowStructure.apis) {
      for (const apiCall of api.node.apiCalls) {
        endpoints.push(apiCall);
      }
    }
    
    for (const page of flowStructure.pages) {
      for (const apiCall of page.node.apiCalls) {
        endpoints.push(apiCall);
      }
    }
    
    return endpoints;
  }

  private generateAPIMethods(endpoints: any[], options: GenerationOptions): string {
    const methods: string[] = [];
    const processedEndpoints = new Set();

    for (const endpoint of endpoints) {
      const key = `${endpoint.method}_${endpoint.endpoint}`;
      if (processedEndpoints.has(key)) continue;
      processedEndpoints.add(key);

      const methodName = this.generateMethodName(endpoint);
      const method = `// ${endpoint.endpoint}
  ${methodName}(${endpoint.method === 'GET' || endpoint.method === 'DELETE' ? '' : 'data'}) {
    return this.${endpoint.method.toLowerCase()}('${endpoint.endpoint}'${endpoint.method === 'GET' || endpoint.method === 'DELETE' ? '' : ', data'});
  }`;
      
      methods.push(method);
    }

    return methods.join('\n\n  ');
  }

  private generateMethodName(endpoint: any): string {
    const parts = endpoint.endpoint.split('/').filter(Boolean);
    const method = endpoint.method.toLowerCase();
    
    if (parts.length === 0) return method + 'Root';
    
    const resource = parts[parts.length - 1];
    const camelCaseResource = this.toCamelCase(resource);
    
    switch (method) {
      case 'get':
        return `fetch${camelCaseResource}`;
      case 'post':
        return `create${camelCaseResource}`;
      case 'put':
        return `update${camelCaseResource}`;
      case 'delete':
        return `delete${camelCaseResource}`;
      default:
        return `${method}${camelCaseResource}`;
    }
  }

  private async generateUtils(options: GenerationOptions): Promise<string> {
    return `// Utility Functions

// Form validation
export function validateForm(form) {
  if (!form) return false;
  
  const inputs = form.querySelectorAll('input[required], textarea[required], select[required]');
  let isValid = true;
  
  inputs.forEach(input => {
    if (!input.value.trim()) {
      input.classList.add('error');
      isValid = false;
    } else {
      input.classList.remove('error');
    }
  });
  
  return isValid;
}

// Show message to user
export function showMessage(message, type = 'info') {
  const messageElement = document.createElement('div');
  messageElement.className = \`message message-\${type}\`;
  messageElement.textContent = message;
  
  document.body.appendChild(messageElement);
  
  // Auto-hide after 3 seconds
  setTimeout(() => {
    messageElement.remove();
  }, 3000);
}

// Format date
export function formatDate(date, format = 'YYYY-MM-DD') {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  
  return format
    .replace('YYYY', year)
    .replace('MM', month)
    .replace('DD', day);
}

// Debounce function
export function debounce(func, wait = 300) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Deep clone object
export function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime());
  if (obj instanceof Array) return obj.map(item => deepClone(item));
  
  const clonedObj = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      clonedObj[key] = deepClone(obj[key]);
    }
  }
  
  return clonedObj;
}

// Local storage helpers
export const storage = {
  get(key) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return null;
    }
  },
  
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Error writing to localStorage:', error);
    }
  },
  
  remove(key) {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing from localStorage:', error);
    }
  }
};`;
  }

  private toCamelCase(str: string): string {
    return str
      .replace(/[^a-zA-Z0-9]+(.)/g, (_, chr) => chr.toUpperCase())
      .replace(/^./, chr => chr.toLowerCase());
  }
}
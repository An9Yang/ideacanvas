import { GeneratedNode, NodeType } from '@/lib/types/flow';
import { configService, COMMON_EXTERNAL_SERVICES } from '@/lib/config';

/**
 * Detect language from text
 */
export function detectLanguage(text: string | any): string {
  // If not string, return default language
  if (typeof text !== 'string') {
    return 'en';
  }
  
  // Language patterns
  const patterns = {
    zh: /[\u4e00-\u9fa5]/,
    ja: /[\u3040-\u309F\u30A0-\u30FF]/,
    ko: /[\uAC00-\uD7AF]/
  };
  
  // Check each pattern
  for (const [lang, pattern] of Object.entries(patterns)) {
    if (pattern.test(text)) {
      return lang;
    }
  }
  
  return 'en';
}

/**
 * Validate node content
 */
export function validateNodeContent(node: GeneratedNode): { 
  isValid: boolean; 
  error?: string 
} {
  const validationRules = configService.getValidationRules();
  
  // Basic validation
  if (!node.title || node.title.trim() === '') {
    return {
      isValid: false,
      error: `节点缺少标题`
    };
  }
  
  if (!node.content || node.content.trim() === '') {
    return {
      isValid: false,
      error: `节点 "${node.title}" 缺少内容`
    };
  }
  
  // Content length validation
  if (node.content.length < validationRules.MIN_CONTENT_LENGTH) {
    return {
      isValid: false,
      error: `节点 "${node.title}" 的内容太短（最少需要${validationRules.MIN_CONTENT_LENGTH}字符）`
    };
  }
  
  // External service validation
  if (node.type === 'external') {
    const additionalServices = [
      'S3', 'Lambda', 'EC2', 'DynamoDB', 'RDS',
      'Firestore', 'Cloud Functions', 'Maps API',
      'Blob Storage', 'Cognitive Services',
      'Braintree', 'MySQL', 'ChatGPT', 'GPT-4', 'Gemini',
      'OAuth', 'JWT', 'API', 'SDK', 'REST', 'GraphQL',
      'Provider:', 'Service Provider:', 'Integration:'
    ];
    
    const allServices = [...COMMON_EXTERNAL_SERVICES, ...additionalServices];
    const content = node.data?.content || '';
    const title = node.data?.label || node.data?.title || '';
    
    // Check both title and content for service names
    const textToCheck = `${title} ${content}`.toLowerCase();
    const hasSpecificService = allServices.some(service => 
      textToCheck.includes(service.toLowerCase())
    );
    
    if (!hasSpecificService) {
      // Only fail validation if title is not empty
      // Empty titles are warnings, not errors
      if (title && title.trim() !== '') {
        return {
          isValid: false,
          error: `外部服务节点 "${title}" 未明确指定具体的第三方服务或API名称`
        };
      }
      // If title is empty, just log a warning but don't fail
      console.warn(`外部服务节点标题为空，但内容中也未找到具体服务名称`);
    }
    
    // Check content length for external services
    if (content.length < validationRules.MIN_EXTERNAL_SERVICE_CONTENT_LENGTH) {
      return {
        isValid: false,
        error: `外部服务节点 "${title}" 的内容太短（最少需要${validationRules.MIN_EXTERNAL_SERVICE_CONTENT_LENGTH}字符，当前${content.length}字符）`
      };
    }
  }
  
  return { isValid: true };
}

/**
 * Validate request body
 */
export function validateRequestBody(body: any): {
  isValid: boolean;
  error?: string;
  prompt?: string;
} {
  if (!body) {
    return {
      isValid: false,
      error: 'Request body is required'
    };
  }
  
  const { prompt } = body;
  
  if (!prompt || typeof prompt !== 'string') {
    return {
      isValid: false,
      error: 'Prompt is required and must be a string'
    };
  }
  
  const trimmedPrompt = prompt.trim();
  
  if (trimmedPrompt.length === 0) {
    return {
      isValid: false,
      error: 'Prompt cannot be empty'
    };
  }
  
  if (trimmedPrompt.length > 10000) {
    return {
      isValid: false,
      error: 'Prompt is too long (maximum 10000 characters)'
    };
  }
  
  return {
    isValid: true,
    prompt: trimmedPrompt
  };
}
// Application constants and configuration values

export const AI_CONFIG = {
  // Azure OpenAI Configuration
  AZURE: {
    API_VERSION: '2024-04-01-preview',
    DEPLOYMENT_NAME: 'gpt-4.5-preview',
    DEFAULT_ENDPOINT: 'https://y7948-m7dkvj9c-swedencentral.openai.azure.com/',
  },
  
  // Model Parameters (o3 model only supports temperature = 1)
  GENERATION: {
    TEMPERATURE: 1,
    MAX_TOKENS: 16000,
    TOP_P: 1,
    FREQUENCY_PENALTY: 0,
    PRESENCE_PENALTY: 0,
  },
  
  // Completion Parameters (for simpler requests)
  COMPLETION: {
    TEMPERATURE: 1,
    MAX_TOKENS: 800,
    TOP_P: 1,
    FREQUENCY_PENALTY: 0,
    PRESENCE_PENALTY: 0,
  },
  
  // Assistant Configuration
  ASSISTANT: {
    NAME: 'IdeaCanvas助手',
    INSTRUCTIONS: '你是一个专业助手，帮助用户分析和理解他们的想法。提供清晰简洁的回答。',
    POLLING_INTERVAL: 1000, // ms
  },
  
  // Validation Rules
  VALIDATION: {
    MIN_CONTENT_LENGTH: 20,  // 降低到 20 字符，允许简单描述
    MIN_EXTERNAL_SERVICE_CONTENT_LENGTH: 30,  // 降低到 30 字符
  },
} as const;

export const APP_CONFIG = {
  // Flow Store Configuration
  FLOW: {
    HISTORY_LIMIT: 10,
    CONTENT_MAX_LENGTH: 4000,
  },
  
  // Supported Languages
  LANGUAGES: {
    ZH: 'zh',
    EN: 'en',
    JA: 'ja',
    KO: 'ko',
  },
  
  // Default Language
  DEFAULT_LANGUAGE: 'zh',
} as const;

// Common external services for flow generation
export const COMMON_EXTERNAL_SERVICES = [
  'OpenAI',
  'Claude',
  'AWS',
  'Azure',
  'Google Cloud',
  'Firebase',
  'Supabase',
  'MongoDB',
  'PostgreSQL',
  'Redis',
  'Stripe',
  'PayPal',
  'SendGrid',
  'Twilio',
  'Auth0',
  'Clerk',
] as const;

// Node Types
export const NODE_TYPES = {
  PRODUCT: 'product',
  EXTERNAL: 'external',
  CONTEXT: 'context',
  GUIDE: 'guide',
  DOCUMENT: 'document',
} as const;

// Node Colors
export const NODE_COLORS = {
  [NODE_TYPES.PRODUCT]: '#ffffff',
  [NODE_TYPES.EXTERNAL]: '#e3f2fd',
  [NODE_TYPES.CONTEXT]: '#fff9c4',
  [NODE_TYPES.GUIDE]: '#f3e5f5',
  [NODE_TYPES.DOCUMENT]: '#e8f5e9',
} as const;
export class CodeGenerationError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'CodeGenerationError';
  }
}

export const ErrorCodes = {
  EMPTY_FLOW: 'EMPTY_FLOW',
  PARSE_ERROR: 'PARSE_ERROR',
  GENERATION_ERROR: 'GENERATION_ERROR',
  EXPORT_ERROR: 'EXPORT_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  INVALID_NODE: 'INVALID_NODE',
  TEMPLATE_ERROR: 'TEMPLATE_ERROR'
} as const;

export const ErrorMessages = {
  zh: {
    [ErrorCodes.EMPTY_FLOW]: '请先生成流程图',
    [ErrorCodes.PARSE_ERROR]: '解析节点内容失败',
    [ErrorCodes.GENERATION_ERROR]: '代码生成失败',
    [ErrorCodes.EXPORT_ERROR]: '导出项目失败',
    [ErrorCodes.TIMEOUT_ERROR]: '生成超时，请简化流程图后重试',
    [ErrorCodes.INVALID_NODE]: '节点内容格式错误',
    [ErrorCodes.TEMPLATE_ERROR]: '模板处理失败'
  },
  en: {
    [ErrorCodes.EMPTY_FLOW]: 'Please generate a flow first',
    [ErrorCodes.PARSE_ERROR]: 'Failed to parse node content',
    [ErrorCodes.GENERATION_ERROR]: 'Code generation failed',
    [ErrorCodes.EXPORT_ERROR]: 'Failed to export project',
    [ErrorCodes.TIMEOUT_ERROR]: 'Generation timeout, please simplify the flow',
    [ErrorCodes.INVALID_NODE]: 'Invalid node content format',
    [ErrorCodes.TEMPLATE_ERROR]: 'Template processing failed'
  }
} as const;

export function getErrorMessage(
  code: keyof typeof ErrorCodes,
  language: 'zh' | 'en' = 'zh'
): string {
  return ErrorMessages[language][ErrorCodes[code]];
}

export function handleGenerationError(
  error: any,
  language: 'zh' | 'en' = 'zh'
): CodeGenerationError {
  if (error instanceof CodeGenerationError) {
    return error;
  }

  // 分析错误类型
  if (error.message?.includes('timeout')) {
    return new CodeGenerationError(
      getErrorMessage('TIMEOUT_ERROR', language),
      ErrorCodes.TIMEOUT_ERROR,
      error
    );
  }

  if (error.message?.includes('parse')) {
    return new CodeGenerationError(
      getErrorMessage('PARSE_ERROR', language),
      ErrorCodes.PARSE_ERROR,
      error
    );
  }

  if (error.message?.includes('export')) {
    return new CodeGenerationError(
      getErrorMessage('EXPORT_ERROR', language),
      ErrorCodes.EXPORT_ERROR,
      error
    );
  }

  // 默认错误
  return new CodeGenerationError(
    getErrorMessage('GENERATION_ERROR', language),
    ErrorCodes.GENERATION_ERROR,
    error
  );
}
/**
 * Unified error handling service
 */

export enum ErrorCode {
  // AI Service Errors
  AI_API_KEY_MISSING = 'AI_API_KEY_MISSING',
  AI_GENERATION_FAILED = 'AI_GENERATION_FAILED',
  AI_COMPLETION_FAILED = 'AI_COMPLETION_FAILED',
  AI_INVALID_RESPONSE = 'AI_INVALID_RESPONSE',
  
  // Flow Errors
  FLOW_GENERATION_FAILED = 'FLOW_GENERATION_FAILED',
  FLOW_VALIDATION_FAILED = 'FLOW_VALIDATION_FAILED',
  FLOW_INVALID_FORMAT = 'FLOW_INVALID_FORMAT',
  
  // Configuration Errors
  CONFIG_MISSING = 'CONFIG_MISSING',
  CONFIG_INVALID = 'CONFIG_INVALID',
  
  // Network Errors
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  
  // General Errors
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

export interface AppError extends Error {
  code: ErrorCode;
  details?: any;
  statusCode?: number;
}

export class ErrorService {
  private static instance: ErrorService;
  
  private constructor() {}
  
  static getInstance(): ErrorService {
    if (!ErrorService.instance) {
      ErrorService.instance = new ErrorService();
    }
    return ErrorService.instance;
  }
  
  /**
   * Create a standardized application error
   */
  createError(code: ErrorCode, message: string, details?: any): AppError {
    const error = new Error(message) as AppError;
    error.code = code;
    error.details = details;
    error.name = 'AppError';
    
    // Set appropriate status codes
    switch (code) {
      case ErrorCode.AI_API_KEY_MISSING:
      case ErrorCode.CONFIG_MISSING:
        error.statusCode = 401;
        break;
      case ErrorCode.FLOW_VALIDATION_FAILED:
      case ErrorCode.CONFIG_INVALID:
        error.statusCode = 400;
        break;
      case ErrorCode.NETWORK_ERROR:
      case ErrorCode.TIMEOUT_ERROR:
        error.statusCode = 503;
        break;
      default:
        error.statusCode = 500;
    }
    
    return error;
  }
  
  /**
   * Log error with appropriate severity
   */
  logError(error: Error | AppError, context?: string): void {
    const timestamp = new Date().toISOString();
    const errorInfo = {
      timestamp,
      context,
      message: error.message,
      code: (error as AppError).code || ErrorCode.UNKNOWN_ERROR,
      details: (error as AppError).details,
      stack: error.stack,
    };
    
    // In production, this would send to a logging service
    console.error('[ERROR]', errorInfo);
  }
  
  /**
   * Handle error and return user-friendly message
   */
  handleError(error: Error | AppError, context?: string): { message: string; code: ErrorCode } {
    this.logError(error, context);
    
    const appError = error as AppError;
    const code = appError.code || ErrorCode.UNKNOWN_ERROR;
    
    // Map error codes to user-friendly messages
    const userMessages: Record<ErrorCode, string> = {
      [ErrorCode.AI_API_KEY_MISSING]: 'AI服务未配置，请检查API密钥设置',
      [ErrorCode.AI_GENERATION_FAILED]: '生成内容失败，请稍后重试',
      [ErrorCode.AI_COMPLETION_FAILED]: '处理请求失败，请稍后重试',
      [ErrorCode.AI_INVALID_RESPONSE]: 'AI返回的内容格式错误',
      [ErrorCode.FLOW_GENERATION_FAILED]: '生成流程图失败，请检查输入内容',
      [ErrorCode.FLOW_VALIDATION_FAILED]: '流程图验证失败',
      [ErrorCode.FLOW_INVALID_FORMAT]: '流程图格式错误',
      [ErrorCode.CONFIG_MISSING]: '配置缺失，请检查设置',
      [ErrorCode.CONFIG_INVALID]: '配置无效，请检查设置',
      [ErrorCode.NETWORK_ERROR]: '网络连接失败，请检查网络',
      [ErrorCode.TIMEOUT_ERROR]: '请求超时，请稍后重试',
      [ErrorCode.UNKNOWN_ERROR]: '发生未知错误，请稍后重试',
    };
    
    return {
      message: userMessages[code] || error.message,
      code,
    };
  }
  
  /**
   * Wrap async functions with error handling
   */
  async wrapAsync<T>(
    fn: () => Promise<T>,
    context: string,
    errorCode: ErrorCode = ErrorCode.UNKNOWN_ERROR
  ): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      const appError = this.createError(
        errorCode,
        error instanceof Error ? error.message : '未知错误',
        { originalError: error }
      );
      throw appError;
    }
  }
}

// Export singleton instance
export const errorService = ErrorService.getInstance();
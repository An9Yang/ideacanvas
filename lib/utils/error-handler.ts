// error-handler.ts
import { APIError } from '@/lib/types/error';

/**
 * 统一处理错误，并返回格式化后的错误信息、详细说明和 HTTP 状态码
 */
export function handleAPIError(error: unknown): {
  error: string;
  details?: string;
  statusCode: number;
} {
  console.error('API Error:', error);

  // 如果是自定义的 APIError 类型，可以直接取出信息
  if (error instanceof APIError) {
    return {
      error: error.message,
      details: error.details,
      statusCode: error.statusCode
    };
  }

  // 如果是系统级别的 Error
  if (error instanceof Error) {
    // 下面是一些常见错误的判断示例，可以根据需要自由扩展
    if (error.message.includes('401') || error.message.toLowerCase().includes('unauthorized')) {
      return {
        error: '认证失败',
        details: error.message,
        statusCode: 401
      };
    }

    if (error.message.includes('404')) {
      return {
        error: '资源未找到',
        details: error.message,
        statusCode: 404
      };
    }

    if (error.message.includes('429')) {
      return {
        error: '请求过于频繁',
        details: error.message,
        statusCode: 429
      };
    }

    // 默认情况返回 500
    return {
      error: '服务器内部错误',
      details: error.message,
      statusCode: 500
    };
  }

  // 既不是 APIError 也不是系统 Error 的情况
  return {
    error: '未知错误',
    details: String(error),
    statusCode: 500
  };
}

/**
 * 校验字符串是否为有效的 JSON 格式
 */
export function validateJSON(jsonStr: string): { isValid: boolean; error?: string } {
  try {
    JSON.parse(jsonStr);
    return { isValid: true };
  } catch (error) {
    return {
      isValid: false,
      error: error instanceof Error ? error.message : '无效的 JSON 格式'
    };
  }
}

/**
 * 清洗和提取 JSON 字符串的工具函数
 * 1. 去除 Markdown 代码块标记
 * 2. 提取第一个 { ... } 的完整 JSON
 * 3. 替换常见不合法字符
 * 4. 去除注释、多余逗号、空格等
 */
export function sanitizeJSON(jsonStr: string): string {
  // 移除可能的 Markdown 代码块标记，例如 ```json ... ```
  jsonStr = jsonStr.replace(/^```[\s\S]*?\n([\s\S]*?)\n```/g, '$1');

  // 使用正则提取第一个 { ... } 的部分
  const match = jsonStr.match(/\{[\s\S]*\}/);
  if (match) {
    jsonStr = match[0];
  }

  // 将中文全角引号替换为英文双引号（如果有的话）
  // 这里示例使用 /“/g，但注意有些输入可能是不同的全角字符
  jsonStr = jsonStr.replace(/“|”/g, '"');

  // 替换连续的 . 为单个空字符串（防止出现 ... 破坏 JSON）
  jsonStr = jsonStr.replace(/\.\.\.+/g, '');

  // 移除 JS 注释
  jsonStr = jsonStr.replace(/\/\/.*$/gm, '');
  jsonStr = jsonStr.replace(/\/\*[\s\S]*?\*\//g, '');

  // 修复常见的 JSON 格式错误
  // 例如 ,} 或 ,] 这种不合法逗号
  jsonStr = jsonStr.replace(/,(?=\s*[}\]])/g, '');
  // 修复一些可能多余的空格或符号
  jsonStr = jsonStr.replace(/([^\s,{\[])\s*}/g, '$1}');
  jsonStr = jsonStr.replace(/([^\s,{\[])\s*]/g, '$1]');

  return jsonStr;
}

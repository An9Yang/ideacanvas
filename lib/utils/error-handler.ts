import { APIError } from '@/lib/types/error';

export function handleAPIError(error: unknown): { error: string; details?: string; statusCode: number } {
  console.error('API Error:', error);

  if (error instanceof APIError) {
    return {
      error: error.message,
      details: error.details,
      statusCode: error.statusCode
    };
  }

  if (error instanceof Error) {
    // 处理常见的错误类型
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

    return {
      error: '服务器内部错误',
      details: error.message,
      statusCode: 500
    };
  }

  return {
    error: '未知错误',
    details: String(error),
    statusCode: 500
  };
}

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

export function sanitizeJSON(jsonStr: string): string {
  // 移除可能的代码块标记
  jsonStr = jsonStr.replace(/^```[\s\S]*\n([\s\S]*)\n```[\s\S]*$/g, '$1');

  // 尝试提取 JSON 部分（在第一个 { 和最后一个 } 之间的内容）
  const match = jsonStr.match(/\{[\s\S]*\}/);
  if (match) {
    jsonStr = match[0];
  }

  // 替换中文全角引号为英文双引号
  jsonStr = jsonStr.replace(/[""]/g, '"');

  // 将多余的冒号替换为单个冒号
  jsonStr = jsonStr.replace(/":\s*:/g, '":');

  // 去除省略号
  jsonStr = jsonStr.replace(/\.\.\.+/g, '');

  // 移除注释
  jsonStr = jsonStr.replace(/\/\/.*$/gm, '');
  jsonStr = jsonStr.replace(/\/\*[\s\S]*?\*\//g, '');

  // 修复常见的 JSON 格式错误
  jsonStr = jsonStr.replace(/,(?:\s*[}\]])/g, '$1');
  jsonStr = jsonStr.replace(/([^\s,{\[])\s*}/g, '$1}');
  jsonStr = jsonStr.replace(/([^\s,{\[])\s*]/g, '$1]');

  return jsonStr;
}

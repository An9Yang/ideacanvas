// error-handler.ts
import { APIError } from '@/lib/types/error';
import { fixAIGeneratedJSON } from '@/lib/utils/json-fixer';

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

    // 处理 403 Forbidden 错误
    if (error.message.includes('403') || error.message.toLowerCase().includes('forbidden')) {
      return {
        error: '资源访问被禁止',
        details: error.message,
        statusCode: 403
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
 * 解析并校验 JSON 字符串
 * 返回解析后的对象，如果解析失败则抛出错误
 */
export function validateJSON(jsonStr: string): any {
  try {
    return JSON.parse(jsonStr);
  } catch (error) {
    // 尝试使用高级修复器
    console.log('Standard JSON parse failed, trying advanced fixer...');
    const fixedJson = fixAIGeneratedJSON(jsonStr);
    
    try {
      return JSON.parse(fixedJson);
    } catch (fixError) {
      throw new Error(`无效的 JSON 格式: ${error instanceof Error ? error.message : '未知错误'}`);
    }
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
  jsonStr = jsonStr.replace(/```json\s*/g, '');
  jsonStr = jsonStr.replace(/```\s*$/g, '');

  // 使用正则提取第一个 { ... } 的部分
  const match = jsonStr.match(/\{[\s\S]*\}/);
  if (match) {
    jsonStr = match[0];
  }

  // 处理中文字符的编码问题（先做这个，避免破坏后续的控制字符处理）
  try {
    // 尝试进行一次解码和编码，确保中文字符的一致性
    const decodedStr = decodeURIComponent(encodeURIComponent(jsonStr));
    if (decodedStr && typeof decodedStr === 'string') {
      jsonStr = decodedStr;
    }
  } catch (e) {
    // 如果编码/解码失败，保持原始字符串
    console.warn('JSON字符串编码/解码处理失败:', e);
  }

  // 最后修复JSON字符串中的控制字符
  // 这个函数会智能地处理字符串值中的换行符和其他控制字符
  jsonStr = fixJSONControlCharacters(jsonStr);

  // 将中文全角引号替换为英文双引号（如果有的话）
  jsonStr = jsonStr.replace(/"|"|「|」|『|』/g, '"');

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

/**
 * 修复JSON字符串中的控制字符
 * 智能处理字符串值中的换行符、制表符等控制字符
 */
export function fixJSONControlCharacters(jsonStr: string): string {
  console.log('fixJSONControlCharacters called with string length:', jsonStr.length);
  
  // 状态机来跟踪我们是否在字符串内部
  let result = '';
  let inString = false;
  let escaped = false;
  
  for (let i = 0; i < jsonStr.length; i++) {
    const char = jsonStr[i];
    const charCode = char.charCodeAt(0);
    
    // 处理转义字符
    if (escaped) {
      result += char;
      escaped = false;
      continue;
    }
    
    // 检查是否是转义字符
    if (char === '\\') {
      escaped = true;
      result += char;
      continue;
    }
    
    // 检查引号（进入或退出字符串）
    if (char === '"') {
      inString = !inString;
      result += char;
      continue;
    }
    
    // 如果在字符串内部，需要转义控制字符
    if (inString) {
      if (charCode < 0x20) {
        // 控制字符需要转义
        // 记录发现的控制字符位置，特别是在 URL 附近
        if (i > 10 && jsonStr.substring(i-10, i).includes('http')) {
          console.log(`Found control char (code: ${charCode}) near URL at position ${i}`);
          console.log(`Context: "${jsonStr.substring(i-20, i+20).replace(/[\n\r\t]/g, '⏎')}"`);
        }
        
        switch (char) {
          case '\n':
            result += '\\n';
            break;
          case '\r':
            result += '\\r';
            break;
          case '\t':
            result += '\\t';
            break;
          case '\b':
            result += '\\b';
            break;
          case '\f':
            result += '\\f';
            break;
          default:
            // 其他控制字符转换为Unicode转义序列
            result += '\\u' + ('0000' + charCode.toString(16)).slice(-4);
        }
      } else {
        result += char;
      }
    } else {
      // 在字符串外部，保持原样（除了明显的控制字符）
      if (charCode >= 0x20 || char === '\n' || char === '\r' || char === '\t') {
        result += char;
      }
    }
  }
  
  return result;
}

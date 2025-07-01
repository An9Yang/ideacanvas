/**
 * 专门用于修复 AI 生成的 JSON 的高级修复器
 */

interface FixResult {
  fixed: boolean;
  json: string;
  issues: string[];
}

export class JSONFixer {
  private issues: string[] = [];

  /**
   * 尝试多种策略修复 JSON
   */
  fix(input: string): FixResult {
    this.issues = [];
    let json = input;

    // 策略1: 基础清理
    json = this.basicClean(json);

    // 策略2: 修复 URL 中的换行
    json = this.fixURLs(json);

    // 策略3: 智能字符串边界检测和修复
    json = this.smartStringFix(json);

    // 策略4: 尝试解析并捕获具体错误
    const parseResult = this.tryParse(json);
    if (!parseResult.success && parseResult.position) {
      json = this.targetedFix(json, parseResult.position, parseResult.error);
    }

    // 最终验证
    const finalResult = this.tryParse(json);

    return {
      fixed: finalResult.success,
      json,
      issues: this.issues
    };
  }

  /**
   * 基础清理
   */
  private basicClean(json: string): string {
    // 移除 Markdown 代码块
    json = json.replace(/```json\s*/g, '');
    json = json.replace(/```\s*/g, '');
    
    // 提取 JSON 对象
    const match = json.match(/\{[\s\S]*\}/);
    if (match) {
      json = match[0];
    }

    return json.trim();
  }

  /**
   * 专门修复 URL 相关问题
   */
  private fixURLs(json: string): string {
    // 查找所有可能的 URL 模式
    const urlPattern = /(https?:)([^"}\s]*[\n\r]+[^"}\s]*)/g;
    
    json = json.replace(urlPattern, (match, protocol, rest) => {
      this.issues.push(`Fixed broken URL: ${protocol}...`);
      // 移除 URL 中的所有换行符和空白
      const cleanRest = rest.replace(/[\n\r\s]+/g, '');
      return protocol + cleanRest;
    });

    // 修复特定的 "https:}" 模式
    json = json.replace(/(https?:)\s*([},])/g, (match, protocol, delimiter) => {
      this.issues.push(`Fixed truncated URL: ${protocol}`);
      return `${protocol}//example.com"${delimiter}`;
    });

    return json;
  }

  /**
   * 智能字符串修复
   */
  private smartStringFix(json: string): string {
    const result: string[] = [];
    let inString = false;
    let isEscaped = false;
    let stringStart = -1;

    for (let i = 0; i < json.length; i++) {
      const char = json[i];
      const prevChar = i > 0 ? json[i - 1] : '';

      // 处理转义
      if (isEscaped) {
        result.push(char);
        isEscaped = false;
        continue;
      }

      if (char === '\\') {
        isEscaped = true;
        result.push(char);
        continue;
      }

      // 检测字符串边界
      if (char === '"' && prevChar !== '\\') {
        if (!inString) {
          inString = true;
          stringStart = i;
        } else {
          // 检查是否是有效的字符串结束
          const nextChar = i < json.length - 1 ? json[i + 1] : '';
          const isValidEnd = [',', '}', ']', ':', ' ', '\n', '\r', '\t'].includes(nextChar);
          
          if (isValidEnd) {
            inString = false;
            stringStart = -1;
          }
        }
        result.push(char);
        continue;
      }

      // 在字符串内部处理控制字符
      if (inString) {
        const charCode = char.charCodeAt(0);
        if (charCode < 0x20) {
          switch (char) {
            case '\n':
              result.push('\\n');
              break;
            case '\r':
              result.push('\\r');
              break;
            case '\t':
              result.push('\\t');
              break;
            default:
              result.push('\\u' + ('0000' + charCode.toString(16)).slice(-4));
          }
        } else {
          result.push(char);
        }
      } else {
        result.push(char);
      }
    }

    // 如果字符串没有正确关闭
    if (inString && stringStart !== -1) {
      this.issues.push(`Unclosed string starting at position ${stringStart}`);
      result.push('"');
    }

    return result.join('');
  }

  /**
   * 针对性修复特定位置的错误
   */
  private targetedFix(json: string, position: number, error: string): string {
    const context = 50;
    const start = Math.max(0, position - context);
    const end = Math.min(json.length, position + context);
    
    this.issues.push(`Targeted fix at position ${position}: ${error}`);
    
    const before = json.substring(0, start);
    const problem = json.substring(start, end);
    const after = json.substring(end);

    // 尝试修复问题区域
    let fixed = problem;

    // 如果错误涉及控制字符
    if (error.includes('control character')) {
      fixed = fixed.replace(/[\x00-\x1F]/g, (char) => {
        switch (char) {
          case '\n': return '\\n';
          case '\r': return '\\r';
          case '\t': return '\\t';
          default: return '\\u' + ('0000' + char.charCodeAt(0).toString(16)).slice(-4);
        }
      });
    }

    return before + fixed + after;
  }

  /**
   * 尝试解析 JSON
   */
  private tryParse(json: string): { success: boolean; data?: any; error?: string; position?: number } {
    try {
      const data = JSON.parse(json);
      return { success: true, data };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      
      // 尝试提取错误位置
      const posMatch = errorMsg.match(/position (\d+)/);
      const position = posMatch ? parseInt(posMatch[1]) : undefined;
      
      return { success: false, error: errorMsg, position };
    }
  }
}

/**
 * 便捷函数
 */
export function fixAIGeneratedJSON(input: string): string {
  const fixer = new JSONFixer();
  const result = fixer.fix(input);
  
  if (result.issues.length > 0) {
    console.log('JSON Fixer applied fixes:', result.issues);
  }
  
  if (!result.fixed) {
    console.error('JSON Fixer could not completely fix the JSON');
  }
  
  return result.json;
}
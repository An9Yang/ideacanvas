// route.ts
import { NextResponse } from 'next/server';
import { NodeType, GeneratedFlow } from '@/lib/types/flow';
import { azureOpenAI } from '@/lib/config/azure-openai';
import { handleAPIError, sanitizeJSON, validateJSON } from '@/lib/utils/error-handler';
import { FLOW_GENERATION_PROMPT } from '@/lib/prompts/flow-generation';

// 强制动态渲染，并设置运行时和区域
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const preferredRegion = 'auto';

// 检测用户输入语言
function detectLanguage(text: string | any): string {
  // 如果不是字符串，返回默认语言
  if (typeof text !== 'string') {
    return 'en';
  }
  // 检测是否包含中文字符
  const hasChinese = /[\u4e00-\u9fa5]/.test(text);
  if (hasChinese) return 'zh';
  
  // 检测是否包含日文特有字符
  const hasJapanese = /[\u3040-\u309F\u30A0-\u30FF]/.test(text);
  if (hasJapanese) return 'ja';
  
  // 检测是否包含韩文特有字符
  const hasKorean = /[\uAC00-\uD7AF\u1100-\u11FF]/.test(text);
  if (hasKorean) return 'ko';
  
  // 默认为英文
  return 'en';
}

// 验证内容格式一致性
function validateContentStructure(flowData: GeneratedFlow, userLanguage: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // 检查节点内容语言一致性
  for (const node of flowData.nodes) {
    // 首先检查node.content是否为字符串
    if (typeof node.content !== 'string') {
      errors.push(`节点 "${node.title}" 的内容不是字符串类型`);
      continue; // 跳过后续检查
    }
    
    // 检查节点内容语言一致性
    const nodeLanguage = detectLanguage(node.content);
    if (nodeLanguage !== userLanguage) {
      errors.push(`节点 "${node.title}" 的内容语言 (${nodeLanguage}) 与用户请求语言 (${userLanguage}) 不一致`);
    }
    
    // 检查是否包含大括号或其他JSON格式的内容
    if (node.content.includes('```') || node.content.includes('{') || node.content.includes('}')) {
      errors.push(`节点 "${node.title}" 的内容包含不必要的格式化字符，如代码块标记或JSON大括号`);
    }
    
    // 检查是否存在混合编号的问题
    const hasLetterNumbering = /[a-z]\)/.test(node.content);
    const hasNumberNumbering = /\d+\./.test(node.content);
    if (hasLetterNumbering && hasNumberNumbering) {
      errors.push(`节点 "${node.title}" 的内容混合使用了字母编号和数字编号，应保持格式统一`);
    }
  }
  
  // 检查边描述语言一致性
  for (const edge of flowData.edges) {
    // 首先检查edge.description是否为字符串
    if (typeof edge.description !== 'string') {
      errors.push(`从 "${edge.source}" 到 "${edge.target}" 的边描述不是字符串类型`);
      continue; // 跳过后续检查
    }
    
    const edgeLanguage = detectLanguage(edge.description);
    if (edgeLanguage !== userLanguage) {
      errors.push(`从 "${edge.source}" 到 "${edge.target}" 的边描述语言 (${edgeLanguage}) 与用户请求语言 (${userLanguage}) 不一致`);
    }
    
    // 检查是否包含大括号或其他JSON格式的内容
    if (edge.description.includes('```') || edge.description.includes('{') || edge.description.includes('}')) {
      errors.push(`从 "${edge.source}" 到 "${edge.target}" 的边描述包含不必要的格式化字符，如代码块标记或JSON大括号`);
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// 添加节点内容验证函数
function validateNodeContent(node: any) {
  const minContentLength = 300; // 内容最小长度要求
  const externalMinContentLength = 500; // 外部服务节点的最小内容长度

  if (!node.content || typeof node.content !== 'string') {
    return {
      isValid: false,
      error: `节点 "${node.title}" 缺少有效的content字段`
    };
  }

  // 检查内容长度
  if (node.type === 'external' && node.content.length < externalMinContentLength) {
    return {
      isValid: false,
      error: `外部服务节点 "${node.title}" 的内容太短，无法提供足够的实现细节`
    };
  } else if (node.content.length < minContentLength) {
    return {
      isValid: false,
      error: `节点 "${node.title}" 的内容太短，无法提供足够的实现细节`
    };
  }

  // 检查外部服务节点是否包含具体的服务名称
  if (node.type === 'external') {
    const commonServices = [
      'AWS', 'S3', 'Lambda', 'EC2', 'DynamoDB', 'RDS',
      'Google', 'Firebase', 'Firestore', 'Cloud Functions', 'Maps API',
      'Azure', 'Blob Storage', 'Cognitive Services',
      'Stripe', 'PayPal', 'Braintree',
      'MongoDB', 'MySQL', 'PostgreSQL', 'Redis',
      'OpenAI', 'ChatGPT', 'GPT-4', 'Gemini',
      'Auth0', 'OAuth', 'JWT'
    ];

    const hasSpecificService = commonServices.some(service => 
      node.content.includes(service)
    );

    if (!hasSpecificService) {
      return {
        isValid: false,
        error: `外部服务节点 "${node.title}" 未明确指定具体的第三方服务或API名称`
      };
    }
  }

  return { isValid: true };
}

export async function POST(request: Request) {
  try {
    // 1. 验证 Azure OpenAI 配置是否正确
    const validation = azureOpenAI.validateConfig();
    if (!validation.isValid) {
      throw new Error(`Azure OpenAI 配置验证失败: ${validation.errors.join(', ')}`);
    }

    // 2. 解析请求体，并确保其中包含 prompt 字段
    const body = await request.json().catch((error) => {
      console.error('解析请求体错误:', error);
      throw new Error('请求体格式错误');
    });

    if (!body?.prompt) {
      return NextResponse.json({ error: '缺少 prompt 字段' }, { status: 400 });
    }
    
    // 3. 检测用户输入语言
    const userLanguage = detectLanguage(body.prompt);
    console.log(`检测到用户语言: ${userLanguage}`);

    // 4. 获取 Azure OpenAI 客户端和配置
    const client = azureOpenAI.getClient();
    const config = azureOpenAI.getConfig();

    console.log('开始生成流程，prompt:', body.prompt);
    console.log('使用的部署名称:', config.deploymentName);

    // 5. 调用 Azure OpenAI 服务，传入系统提示和用户输入
    // 添加用户语言信息到系统提示
    const systemPrompt = `${FLOW_GENERATION_PROMPT}\n\n当前用户语言: ${userLanguage === 'en' ? 'English' : '中文'}`;
    
    const response = await client.chat.completions.create({
      model: config.deploymentName,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: body.prompt }
      ],
      temperature: 0.7, // 增加创造性
      max_tokens: 16000  // 增加 token 限制以支持详细内容
    });

    console.log('AI 原始响应:', response);

    // 6. 检查响应中是否包含有效的 message 内容
    if (!response.choices?.[0]?.message?.content) {
      console.error('响应结构错误:', response);
      throw new Error('无效或空的 AI 响应');
    }

    // 7. 获取并修剪 AI 响应内容
    const trimmedContent = response.choices[0].message.content.trim();
    console.log('修剪后的内容:', trimmedContent);

    // 8. 使用 sanitizeJSON 提取出 JSON 部分（确保返回只包含有效 JSON）
    const cleanedContent = sanitizeJSON(trimmedContent);
    console.log('清洗后的内容:', cleanedContent);

    // 9. 添加额外的中文字符处理
    let processedContent = cleanedContent;
    try {
      // 先尝试检测是否是有效的JSON
      JSON.parse(cleanedContent);
    } catch (parseError) {
      console.log('初步JSON解析失败，尝试额外处理中文字符...');
      // 尝试替换一些可能导致问题的Unicode字符
      processedContent = cleanedContent
        .replace(/[\u2018\u2019]/g, "'")
        .replace(/[\u201C\u201D]/g, '"')
        // 处理一些特殊的Unicode空格
        .replace(/[\u00A0\u1680\u180E\u2000-\u200B\u202F\u205F\u3000\uFEFF]/g, ' ');
      
      // 为安全起见，再次尝试解码和编码
      try {
        const reEncoded = encodeURIComponent(processedContent);
        processedContent = decodeURIComponent(reEncoded);
      } catch (e) {
        console.warn('重编码处理失败:', e);
      }
    }

    // 10. 校验 JSON 格式
    const { isValid, error } = validateJSON(processedContent);
    if (!isValid) {
      console.error('JSON 校验错误:', error);
      console.error('校验失败的内容:', processedContent);
      throw new Error(`JSON 校验失败: ${error}`);
    }

    // 11. 尝试解析 JSON 字符串，如果失败则记录错误信息
    let flowData: GeneratedFlow;
    try {
      flowData = JSON.parse(processedContent);
    } catch (parseError) {
      console.error('JSON.parse 解析失败. 清洗后的内容:', processedContent);
      throw parseError;
    }

    // 12. 验证内容语言一致性
    const contentStructureValidation = validateContentStructure(flowData, userLanguage);
    if (!contentStructureValidation.isValid) {
      console.warn('内容语言验证警告:', contentStructureValidation.errors.join(', '));
      
      // 如果语言不一致，尝试重新生成一次
      if (contentStructureValidation.errors.some(err => err.includes('语言') || err.includes('language'))) {
        console.log('检测到语言不一致，尝试重新生成...');
        
        // 增强系统提示，强调语言要求
        const enhancedSystemPrompt = `${systemPrompt}\n\n【重要警告】当前检测到输出语言与用户语言不一致。用户语言是: ${userLanguage === 'en' ? 'ENGLISH' : '中文'}。请确保所有输出内容都使用${userLanguage === 'en' ? 'ENGLISH' : '中文'}。`;
        
        try {
          // 重新生成
          const retryResponse = await client.chat.completions.create({
            model: config.deploymentName,
            messages: [
              { role: 'system', content: enhancedSystemPrompt },
              { role: 'user', content: body.prompt }
            ],
            temperature: 0.7,
            max_tokens: 16000
          });
          
          // 解析重新生成的结果
          const retryContent = retryResponse.choices[0]?.message?.content || '';
          const sanitizedRetryContent = sanitizeJSON(retryContent);
          
          // 验证JSON格式
          const retryJsonValidation = validateJSON(sanitizedRetryContent);
          if (!retryJsonValidation.isValid) {
            console.warn('重新生成的JSON验证失败:', retryJsonValidation.error);
            console.warn('使用原始结果继续处理');
            // 如果JSON验证失败，使用原始结果继续
            return;
          }
          
          // 解析JSON
          let retryFlowData: GeneratedFlow;
          try {
            retryFlowData = JSON.parse(sanitizedRetryContent);
          } catch (retryParseError) {
            console.error('重新生成的JSON解析失败:', retryParseError);
            // 如果解析失败，使用原始结果继续
            return;
          }
          
          // 再次验证语言一致性
          const retryValidation = validateContentStructure(retryFlowData, userLanguage);
          if (retryValidation.isValid || retryValidation.errors.length < contentStructureValidation.errors.length) {
            // 如果重新生成的内容语言一致性更好，则使用重新生成的内容
            console.log('重新生成成功，语言一致性已改善');
            flowData = retryFlowData;
          } else {
            console.log('重新生成后语言一致性仍未改善，使用原始结果');
          }
        } catch (retryError) {
          console.error('重新生成失败:', retryError);
          // 如果重新生成失败，继续使用原始结果
        }
      }
    }

    // 13. 验证节点内容是否足够详细
    for (const node of flowData.nodes) {
      const contentValidation = validateNodeContent(node);
      if (!contentValidation.isValid) {
        console.warn(contentValidation.error);
        // 这里选择不抛出错误，而是添加警告日志，因为我们希望即使内容不够详细也能返回结果
      }
    }

    // 14. 格式化数据：处理节点和边（例如对坐标取整）
    const formattedData = {
      nodes: flowData.nodes.map(node => ({
        ...node,
        position: {
          x: Math.round(node.position.x),
          y: Math.round(node.position.y)
        }
      })),
      edges: flowData.edges,
      // 添加用户语言信息，便于前端同步更新UI语言
      userLanguage
    };

    return NextResponse.json(formattedData);
  } catch (error) {
    // 处理错误并返回适当的错误响应
    return handleAPIError(error);
  }
}

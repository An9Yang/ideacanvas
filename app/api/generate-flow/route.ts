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

    // 3. 获取 Azure OpenAI 客户端和配置
    const client = azureOpenAI.getClient();
    const config = azureOpenAI.getConfig();

    console.log('开始生成流程，prompt:', body.prompt);
    console.log('使用的部署名称:', config.deploymentName);

    // 4. 调用 Azure OpenAI 服务，传入系统提示和用户输入
    const response = await client.chat.completions.create({
      model: config.deploymentName,
      messages: [
        { role: 'system', content: FLOW_GENERATION_PROMPT },
        { role: 'user', content: body.prompt }
      ],
      max_completion_tokens: 16000  // 增加 token 限制以支持长响应
    });

    console.log('AI 原始响应:', response);

    // 5. 检查响应中是否包含有效的 message 内容
    if (!response.choices?.[0]?.message?.content) {
      console.error('响应结构错误:', response);
      throw new Error('无效或空的 AI 响应');
    }

    // 6. 获取并修剪 AI 响应内容
    const trimmedContent = response.choices[0].message.content.trim();
    console.log('修剪后的内容:', trimmedContent);

    // 7. 使用 sanitizeJSON 提取出 JSON 部分（确保返回只包含有效 JSON）
    const cleanedContent = sanitizeJSON(trimmedContent);
    console.log('清洗后的内容:', cleanedContent);

    // 8. 添加额外的中文字符处理
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

    // 9. 校验 JSON 格式
    const { isValid, error } = validateJSON(processedContent);
    if (!isValid) {
      console.error('JSON 校验错误:', error);
      console.error('校验失败的内容:', processedContent);
      throw new Error(`JSON 校验失败: ${error}`);
    }

    // 10. 尝试解析 JSON 字符串，如果失败则记录错误信息
    let flowData: GeneratedFlow;
    try {
      flowData = JSON.parse(processedContent);
    } catch (parseError) {
      console.error('JSON.parse 解析失败. 清洗后的内容:', processedContent);
      throw parseError;
    }

    // 11. 格式化数据：处理节点和边（例如对坐标取整）
    const formattedData = {
      nodes: flowData.nodes.map(node => ({
        type: node.type as NodeType,
        title: node.title,
        content: typeof node.content === 'object' ? JSON.stringify(node.content) : node.content,
        position: {
          x: Math.round(node.position.x),
          y: Math.round(node.position.y)
        }
      })),
      edges: flowData.edges.map(edge => ({
        source: edge.source,
        target: edge.target,
        description: edge.description
      }))
    };

    console.log('流程数据生成成功');
    return NextResponse.json(formattedData);

  } catch (error) {
    // 使用统一的错误处理函数返回错误信息
    const { error: errorMessage, details, statusCode } = handleAPIError(error);
    return NextResponse.json({ error: errorMessage, details }, { status: statusCode });
  }
}

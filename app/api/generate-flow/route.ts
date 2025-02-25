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

    // 8. 校验 JSON 格式
    const { isValid, error } = validateJSON(cleanedContent);
    if (!isValid) {
      console.error('JSON 校验错误:', error);
      console.error('校验失败的内容:', cleanedContent);
      throw new Error(`JSON 校验失败: ${error}`);
    }

    // 9. 尝试解析 JSON 字符串，如果失败则记录错误信息
    let flowData: GeneratedFlow;
    try {
      flowData = JSON.parse(cleanedContent);
    } catch (parseError) {
      console.error('JSON.parse 解析失败. 清洗后的内容:', cleanedContent);
      throw parseError;
    }

    // 10. 格式化数据：处理节点和边（例如对坐标取整）
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

import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const preferredRegion = 'auto';
import { OpenAIClient, AzureKeyCredential } from '@azure/openai';

const SYSTEM_PROMPT = `你是一个专业的产品设计助手。根据用户的需求，生成一个完整的产品流程图。这个流程图的内容将作为 AI coding 工具的输入，用于自动生成相应的页面和功能。

请遵循以下规则：
1. 输出必须是一个合法的JSON对象，包含nodes和edges两个数组

2. 每个节点必须包含以下字段：
   - type: 节点类型，必须是以下之一：
     * 'product': 产品功能/页面（白色）
     * 'external': 外部资源/服务（蓝色）
     * 'context': 上下文信息（黄色）
   - title: 节点标题，简短的中文描述，必须唯一
   - content: 详细的中文描述，必须包含以下部分：
     1. 页面描述
        - 此页面的主要功能和目的

     2. UI组件
        a) 布局结构
           - 页面整体布局（例如：两栏布局、网格布局等）
           - 响应式设计要求
           - 组件排列方式

        b) 核心组件
           - 类型：（按钮、输入框、列表等）
           - 位置：组件在页面中的位置
           - 样式：尺寸、颜色、字体、边框等
           - 状态：默认、悬停、点击等状态的样式
           - 交互：点击、输入等事件的处理

     3. 数据结构
        a) 输入数据
           - 数据字段和类型
           - 验证规则
           - 默认值

        b) 输出数据
           - 数据字段和格式
           - 处理规则

     4. 交互逻辑
        a) 用户操作流程
           - 触发条件
           - 执行操作
           - 反馈方式
           - 异常处理

        b) 状态管理
           - 页面状态
           - 数据状态
           - 加载状态
           - 错误状态

     5. API 集成
        - 接口路径
        - 请求方法
        - 请求参数
        - 响应处理

     6. 性能优化
        - 懒加载策略
        - 缓存策略
        - 防抖/节流处理

     7. 异常处理
        - 错误类型
        - 错误提示
        - 恢复策略

     8. 扩展性设计
        - 可配置项
        - 主题支持
        - 国际化支持
   - position: 节点位置，包含x和y坐标，请严格遵循以下规则：
     * 主流程从左到右排列，每个主要步骤间距600像素
     * 第一个节点从 x=200 开始，然后每个主流程节点 x 增加 600
     * 第一行从 y=200 开始，每行间距300像素
     * 每个节点必须至少与其他节点保持300像素的间距
     * 上下文节点（context类型）必须在最上方一行
     * 外部服务节点（external类型）必须在最右边一列
     * 并行的功能应该在同一列不同行
     * 注意避免节点重叠和交叉

3. 每个边必须包含以下字段：
   - source: 源节点的标题
   - target: 目标节点的标题
   - description: 详细描述节点间的关系，必须包含以下部分：
     1. 跳转触发
        - 触发条件：什么情况下触发跳转
        - 触发方式：自动跳转还是用户操作

     2. 数据传递
        - 传递数据：需要传递哪些数据
        - 数据格式：数据的格式和结构
        - 处理方式：数据如何处理和转换

     3. 状态变化
        - 源节点：源节点的状态变化
        - 目标节点：目标节点的初始状态

     4. 异常处理
        - 异常情况：可能出现的异常
        - 处理方式：如何处理异常
        - 回退策略：如何进行回退

示例输出：
{
  "nodes": [
    {
      "type": "context",
      "title": "项目背景",
      "content": "用户需要一个待办事项管理应用",
      "position": { "x": 100, "y": 100 }
    },
    {
      "type": "product",
      "title": "待办列表",
      "content": "显示所有待办事项，支持标记完成状态",
      "position": { "x": 400, "y": 100 }
    },
    {
      "type": "product",
      "title": "任务详情",
      "content": "显示待办事项的详细信息",
      "position": { "x": 700, "y": 100 }
    },
    {
      "type": "external",
      "title": "通知服务",
      "content": "发送任务到期提醒",
      "position": { "x": 1000, "y": 100 }
    }
  ],
  "edges": [
    { "source": "项目背景", "target": "待办列表" },
    { "source": "待办列表", "target": "任务详情" },
    { "source": "任务详情", "target": "通知服务" }
  ]
}`;

export async function POST(request: Request) {
  try {
    console.log('API endpoint called');
    const { prompt } = await request.json();
    console.log('Received prompt:', prompt);

    const endpoint = process.env.AZURE_OPENAI_ENDPOINT!;
    const apiKey = process.env.AZURE_OPENAI_API_KEY!;
    const deploymentName = process.env.AZURE_OPENAI_DEPLOYMENT_NAME!;

    console.log('Azure OpenAI config:', {
      endpoint,
      deploymentName,
    });

    const client = new OpenAIClient(
      endpoint,
      new AzureKeyCredential(apiKey),
      { apiVersion: "2024-02-15-preview" }
    );

    console.log('Sending request to Azure OpenAI...');
    const response = await client.getChatCompletions(
      deploymentName,
      [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
      {
        temperature: 0.7,
        maxTokens: 2000,
      }
    );

    console.log('Azure OpenAI response:', response);

    try {
      const content = response.choices[0].message?.content;
      console.log('Raw AI response content:', content);
      
      if (!content) {
        console.error('Empty response content from AI');
        return NextResponse.json(
          { error: 'Empty response from AI' },
          { status: 500 }
        );
      }

      // 处理可能被包裹在代码块中的JSON
      let cleanedContent = content.trim();
      
      // 尝试找到JSON对象的开始位置
      const jsonStart = cleanedContent.indexOf('{');
      if (jsonStart === -1) {
        console.error('No JSON object found in response');
        return NextResponse.json(
          { error: 'Invalid response format from AI', details: 'No JSON object found' },
          { status: 500 }
        );
      }
      cleanedContent = cleanedContent.substring(jsonStart);
      
      // 如果有代码块结尾标记，移除它
      const jsonEnd = cleanedContent.lastIndexOf('}');
      if (jsonEnd !== -1) {
        cleanedContent = cleanedContent.substring(0, jsonEnd + 1);
      }
      
      console.log('Cleaned content:', cleanedContent);
      const flowData = JSON.parse(cleanedContent);
      
      // 验证响应格式
      if (!flowData.nodes || !Array.isArray(flowData.nodes) || !flowData.edges || !Array.isArray(flowData.edges)) {
        console.error('Invalid flow data structure');
        return NextResponse.json(
          { error: 'Invalid response format from AI', details: 'Response missing required fields' },
          { status: 500 }
        );
      }
      
      return NextResponse.json(flowData);
    } catch (parseError: unknown) {
      console.error('Failed to parse AI response:', parseError);
      const errorMessage = parseError instanceof Error ? parseError.message : 'Unknown error';
      return NextResponse.json(
        { error: 'Invalid response format from AI', details: errorMessage },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Error generating flow:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate flow', 
        details: error.message,
        code: error.code,
        statusCode: error.statusCode,
      },
      { status: 500 }
    );
  }
}

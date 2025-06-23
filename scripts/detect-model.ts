/**
 * 模型检测脚本
 * 用于检测当前连接的Azure OpenAI服务使用的模型及其详细信息
 */

// 导入必要的依赖
const OpenAI = require('openai');
const dotenv = require('dotenv');

// 加载环境变量
dotenv.config();

/**
 * 获取模型详细信息
 */
async function detectModel() {
  try {
    console.log('🔍 正在检测连接的模型信息...');
    
    // 修正环境变量
    let endpoint = process.env.AZURE_OPENAI_ENDPOINT || '';
    if (endpoint.includes('/openai/deployments/')) {
      endpoint = endpoint.split('/openai/deployments/')[0];
    }
    
    // 确保端点URL不以斜杠结尾
    if (endpoint.endsWith('/')) {
      endpoint = endpoint.slice(0, -1);
    }
    
    // 修正API版本
    let apiVersion = process.env.AZURE_OPENAI_API_VERSION || '2024-04-01-preview';
    if (apiVersion.endsWith(';')) {
      apiVersion = apiVersion.slice(0, -1);
    }
    
    const deploymentName = process.env.AZURE_OPENAI_DEPLOYMENT_NAME || '';
    
    // 检查必要的配置
    if (!process.env.AZURE_OPENAI_API_KEY) {
      throw new Error('未设置 AZURE_OPENAI_API_KEY 环境变量');
    }
    if (!endpoint) {
      throw new Error('未设置 AZURE_OPENAI_ENDPOINT 环境变量');
    }
    if (!deploymentName) {
      throw new Error('未设置 AZURE_OPENAI_DEPLOYMENT_NAME 环境变量');
    }
    
    console.log('\n📋 配置信息:');
    console.log(`- 端点: ${endpoint}`);
    console.log(`- 部署名称: ${deploymentName}`);
    console.log(`- API版本: ${apiVersion}`);
    console.log(`- API密钥: ${'*'.repeat(5)}${process.env.AZURE_OPENAI_API_KEY.slice(-4)}`);
    
    // 初始化客户端
    const client = new OpenAI.AzureOpenAI({
      apiKey: process.env.AZURE_OPENAI_API_KEY,
      endpoint,
      deployment: deploymentName,
      apiVersion
    });

    console.log('\n⏳ 正在连接服务器获取模型信息...');
    
    // 发送探测请求
    const response = await client.chat.completions.create({
      model: deploymentName,
      messages: [
        { 
          role: 'user', 
          content: '请提供你的模型名称、版本号和主要能力。回复格式为JSON，包含字段：model_name, version, capabilities, token_limit' 
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0,
      max_tokens: 500
    });

    const modelResponse = response.choices[0].message.content;
    console.log('\n🤖 模型自我描述:');
    
    try {
      const modelInfo = JSON.parse(modelResponse || '{}');
      console.log(JSON.stringify(modelInfo, null, 2));
    } catch (e) {
      console.log(modelResponse);
    }
    
    // 获取更详细的模型信息
    console.log('\n📊 请求元数据:');
    console.log(`- 请求ID: ${response.id}`);
    console.log(`- 创建时间: ${new Date(response.created * 1000).toLocaleString()}`);
    console.log(`- 模型: ${response.model}`);
    console.log(`- 完成标记: ${response.usage?.completion_tokens || 'N/A'}`);
    console.log(`- 提示标记: ${response.usage?.prompt_tokens || 'N/A'}`);
    console.log(`- 总标记: ${response.usage?.total_tokens || 'N/A'}`);
    console.log(`- 完成原因: ${response.choices[0].finish_reason}`);
    
    // 发送系统信息探测请求
    console.log('\n🔄 正在获取系统信息...');
    const systemResponse = await client.chat.completions.create({
      model: deploymentName,
      messages: [
        {
          role: 'system',
          content: '你将以JSON格式提供关于你自己的详细信息'
        },
        { 
          role: 'user', 
          content: '提供你的系统信息，包括模型架构、训练数据截止日期、知识更新时间、训练参数量等。以JSON格式回复，格式自定。' 
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0,
      max_tokens: 500
    });
    
    const systemInfo = systemResponse.choices[0].message.content;
    console.log('\n💻 系统信息:');
    
    try {
      const parsedSystemInfo = JSON.parse(systemInfo || '{}');
      console.log(JSON.stringify(parsedSystemInfo, null, 2));
    } catch (e) {
      console.log(systemInfo);
    }
    
    // 测试高级指令理解能力
    console.log('\n🧠 正在测试高级指令理解能力...');
    const testResponse = await client.chat.completions.create({
      model: deploymentName,
      messages: [
        { 
          role: 'user', 
          content: '执行以下任务并以JSON格式回复，包含字段task_result和analysis：\n1. 解释量子纠缠的基本原理\n2. 分析这个任务对你来说的难度级别(1-10)' 
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0,
      max_tokens: 1000
    });
    
    const testResult = testResponse.choices[0].message.content;
    console.log('\n🔬 高级指令测试结果:');
    
    try {
      const parsedTestResult = JSON.parse(testResult || '{}');
      console.log(JSON.stringify(parsedTestResult, null, 2));
    } catch (e) {
      console.log(testResult);
    }
    
    console.log('\n✅ 模型检测完成!');
    
  } catch (error: any) {
    console.log('\n❌ 检测失败:');
    console.log(`错误信息: ${error.message}`);
    console.error('详细错误:', error);
  }
}

// 执行检测
detectModel();

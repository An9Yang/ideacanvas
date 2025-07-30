import 'dotenv/config';

async function testE2EFlow() {
  console.log('=== 端到端流程测试 ===\n');
  
  // 1. 测试流程生成
  console.log('步骤1: 测试流程生成...');
  try {
    const flowResponse = await fetch('http://localhost:3000/api/generate-flow', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: '创建一个电子商务网站，包含商品展示、购物车、用户登录、订单管理功能',
        language: 'zh'
      }),
    });
    
    if (!flowResponse.ok || !flowResponse.body) {
      throw new Error(`流程生成失败: ${flowResponse.statusText}`);
    }
    
    // 读取SSE流
    const reader = flowResponse.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let flowData: any = null;
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          try {
            const event = JSON.parse(data);
            if (event.type === 'status') {
              console.log(`  进度: ${event.message} (${event.progress}%)`);
            } else if (event.type === 'complete') {
              flowData = event.data;
            } else if (event.type === 'error') {
              throw new Error(event.error);
            }
          } catch (e) {
            // 忽略解析错误
          }
        }
      }
    }
    
    if (!flowData) {
      throw new Error('未收到流程数据');
    }
    
    console.log(`✅ 流程生成成功!`);
    console.log(`  - 节点数: ${flowData.nodes.length}`);
    console.log(`  - 边数: ${flowData.edges.length}`);
    
    // 打印所有节点类型
    console.log('  - 节点类型分布:');
    const nodeTypes = flowData.nodes.reduce((acc: any, node: any) => {
      acc[node.type] = (acc[node.type] || 0) + 1;
      return acc;
    }, {});
    Object.entries(nodeTypes).forEach(([type, count]) => {
      console.log(`    ${type}: ${count}`);
    });
    
    // 打印每个节点的内容长度
    console.log('  - 节点内容:');
    flowData.nodes.forEach((node: any, index: number) => {
      const contentLength = node.content?.length || 0;
      console.log(`    ${index + 1}. ${node.type} - "${node.title}" - 内容长度: ${contentLength}`);
    });
    
    // 查找文档节点或内容最丰富的节点
    let documentNode = flowData.nodes.find((n: any) => n.type === 'document');
    if (!documentNode) {
      // 如果没有文档节点，使用内容最丰富的节点
      documentNode = flowData.nodes.reduce((prev: any, curr: any) => {
        const prevLength = prev?.content?.length || 0;
        const currLength = curr?.content?.length || 0;
        return currLength > prevLength ? curr : prev;
      }, null);
      
      if (!documentNode || !documentNode.content) {
        throw new Error('没有节点包含内容');
      }
      console.log(`  - 使用 ${documentNode.type} 节点 "${documentNode.title}" 作为文档来源`);
    }
    
    console.log(`  - 文档节点内容长度: ${documentNode.content.length}`);
    
    // 2. 测试代码生成
    console.log('\n步骤2: 测试代码生成...');
    
    const codeResponse = await fetch('http://localhost:3000/api/generate-code-ai', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        documentContent: documentNode.content,
        options: {
          language: 'zh',
          styling: 'custom',
          framework: 'vanilla'
        }
      }),
    });
    
    if (!codeResponse.ok) {
      const error = await codeResponse.text();
      throw new Error(`代码生成失败: ${error}`);
    }
    
    const codeResult = await codeResponse.json();
    console.log('✅ 代码生成成功!');
    console.log(`  - 页面数: ${codeResult.pages?.length || 0}`);
    console.log(`  - HTML长度: ${codeResult.pages?.[0]?.html?.length || 0}`);
    console.log(`  - API端点数: ${codeResult.apiEndpoints?.length || 0}`);
    
    // 3. 验证生成的代码包含AI生成的内容
    const htmlContent = codeResult.pages?.[0]?.html || '';
    const hasAIContent = htmlContent.includes('商品') || 
                         htmlContent.includes('购物车') || 
                         htmlContent.includes('登录') ||
                         htmlContent.includes('订单');
    
    if (!hasAIContent) {
      console.warn('⚠️  生成的HTML可能没有包含预期的功能内容');
    } else {
      console.log('✅ HTML包含预期的功能内容');
    }
    
    console.log('\n=== 端到端测试完成 ===');
    
  } catch (error: any) {
    console.error('❌ 测试失败:', error.message);
    process.exit(1);
  }
}

// 运行测试
testE2EFlow().catch(console.error);
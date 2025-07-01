#!/usr/bin/env node

/**
 * 调试测试 - 查看具体的错误信息
 */

async function debugTest() {
  console.log('🔍 调试测试 - 查看详细错误信息\n');
  
  const testPrompt = "创建一个用户登录系统";
  console.log(`测试提示词: "${testPrompt}"\n`);
  
  try {
    console.log('发送请求...');
    const response = await fetch('http://localhost:3000/api/generate-flow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: testPrompt })
    });
    
    console.log(`响应状态: ${response.status}`);
    
    const data = await response.json();
    
    if (!response.ok) {
      console.log('\n❌ 错误响应:');
      console.log(JSON.stringify(data, null, 2));
      
      if (data.details) {
        console.log('\n错误详情:');
        console.log(data.details);
      }
      
      return;
    }
    
    console.log('\n✅ 成功响应:');
    console.log(`节点数量: ${data.nodes?.length || 0}`);
    console.log(`边数量: ${data.edges?.length || 0}`);
    
    if (data.nodes && data.nodes.length > 0) {
      console.log('\n节点详情:');
      data.nodes.forEach((node, index) => {
        console.log(`\n节点 ${index + 1}:`);
        console.log(`  ID: ${node.id}`);
        console.log(`  类型: ${node.type}`);
        console.log(`  标题: ${node.title || node.data?.label || 'N/A'}`);
        console.log(`  内容长度: ${(node.content || node.data?.content || '').length} 字符`);
        
        // 显示前200个字符的内容
        const content = node.content || node.data?.content || '';
        console.log(`  内容预览: ${content.substring(0, 200)}${content.length > 200 ? '...' : ''}`);
      });
    }
    
  } catch (error) {
    console.error('\n💥 请求失败:', error);
  }
}

// 检查服务器并运行测试
async function main() {
  try {
    const response = await fetch('http://localhost:3000');
    if (!response.ok) throw new Error('Server not ready');
    console.log('✅ 服务器正常\n');
  } catch {
    console.error('❌ 服务器未运行！请先运行 npm run dev');
    process.exit(1);
  }
  
  await debugTest();
}

main().catch(console.error);
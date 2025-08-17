require('dotenv').config({ path: '.env.local' });

async function parseSSEResponse(response) {
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let finalData = null;
  let messages = [];
  
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    
    const chunk = decoder.decode(value);
    const lines = chunk.split('\n');
    
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6);
        try {
          const parsed = JSON.parse(data);
          messages.push(parsed);
          if (parsed.type === 'complete' && parsed.data) {
            finalData = parsed.data;
          }
        } catch (e) {
          // Ignore parse errors
        }
      }
    }
  }
  
  return { finalData, messages };
}

async function testLanguageDetection() {
  console.log('🔍 Testing Language Detection and Generation\n');
  console.log('=' .repeat(60));
  
  const testCases = [
    {
      name: 'Pure Chinese',
      prompt: '创建一个电商平台，包含用户管理、商品管理、订单管理',
      expectedLang: 'zh',
      expectedContent: ['用户', '商品', '订单']
    },
    {
      name: 'Pure English',
      prompt: 'Create an e-commerce platform with user management, product management, order management',
      expectedLang: 'en',
      expectedContent: ['user', 'product', 'order']
    },
    {
      name: 'Mixed CN-EN',
      prompt: '开发一个social media应用，包含post功能和chat功能',
      expectedLang: 'zh',
      expectedContent: ['social', 'post', 'chat']
    }
  ];

  // Start server
  console.log('Starting server...');
  const { spawn } = require('child_process');
  const server = spawn('npm', ['run', 'dev'], {
    cwd: process.cwd(),
    detached: true,
    stdio: 'ignore'
  });

  // Wait for server
  await new Promise(resolve => setTimeout(resolve, 8000));

  for (const testCase of testCases) {
    console.log(`\n📝 Test: ${testCase.name}`);
    console.log(`Prompt: "${testCase.prompt}"`);
    console.log(`Expected Language: ${testCase.expectedLang}`);
    
    try {
      const response = await fetch('http://localhost:3000/api/generate-flow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: testCase.prompt })
      });

      if (!response.ok) {
        throw new Error(`Request failed: ${response.status}`);
      }

      const { finalData, messages } = await parseSSEResponse(response);
      
      // Check detected language
      const detectedLang = finalData?.userLanguage || 'unknown';
      console.log(`\n✅ Response received:`);
      console.log(`   Detected Language: ${detectedLang}`);
      console.log(`   Language Match: ${detectedLang === testCase.expectedLang ? '✅' : '❌'}`);
      
      // Check node content
      if (finalData?.nodes) {
        console.log(`   Nodes: ${finalData.nodes.length}`);
        
        // Sample first 3 nodes
        console.log(`\n   Sample nodes:`);
        finalData.nodes.slice(0, 3).forEach(node => {
          console.log(`   - ${node.data?.label || node.data?.title || 'No title'}`);
        });
        
        // Check if content matches expected language
        const allContent = finalData.nodes.map(n => 
          (n.data?.label || '') + ' ' + (n.data?.content || '')
        ).join(' ').toLowerCase();
        
        console.log(`\n   Content language check:`);
        testCase.expectedContent.forEach(keyword => {
          const found = allContent.includes(keyword.toLowerCase());
          console.log(`   - Contains "${keyword}": ${found ? '✅' : '❌'}`);
        });
        
        // Check for Chinese characters in content
        const hasChinese = /[\u4e00-\u9fa5]/.test(allContent);
        const hasEnglishWords = /[a-zA-Z]{3,}/.test(allContent);
        
        console.log(`\n   Character analysis:`);
        console.log(`   - Has Chinese characters: ${hasChinese ? '✅' : '❌'}`);
        console.log(`   - Has English words: ${hasEnglishWords ? '✅' : '❌'}`);
      }
      
      // Show AI messages
      console.log(`\n   AI Process messages:`);
      messages.filter(m => m.type === 'status').forEach(m => {
        console.log(`   - ${m.message}`);
      });
      
    } catch (error) {
      console.error(`❌ Test failed: ${error.message}`);
    }
    
    // Wait between tests
    await new Promise(resolve => setTimeout(resolve, 3000));
  }

  // Kill server
  console.log('\n\nStopping server...');
  try {
    process.kill(-server.pid);
  } catch (e) {
    // Ignore
  }

  console.log('\n' + '=' .repeat(60));
  console.log('Language test completed!');
}

testLanguageDetection().catch(console.error);
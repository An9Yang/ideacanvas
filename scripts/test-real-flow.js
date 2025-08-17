require('dotenv').config({ path: '.env.local' });
const fs = require('fs');

async function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testRealFlowGeneration() {
  console.log('🚀 Starting comprehensive flow generation test with MongoDB...\n');
  
  const testCases = [
    {
      name: 'Chinese E-commerce',
      prompt: '我想创建一个电商平台，包含用户注册登录、商品浏览、购物车、在线支付、订单管理、库存管理、商品推荐、用户评价、售后服务等功能',
      expectedNodes: ['用户', '商品', '购物车', '支付', '订单']
    },
    {
      name: 'English Social Media',
      prompt: 'Build a social media app with user authentication, profile management, post creation with images and videos, real-time chat, notifications, friend system, content recommendation algorithm, and admin dashboard',
      expectedNodes: ['authentication', 'profile', 'post', 'chat', 'notification']
    },
    {
      name: 'Mixed Healthcare System',
      prompt: '开发一个医疗管理系统 with patient registration, appointment scheduling, electronic health records, telemedicine consultation, prescription management, billing system, insurance integration, and reporting dashboard',
      expectedNodes: ['patient', 'appointment', 'health', 'prescription', 'billing']
    }
  ];

  const results = [];
  let allTestsPassed = true;

  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    console.log(`\n📝 Test ${i + 1}: ${testCase.name}`);
    console.log(`Prompt: ${testCase.prompt.substring(0, 100)}...`);
    
    try {
      // 1. Generate flow using AI
      console.log('  ⏳ Generating flow with AI...');
      const generateResponse = await fetch('http://localhost:3000/api/generate-flow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: testCase.prompt })
      });

      if (!generateResponse.ok) {
        const errorText = await generateResponse.text();
        throw new Error(`Generate failed: ${generateResponse.status} - ${errorText}`);
      }

      const flowData = await generateResponse.json();
      console.log(`  ✅ Flow generated successfully!`);
      console.log(`     - Nodes: ${flowData.nodes.length}`);
      console.log(`     - Edges: ${flowData.edges.length}`);
      console.log(`     - Language detected: ${flowData.language || 'en'}`);

      // 2. Save to MongoDB
      console.log('  ⏳ Saving to MongoDB...');
      const saveResponse = await fetch('http://localhost:3000/api/flows', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': 'test-user-real'
        },
        body: JSON.stringify({
          name: `${testCase.name} - ${new Date().toISOString()}`,
          nodes: flowData.nodes,
          edges: flowData.edges,
          description: testCase.prompt,
          metadata: {
            language: flowData.language,
            generatedFrom: testCase.prompt
          }
        })
      });

      if (!saveResponse.ok) {
        throw new Error(`Save failed: ${saveResponse.status}`);
      }

      const { flow: savedFlow } = await saveResponse.json();
      console.log(`  ✅ Saved to MongoDB!`);
      console.log(`     - ID: ${savedFlow.id}`);
      console.log(`     - Created: ${savedFlow.createdAt}`);

      // 3. Verify retrieval from MongoDB
      console.log('  ⏳ Verifying retrieval from MongoDB...');
      const getResponse = await fetch(`http://localhost:3000/api/flows/${savedFlow.id}`, {
        headers: {
          'x-user-id': 'test-user-real'
        }
      });

      if (!getResponse.ok) {
        throw new Error(`Retrieval failed: ${getResponse.status}`);
      }

      const { flow: retrievedFlow } = await getResponse.json();
      console.log(`  ✅ Retrieved successfully!`);
      console.log(`     - Nodes match: ${retrievedFlow.nodes.length === flowData.nodes.length}`);
      console.log(`     - Edges match: ${retrievedFlow.edges.length === flowData.edges.length}`);

      // 4. Validate content
      console.log('  ⏳ Validating generated content...');
      let validationPassed = true;
      const nodeContents = flowData.nodes.map(n => 
        (n.data?.title || '').toLowerCase() + ' ' + (n.data?.content || '').toLowerCase()
      ).join(' ');

      for (const expectedNode of testCase.expectedNodes) {
        if (!nodeContents.includes(expectedNode.toLowerCase())) {
          console.log(`  ⚠️  Missing expected content: ${expectedNode}`);
          validationPassed = false;
        }
      }

      if (validationPassed) {
        console.log(`  ✅ Content validation passed!`);
      } else {
        console.log(`  ⚠️  Some expected content was missing`);
      }

      // Store result
      results.push({
        testCase: testCase.name,
        success: true,
        flowId: savedFlow.id,
        nodes: flowData.nodes.length,
        edges: flowData.edges.length,
        validationPassed
      });

      // Wait before next test
      if (i < testCases.length - 1) {
        console.log('\n  Waiting 2 seconds before next test...');
        await wait(2000);
      }

    } catch (error) {
      console.error(`  ❌ Test failed: ${error.message}`);
      results.push({
        testCase: testCase.name,
        success: false,
        error: error.message
      });
      allTestsPassed = false;
    }
  }

  // 5. List all flows
  console.log('\n\n📋 Listing all flows in MongoDB...');
  try {
    const listResponse = await fetch('http://localhost:3000/api/flows', {
      headers: {
        'x-user-id': 'test-user-real'
      }
    });

    const { flows } = await listResponse.json();
    console.log(`Found ${flows.length} flows in MongoDB:`);
    flows.forEach((flow, index) => {
      console.log(`  ${index + 1}. ${flow.name}`);
      console.log(`     ID: ${flow.id}`);
      console.log(`     Nodes: ${flow.nodes.length}, Edges: ${flow.edges.length}`);
      console.log(`     Created: ${flow.createdAt}`);
    });
  } catch (error) {
    console.error('Failed to list flows:', error.message);
  }

  // 6. Summary
  console.log('\n\n' + '='.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(60));
  
  results.forEach(result => {
    const status = result.success ? '✅' : '❌';
    console.log(`${status} ${result.testCase}`);
    if (result.success) {
      console.log(`   - Flow ID: ${result.flowId}`);
      console.log(`   - Nodes: ${result.nodes}, Edges: ${result.edges}`);
      console.log(`   - Validation: ${result.validationPassed ? 'PASSED' : 'PARTIAL'}`);
    } else {
      console.log(`   - Error: ${result.error}`);
    }
  });

  const successCount = results.filter(r => r.success).length;
  console.log('\n' + '='.repeat(60));
  console.log(`OVERALL: ${successCount}/${results.length} tests passed`);
  
  if (allTestsPassed) {
    console.log('🎉 All tests completed successfully!');
  } else {
    console.log('⚠️  Some tests failed. Check the details above.');
  }

  // Save results to file
  const reportPath = './test-results-mongodb.json';
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
  console.log(`\n📄 Detailed results saved to: ${reportPath}`);

  return allTestsPassed;
}

// Wait for server to be ready
async function waitForServer(maxAttempts = 10) {
  console.log('Waiting for server to be ready...');
  
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const response = await fetch('http://localhost:3000/api/flows', { method: 'HEAD' });
      if (response.ok || response.status === 405) {
        console.log('✅ Server is ready!\n');
        return true;
      }
    } catch (error) {
      // Server not ready yet
    }
    await wait(2000);
  }
  
  console.error('❌ Server failed to start');
  return false;
}

// Main execution
(async () => {
  const serverReady = await waitForServer();
  
  if (!serverReady) {
    console.error('Please ensure the development server is running (npm run dev)');
    process.exit(1);
  }

  const success = await testRealFlowGeneration();
  process.exit(success ? 0 : 1);
})();
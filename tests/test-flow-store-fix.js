// Test loadCloudFlow functionality with real data
const path = require('path');
const { readFileSync } = require('fs');

// Set up module aliases
require('module-alias/register');
require('module-alias').addAlias('@', path.join(__dirname, '..'));

async function testLoadCloudFlow() {
  console.log('Testing loadCloudFlow functionality...\n');

  // Import store
  const { useFlowStore } = require('../lib/stores/flow-store');

  // Test 1: Mock successful API response
  console.log('Test 1: Loading flow with proper data structure');
  
  // Mock fetch globally
  global.fetch = async (url) => {
    console.log(`  Mocked fetch called with: ${url}`);
    
    if (url === '/api/flows/test-flow-123') {
      return {
        ok: true,
        json: async () => ({
          id: 'test-flow-123',
          name: 'E-commerce Checkout Flow',
          nodes: [
            {
              id: 'node-1',
              type: 'product',
              position: { x: 100, y: 100 },
              data: {
                title: 'Shopping Cart',
                content: 'Display cart items\nCalculate total\nApply discounts',
              },
            },
            {
              id: 'node-2',
              type: 'external',
              position: { x: 350, y: 100 },
              data: {
                title: 'Payment Gateway',
                content: 'Stripe API integration\nProcess payment\nHandle 3D Secure',
              },
            },
            {
              id: 'node-3',
              type: 'context',
              position: { x: 600, y: 100 },
              data: {
                title: 'Order Database',
                content: 'Save order details\nUpdate inventory\nGenerate order ID',
              },
            },
          ],
          edges: [
            { id: 'e1', source: 'node-1', target: 'node-2' },
            { id: 'e2', source: 'node-2', target: 'node-3' },
          ],
        }),
      };
    }
    
    throw new Error('Flow not found');
  };

  try {
    const store = useFlowStore.getState();
    
    if (store.loadCloudFlow) {
      await store.loadCloudFlow('test-flow-123');
      
      const newState = useFlowStore.getState();
      console.log('  ✅ Flow loaded successfully');
      console.log(`  - Nodes loaded: ${newState.nodes.length}`);
      console.log(`  - Edges loaded: ${newState.edges.length}`);
      console.log(`  - All nodes have updateNodeContent: ${newState.nodes.every(n => n.data.updateNodeContent)}`);
    } else {
      console.log('  ❌ loadCloudFlow function not found');
    }
  } catch (error) {
    console.log(`  ❌ Error: ${error.message}`);
  }

  // Test 2: Legacy format (nodes without data property)
  console.log('\nTest 2: Loading flow with legacy format');
  
  global.fetch = async (url) => {
    console.log(`  Mocked fetch called with: ${url}`);
    
    if (url === '/api/flows/legacy-flow') {
      return {
        ok: true,
        json: async () => ({
          id: 'legacy-flow',
          name: 'Legacy Flow',
          nodes: [
            {
              id: 'old-1',
              type: 'product',
              position: { x: 100, y: 100 },
              title: 'Legacy Node',
              content: 'This is old format',
              // No data property!
            },
          ],
          edges: [],
        }),
      };
    }
  };

  try {
    const store = useFlowStore.getState();
    await store.loadCloudFlow('legacy-flow');
    
    const newState = useFlowStore.getState();
    console.log('  ✅ Legacy flow converted successfully');
    console.log(`  - Node has data property: ${!!newState.nodes[0]?.data}`);
    console.log(`  - Node title: ${newState.nodes[0]?.data?.title}`);
    console.log(`  - Node content: ${newState.nodes[0]?.data?.content}`);
  } catch (error) {
    console.log(`  ❌ Error: ${error.message}`);
  }

  // Test 3: API error handling
  console.log('\nTest 3: Handling API errors');
  
  global.fetch = async (url) => {
    console.log(`  Mocked fetch called with: ${url}`);
    return {
      ok: false,
      status: 404,
    };
  };

  try {
    const store = useFlowStore.getState();
    await store.loadCloudFlow('non-existent');
    console.log('  ❌ Should have thrown an error');
  } catch (error) {
    console.log('  ✅ Error correctly thrown:', error.message);
  }

  // Test 4: Real-world complex flow
  console.log('\nTest 4: Complex real-world flow');
  
  const complexFlow = {
    id: 'saas-onboarding',
    name: 'SaaS User Onboarding Flow',
    nodes: [
      {
        id: 'signup',
        type: 'product',
        position: { x: 50, y: 200 },
        data: {
          title: '用户注册',
          content: `功能需求：
- 邮箱/手机号注册
- OAuth (Google/GitHub)
- 密码强度验证
- 验证码功能`,
        },
      },
      {
        id: 'email-service',
        type: 'external',
        position: { x: 300, y: 100 },
        data: {
          title: '邮件服务',
          content: `SendGrid API：
- 发送欢迎邮件
- 验证邮件
- 模板管理`,
        },
      },
      {
        id: 'user-db',
        type: 'context',
        position: { x: 300, y: 300 },
        data: {
          title: '用户数据库',
          content: `PostgreSQL:
- users 表
- profiles 表
- preferences 表`,
        },
      },
      {
        id: 'onboarding',
        type: 'product',
        position: { x: 550, y: 200 },
        data: {
          title: '引导流程',
          content: `步骤：
1. 个人资料完善
2. 选择订阅计划
3. 团队邀请
4. 初始设置`,
        },
      },
      {
        id: 'analytics',
        type: 'external',
        position: { x: 800, y: 200 },
        data: {
          title: '分析追踪',
          content: `Segment + Amplitude:
- 注册转化率
- 引导完成率
- 用户行为分析`,
        },
      },
    ],
    edges: [
      { id: 'e1', source: 'signup', target: 'email-service', type: 'smoothstep' },
      { id: 'e2', source: 'signup', target: 'user-db', type: 'smoothstep' },
      { id: 'e3', source: 'user-db', target: 'onboarding', type: 'smoothstep' },
      { id: 'e4', source: 'onboarding', target: 'analytics', type: 'smoothstep' },
    ],
  };

  global.fetch = async (url) => {
    console.log(`  Mocked fetch called with: ${url}`);
    return {
      ok: true,
      json: async () => complexFlow,
    };
  };

  try {
    const store = useFlowStore.getState();
    
    // Clear existing state
    store.set({ nodes: [], edges: [] });
    
    await store.loadCloudFlow('saas-onboarding');
    
    const newState = useFlowStore.getState();
    console.log('  ✅ Complex flow loaded successfully');
    console.log(`  - Total nodes: ${newState.nodes.length}`);
    console.log(`  - Total edges: ${newState.edges.length}`);
    console.log(`  - Node types: ${[...new Set(newState.nodes.map(n => n.type))].join(', ')}`);
    console.log(`  - Chinese content preserved: ${newState.nodes.some(n => n.data.content.includes('中文') || n.data.content.includes('用户'))}`);
    
    // Verify all nodes have required functions
    const allNodesValid = newState.nodes.every(node => 
      node.data && 
      typeof node.data.updateNodeContent === 'function'
    );
    console.log(`  - All nodes have updateNodeContent: ${allNodesValid}`);
    
  } catch (error) {
    console.log(`  ❌ Error: ${error.message}`);
    console.error(error);
  }

  console.log('\n所有测试完成！');
}

// Run tests
testLoadCloudFlow().catch(console.error);
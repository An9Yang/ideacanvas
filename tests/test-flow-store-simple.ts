import { useFlowStore } from '../lib/stores/flow-store';

// Simple test for loadCloudFlow
async function testLoadCloudFlow() {
  console.log('=== Testing loadCloudFlow with Real Data ===\n');

  // Mock fetch for testing
  (global as any).fetch = async (url: string) => {
    console.log(`Fetch called with URL: ${url}`);
    
    // Mock successful response
    if (url.includes('/api/flows/')) {
      const flowId = url.split('/').pop();
      
      // Return different flows based on ID
      const flows: Record<string, any> = {
        'test-123': {
          id: 'test-123',
          name: 'E-commerce Platform',
          nodes: [
            {
              id: 'frontend',
              type: 'product',
              position: { x: 100, y: 100 },
              data: {
                title: 'React Frontend',
                content: '- Product catalog\n- Shopping cart\n- User authentication\n- Payment integration',
              },
            },
            {
              id: 'backend',
              type: 'product',
              position: { x: 400, y: 100 },
              data: {
                title: 'Node.js Backend',
                content: '- RESTful API\n- JWT authentication\n- Order processing\n- Inventory management',
              },
            },
            {
              id: 'database',
              type: 'context',
              position: { x: 250, y: 250 },
              data: {
                title: 'PostgreSQL',
                content: '- Products table\n- Users table\n- Orders table\n- Inventory tracking',
              },
            },
            {
              id: 'payment',
              type: 'external',
              position: { x: 550, y: 250 },
              data: {
                title: 'Stripe Payment',
                content: '- Payment processing\n- Subscription management\n- Invoice generation',
              },
            },
          ],
          edges: [
            { id: 'e1', source: 'frontend', target: 'backend', type: 'smoothstep' },
            { id: 'e2', source: 'backend', target: 'database', type: 'smoothstep' },
            { id: 'e3', source: 'backend', target: 'payment', type: 'smoothstep' },
          ],
        },
        'legacy-format': {
          id: 'legacy-format',
          name: 'Legacy Flow',
          nodes: [
            {
              id: 'old-node',
              type: 'product',
              position: { x: 100, y: 100 },
              // Old format without data wrapper
              title: 'Legacy Component',
              content: 'This uses the old format',
            },
          ],
          edges: [],
        },
      };

      const flow = flows[flowId!];
      if (flow) {
        return {
          ok: true,
          json: async () => flow,
        };
      }
    }
    
    // Mock 404 response
    return {
      ok: false,
      status: 404,
      statusText: 'Not Found',
    };
  };

  // Test 1: Load normal flow
  console.log('Test 1: Loading flow with proper data structure');
  try {
    const { loadCloudFlow } = useFlowStore.getState();
    
    if (!loadCloudFlow) {
      console.log('❌ loadCloudFlow function not found in store');
      return;
    }

    // Clear state
    useFlowStore.setState({ nodes: [], edges: [] });
    
    await loadCloudFlow('test-123');
    
    const state = useFlowStore.getState();
    console.log('✅ Flow loaded successfully');
    console.log(`   Nodes: ${state.nodes.length}`);
    console.log(`   Edges: ${state.edges.length}`);
    console.log(`   Node types: ${state.nodes.map(n => n.type).join(', ')}`);
    
    // Verify updateNodeContent is attached
    const hasUpdateFunction = state.nodes.every(n => typeof n.data.updateNodeContent === 'function');
    console.log(`   All nodes have updateNodeContent: ${hasUpdateFunction ? '✅' : '❌'}`);
    
  } catch (error) {
    console.log('❌ Test 1 failed:', error);
  }

  // Test 2: Load legacy format
  console.log('\nTest 2: Loading flow with legacy format (no data wrapper)');
  try {
    const { loadCloudFlow } = useFlowStore.getState();
    
    // Clear state
    useFlowStore.setState({ nodes: [], edges: [] });
    
    await loadCloudFlow!('legacy-format');
    
    const state = useFlowStore.getState();
    console.log('✅ Legacy flow converted successfully');
    console.log(`   Nodes: ${state.nodes.length}`);
    console.log(`   Node has data property: ${!!state.nodes[0]?.data}`);
    console.log(`   Title: ${state.nodes[0]?.data?.title}`);
    console.log(`   Content: ${state.nodes[0]?.data?.content}`);
    
  } catch (error) {
    console.log('❌ Test 2 failed:', error);
  }

  // Test 3: Error handling
  console.log('\nTest 3: Error handling for non-existent flow');
  try {
    const { loadCloudFlow } = useFlowStore.getState();
    
    await loadCloudFlow!('non-existent-flow');
    console.log('❌ Should have thrown an error');
    
  } catch (error) {
    console.log('✅ Error correctly thrown:', (error as Error).message);
  }

  // Test 4: Complex real-world flow
  console.log('\nTest 4: Complex multi-language flow');
  
  (global as any).fetch = async () => ({
    ok: true,
    json: async () => ({
      id: 'complex-flow',
      name: 'AI助手开发流程',
      nodes: [
        {
          id: 'requirements',
          type: 'product',
          position: { x: 50, y: 200 },
          data: {
            title: '需求分析',
            content: `功能需求：
- 自然语言理解
- 多轮对话管理
- 知识库集成
- 实时响应

技术要求：
- 支持中英文
- 响应时间 < 2秒
- 并发用户 > 1000`,
          },
        },
        {
          id: 'llm-service',
          type: 'external',
          position: { x: 350, y: 100 },
          data: {
            title: 'LLM Service',
            content: `Azure OpenAI:
- GPT-4 for complex queries
- GPT-3.5 for simple tasks
- Embeddings for semantic search
- Fine-tuning capabilities`,
          },
        },
        {
          id: 'vector-db',
          type: 'context',
          position: { x: 350, y: 300 },
          data: {
            title: '向量数据库',
            content: `Pinecone/Weaviate:
- 存储文档嵌入
- 语义搜索
- 元数据过滤
- 实时索引更新`,
          },
        },
        {
          id: 'api-gateway',
          type: 'product',
          position: { x: 650, y: 200 },
          data: {
            title: 'API Gateway',
            content: `Features:
- Rate limiting
- Authentication
- Request routing
- Response caching
- WebSocket support`,
          },
        },
      ],
      edges: [
        { id: 'e1', source: 'requirements', target: 'llm-service' },
        { id: 'e2', source: 'requirements', target: 'vector-db' },
        { id: 'e3', source: 'llm-service', target: 'api-gateway' },
        { id: 'e4', source: 'vector-db', target: 'api-gateway' },
      ],
    }),
  });

  try {
    const { loadCloudFlow } = useFlowStore.getState();
    
    // Clear state
    useFlowStore.setState({ nodes: [], edges: [], history: [], currentHistoryIndex: -1 });
    
    await loadCloudFlow!('complex-flow');
    
    const state = useFlowStore.getState();
    console.log('✅ Complex flow loaded successfully');
    console.log(`   Nodes: ${state.nodes.length}`);
    console.log(`   Edges: ${state.edges.length}`);
    console.log(`   History reset: ${state.history?.length === 0 ? '✅' : '❌'}`);
    console.log(`   Contains Chinese: ${state.nodes.some(n => /[\u4e00-\u9fa5]/.test(n.data.content)) ? '✅' : '❌'}`);
    console.log(`   Contains English: ${state.nodes.some(n => /[a-zA-Z]/.test(n.data.content)) ? '✅' : '❌'}`);
    
  } catch (error) {
    console.log('❌ Test 4 failed:', error);
  }

  console.log('\n=== All Tests Completed ===');
}

// Run the test
testLoadCloudFlow().catch(console.error);
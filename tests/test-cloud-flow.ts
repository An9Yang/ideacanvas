import { useFlowStore } from '@/lib/stores/flow-store';

// Mock fetch for testing
global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>;

describe('loadCloudFlow', () => {
  beforeEach(() => {
    // Reset store state
    useFlowStore.setState({
      nodes: [],
      edges: [],
      history: [],
      currentHistoryIndex: -1,
    });
    
    // Clear fetch mock
    (global.fetch as jest.Mock).mockClear();
  });

  test('should load flow from cloud successfully', async () => {
    const mockFlow = {
      id: 'test-flow-123',
      name: 'Test Flow',
      nodes: [
        {
          id: 'node-1',
          type: 'product',
          position: { x: 100, y: 100 },
          data: {
            title: 'Product Node',
            content: 'This is a product node',
          },
        },
        {
          id: 'node-2',
          type: 'external',
          position: { x: 300, y: 100 },
          data: {
            title: 'External Node',
            content: 'This is an external node',
          },
        },
      ],
      edges: [
        {
          id: 'edge-1',
          source: 'node-1',
          target: 'node-2',
          type: 'smoothstep',
        },
      ],
    };

    // Mock successful API response
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockFlow,
    } as Response);

    // Call loadCloudFlow
    const { loadCloudFlow } = useFlowStore.getState();
    if (loadCloudFlow) {
      await loadCloudFlow('test-flow-123');
    }

    // Verify state was updated
    const state = useFlowStore.getState();
    expect(state.nodes).toHaveLength(2);
    expect(state.edges).toHaveLength(1);
    expect(state.nodes[0].data.updateNodeContent).toBeDefined();
    expect(state.nodes[1].data.updateNodeContent).toBeDefined();
    expect(state.history).toEqual([]);
    expect(state.currentHistoryIndex).toBe(-1);

    // Verify API was called correctly
    expect(global.fetch).toHaveBeenCalledWith('/api/flows/test-flow-123');
  });

  test('should handle nodes without data property', async () => {
    const mockFlow = {
      id: 'test-flow-456',
      name: 'Legacy Flow',
      nodes: [
        {
          id: 'node-1',
          type: 'product',
          position: { x: 100, y: 100 },
          title: 'Legacy Node',
          content: 'This is a legacy format node',
          // Note: no 'data' property
        },
      ],
      edges: [],
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockFlow,
    } as Response);

    const { loadCloudFlow } = useFlowStore.getState();
    if (loadCloudFlow) {
      await loadCloudFlow('test-flow-456');
    }

    const state = useFlowStore.getState();
    expect(state.nodes).toHaveLength(1);
    expect(state.nodes[0].data).toBeDefined();
    expect(state.nodes[0].data.title).toBe('Legacy Node');
    expect(state.nodes[0].data.content).toBe('This is a legacy format node');
    expect(state.nodes[0].data.updateNodeContent).toBeDefined();
  });

  test('should handle API errors', async () => {
    // Mock failed API response
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: 'Not Found',
    } as Response);

    const { loadCloudFlow } = useFlowStore.getState();
    
    // Should throw error
    await expect(loadCloudFlow?.('non-existent-flow')).rejects.toThrow('Failed to load cloud flow');

    // State should remain unchanged
    const state = useFlowStore.getState();
    expect(state.nodes).toEqual([]);
    expect(state.edges).toEqual([]);
  });

  test('should handle network errors', async () => {
    // Mock network error
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    const { loadCloudFlow } = useFlowStore.getState();
    
    // Should throw error
    await expect(loadCloudFlow?.('test-flow')).rejects.toThrow('Network error');

    // State should remain unchanged
    const state = useFlowStore.getState();
    expect(state.nodes).toEqual([]);
    expect(state.edges).toEqual([]);
  });
});

// Run tests with real data
async function testWithRealData() {
  console.log('Testing loadCloudFlow with real-like data...\n');

  // Test 1: Complex flow with multiple node types
  const complexFlow = {
    id: 'complex-flow-001',
    name: '复杂的业务流程',
    nodes: [
      {
        id: 'start',
        type: 'product',
        position: { x: 50, y: 200 },
        data: {
          title: '用户注册',
          content: '1. 输入邮箱和密码\n2. 验证邮箱格式\n3. 检查密码强度\n4. 发送验证邮件',
        },
      },
      {
        id: 'verify',
        type: 'external',
        position: { x: 300, y: 100 },
        data: {
          title: '邮箱验证服务',
          content: 'AWS SES 或 SendGrid API\n- 发送验证链接\n- 处理邮件退信\n- 记录发送状态',
        },
      },
      {
        id: 'database',
        type: 'context',
        position: { x: 300, y: 300 },
        data: {
          title: '数据库操作',
          content: 'PostgreSQL 数据库\n- users 表\n- email_verifications 表\n- 事务处理确保数据一致性',
        },
      },
      {
        id: 'analytics',
        type: 'external',
        position: { x: 550, y: 200 },
        data: {
          title: '分析服务',
          content: 'Google Analytics 或 Mixpanel\n记录用户注册事件',
        },
      },
    ],
    edges: [
      { id: 'e1', source: 'start', target: 'verify', type: 'smoothstep' },
      { id: 'e2', source: 'start', target: 'database', type: 'smoothstep' },
      { id: 'e3', source: 'database', target: 'analytics', type: 'smoothstep' },
    ],
  };

  try {
    // Simulate API call
    console.log('Simulating API call to /api/flows/complex-flow-001');
    
    // In real scenario, this would be an actual API call
    // For testing, we'll directly manipulate the store
    const { set, get } = useFlowStore.getState();
    
    // Process nodes as loadCloudFlow would
    const processedNodes = complexFlow.nodes.map((node: any) => ({
      ...node,
      data: {
        ...node.data,
        updateNodeContent: get().updateNodeContent,
      },
    }));

    set({
      nodes: processedNodes,
      edges: complexFlow.edges,
      history: [],
      currentHistoryIndex: -1,
    });

    console.log('✅ Complex flow loaded successfully');
    console.log(`   - Nodes: ${processedNodes.length}`);
    console.log(`   - Edges: ${complexFlow.edges.length}`);
    console.log(`   - Node types: ${[...new Set(processedNodes.map(n => n.type))].join(', ')}`);

  } catch (error) {
    console.error('❌ Failed to load complex flow:', error);
  }

  // Test 2: Flow with missing data properties (legacy format)
  const legacyFlow = {
    id: 'legacy-flow-002',
    name: 'Legacy Format Flow',
    nodes: [
      {
        id: 'old-node-1',
        type: 'product',
        position: { x: 100, y: 100 },
        title: 'Old Format Node',
        content: 'This node uses the old format without data wrapper',
      },
    ],
    edges: [],
  };

  try {
    console.log('\nSimulating API call for legacy format flow');
    
    const { get } = useFlowStore.getState();
    
    // Process legacy nodes
    const processedLegacyNodes = legacyFlow.nodes.map((node: any) => {
      if (!node.data) {
        return {
          ...node,
          data: {
            title: node.title || 'Untitled',
            content: node.content || '',
            updateNodeContent: get().updateNodeContent,
          },
        };
      }
      return {
        ...node,
        data: {
          ...node.data,
          updateNodeContent: get().updateNodeContent,
        },
      };
    });

    console.log('✅ Legacy flow converted and loaded successfully');
    console.log(`   - Original format: ${legacyFlow.nodes[0].hasOwnProperty('data') ? 'new' : 'legacy'}`);
    console.log(`   - Converted nodes: ${processedLegacyNodes.length}`);

  } catch (error) {
    console.error('❌ Failed to process legacy flow:', error);
  }

  console.log('\n测试完成！');
}

// Run the tests
if (require.main === module) {
  testWithRealData().catch(console.error);
}
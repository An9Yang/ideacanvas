require('dotenv').config({ path: '.env.local' });

async function testFlowWithMongoDB() {
  console.log('Testing flow generation with MongoDB storage...\n');

  const testFlow = {
    name: 'Test E-commerce Flow',
    nodes: [
      {
        id: '1',
        type: 'product',
        position: { x: 100, y: 100 },
        data: {
          title: 'User Registration',
          content: 'Allow users to create accounts with email/password or social login'
        }
      },
      {
        id: '2',
        type: 'product',
        position: { x: 300, y: 100 },
        data: {
          title: 'Product Catalog',
          content: 'Display products with search, filter, and sort capabilities'
        }
      },
      {
        id: '3',
        type: 'external',
        position: { x: 500, y: 100 },
        data: {
          title: 'Payment Gateway',
          content: 'Integration with Stripe for secure payment processing'
        }
      }
    ],
    edges: [
      { id: 'e1-2', source: '1', target: '2' },
      { id: 'e2-3', source: '2', target: '3' }
    ]
  };

  try {
    // Test POST /api/flows - Create flow
    console.log('1. Creating flow in MongoDB...');
    const createResponse = await fetch('http://localhost:3000/api/flows', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': 'test-user-123'
      },
      body: JSON.stringify(testFlow)
    });

    if (!createResponse.ok) {
      throw new Error(`Create failed: ${createResponse.status} ${createResponse.statusText}`);
    }

    const { flow: createdFlow } = await createResponse.json();
    console.log('✅ Flow created successfully!');
    console.log('   ID:', createdFlow.id);
    console.log('   Name:', createdFlow.name);
    console.log('   Nodes:', createdFlow.nodes.length);
    console.log('   Edges:', createdFlow.edges.length);
    console.log('   Created:', createdFlow.createdAt);

    // Test GET /api/flows/[id] - Get specific flow
    console.log('\n2. Retrieving flow from MongoDB...');
    const getResponse = await fetch(`http://localhost:3000/api/flows/${createdFlow.id}`, {
      headers: {
        'x-user-id': 'test-user-123'
      }
    });

    if (!getResponse.ok) {
      throw new Error(`Get failed: ${getResponse.status} ${getResponse.statusText}`);
    }

    const { flow: retrievedFlow } = await getResponse.json();
    console.log('✅ Flow retrieved successfully!');
    console.log('   Verified ID:', retrievedFlow.id === createdFlow.id);

    // Test PUT /api/flows/[id] - Update flow
    console.log('\n3. Updating flow in MongoDB...');
    const updateResponse = await fetch(`http://localhost:3000/api/flows/${createdFlow.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': 'test-user-123'
      },
      body: JSON.stringify({
        name: 'Updated E-commerce Flow',
        nodes: [...testFlow.nodes, {
          id: '4',
          type: 'product',
          position: { x: 700, y: 100 },
          data: {
            title: 'Order Management',
            content: 'Track and manage customer orders'
          }
        }]
      })
    });

    if (!updateResponse.ok) {
      throw new Error(`Update failed: ${updateResponse.status} ${updateResponse.statusText}`);
    }

    const { flow: updatedFlow } = await updateResponse.json();
    console.log('✅ Flow updated successfully!');
    console.log('   New name:', updatedFlow.name);
    console.log('   Nodes count:', updatedFlow.nodes.length);

    // Test GET /api/flows - List all flows
    console.log('\n4. Listing all flows from MongoDB...');
    const listResponse = await fetch('http://localhost:3000/api/flows', {
      headers: {
        'x-user-id': 'test-user-123'
      }
    });

    if (!listResponse.ok) {
      throw new Error(`List failed: ${listResponse.status} ${listResponse.statusText}`);
    }

    const { flows } = await listResponse.json();
    console.log('✅ Flows listed successfully!');
    console.log('   Total flows:', flows.length);
    flows.forEach((flow, index) => {
      console.log(`   ${index + 1}. ${flow.name} (${flow.id})`);
    });

    // Test DELETE /api/flows/[id] - Delete flow
    console.log('\n5. Deleting flow from MongoDB...');
    const deleteResponse = await fetch(`http://localhost:3000/api/flows/${createdFlow.id}`, {
      method: 'DELETE',
      headers: {
        'x-user-id': 'test-user-123'
      }
    });

    if (!deleteResponse.ok) {
      throw new Error(`Delete failed: ${deleteResponse.status} ${deleteResponse.statusText}`);
    }

    console.log('✅ Flow deleted successfully!');

    console.log('\n🎉 All MongoDB operations completed successfully!');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('Make sure the Next.js dev server is running (npm run dev)');
    process.exit(1);
  }
}

// Check if server is running first
fetch('http://localhost:3000/api/flows', { method: 'HEAD' })
  .then(() => testFlowWithMongoDB())
  .catch(() => {
    console.error('❌ Server is not running. Please run "npm run dev" first.');
    process.exit(1);
  });
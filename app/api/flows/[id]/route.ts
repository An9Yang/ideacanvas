import { NextRequest, NextResponse } from 'next/server';
import { azureStorageService } from '@/lib/services/azure-storage.service';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

/**
 * GET /api/flows/[id] - Get a specific flow
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // TODO: Get actual user ID from session/auth
    const userId = request.headers.get('x-user-id') || 'default-user';
    
    if (!azureStorageService.isAvailable()) {
      return NextResponse.json(
        { error: 'Azure Storage not configured' },
        { status: 503 }
      );
    }

    const flow = await azureStorageService.getFlow(userId, params.id);
    
    if (!flow) {
      return NextResponse.json(
        { error: 'Flow not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ flow });
  } catch (error) {
    console.error('Failed to get flow:', error);
    return NextResponse.json(
      { error: 'Failed to get flow' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/flows/[id] - Update a flow
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // TODO: Get actual user ID from session/auth
    const userId = request.headers.get('x-user-id') || 'default-user';
    
    if (!azureStorageService.isAvailable()) {
      return NextResponse.json(
        { error: 'Azure Storage not configured' },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { name, nodes, edges } = body;

    // Get existing flow
    const existingFlow = await azureStorageService.getFlow(userId, params.id);
    if (!existingFlow) {
      return NextResponse.json(
        { error: 'Flow not found' },
        { status: 404 }
      );
    }

    // Update flow
    const flow = await azureStorageService.saveFlow(userId, {
      ...existingFlow,
      name: name || existingFlow.name,
      nodes: nodes || existingFlow.nodes,
      edges: edges || existingFlow.edges,
    });
    
    return NextResponse.json({ flow });
  } catch (error) {
    console.error('Failed to update flow:', error);
    return NextResponse.json(
      { error: 'Failed to update flow' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/flows/[id] - Delete a flow
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // TODO: Get actual user ID from session/auth
    const userId = request.headers.get('x-user-id') || 'default-user';
    
    if (!azureStorageService.isAvailable()) {
      return NextResponse.json(
        { error: 'Azure Storage not configured' },
        { status: 503 }
      );
    }

    const deleted = await azureStorageService.deleteFlow(userId, params.id);
    
    if (!deleted) {
      return NextResponse.json(
        { error: 'Flow not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete flow:', error);
    return NextResponse.json(
      { error: 'Failed to delete flow' },
      { status: 500 }
    );
  }
}
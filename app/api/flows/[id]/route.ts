import { NextRequest, NextResponse } from 'next/server';
import { mongoDBStorageService } from '@/lib/services/mongodb-storage.service';

// GET /api/flows/[id] - Get a specific flow
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId') || 'default-user';
    const flowId = params.id;

    // Check if MongoDB is available
    const isAvailable = await mongoDBStorageService.isAvailable();
    if (!isAvailable) {
      return NextResponse.json(
        { error: 'MongoDB not configured' },
        { status: 503 }
      );
    }

    const flow = await mongoDBStorageService.getFlow(userId, flowId);
    
    if (!flow) {
      return NextResponse.json(
        { error: 'Flow not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(flow);
  } catch (error) {
    console.error('Failed to get flow:', error);
    return NextResponse.json(
      { error: 'Failed to get flow' },
      { status: 500 }
    );
  }
}

// PUT /api/flows/[id] - Update a flow
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const userId = body.userId || 'default-user';
    const flowId = params.id;

    // Check if MongoDB is available
    const isAvailable = await mongoDBStorageService.isAvailable();
    if (!isAvailable) {
      return NextResponse.json(
        { error: 'MongoDB not configured' },
        { status: 503 }
      );
    }

    const flow = await mongoDBStorageService.updateFlow(userId, flowId, body);
    
    if (!flow) {
      return NextResponse.json(
        { error: 'Flow not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(flow);
  } catch (error) {
    console.error('Failed to update flow:', error);
    return NextResponse.json(
      { error: 'Failed to update flow' },
      { status: 500 }
    );
  }
}

// DELETE /api/flows/[id] - Delete a flow
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId') || 'default-user';
    const flowId = params.id;

    // Check if MongoDB is available
    const isAvailable = await mongoDBStorageService.isAvailable();
    if (!isAvailable) {
      return NextResponse.json(
        { error: 'MongoDB not configured' },
        { status: 503 }
      );
    }

    const deleted = await mongoDBStorageService.deleteFlow(userId, flowId);
    
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
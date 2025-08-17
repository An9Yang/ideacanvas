import { NextRequest, NextResponse } from 'next/server';
import { mongoDBStorageService } from '@/lib/services/mongodb-storage.service';

// GET /api/flows - List all flows for a user
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId') || 'default-user';
    
    // Check if MongoDB is available
    const isAvailable = await mongoDBStorageService.isAvailable();
    if (!isAvailable) {
      return NextResponse.json(
        { flows: [], message: 'MongoDB not configured, using local storage only' },
        { status: 200 }
      );
    }

    const flows = await mongoDBStorageService.listFlows(userId);
    return NextResponse.json(flows);
  } catch (error) {
    console.error('Failed to list flows:', error);
    return NextResponse.json(
      { error: 'Failed to list flows', flows: [] },
      { status: 500 }
    );
  }
}

// POST /api/flows - Create a new flow
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const userId = body.userId || 'default-user';

    // Check if MongoDB is available
    const isAvailable = await mongoDBStorageService.isAvailable();
    if (!isAvailable) {
      // Return a local-only flow
      const localFlow = {
        id: `local-${Date.now()}`,
        userId,
        name: body.name || `Flow ${new Date().toLocaleDateString()}`,
        nodes: body.nodes || [],
        edges: body.edges || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      return NextResponse.json({ flow: localFlow });
    }

    const flow = await mongoDBStorageService.saveFlow(userId, body);
    return NextResponse.json(flow);
  } catch (error) {
    console.error('Failed to save flow:', error);
    return NextResponse.json(
      { error: 'Failed to save flow' },
      { status: 500 }
    );
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { azureStorageService } from '@/lib/services/azure-storage.service';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

/**
 * GET /api/flows - List all flows for current user
 */
export async function GET(request: NextRequest) {
  try {
    // TODO: Get actual user ID from session/auth
    const userId = request.headers.get('x-user-id') || 'default-user';
    
    if (!azureStorageService.isAvailable()) {
      // Fallback to returning empty list if Azure Storage not configured
      return NextResponse.json({ flows: [] });
    }

    const flows = await azureStorageService.listFlows(userId);
    
    return NextResponse.json({ flows });
  } catch (error) {
    console.error('Failed to list flows:', error);
    return NextResponse.json(
      { error: 'Failed to list flows' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/flows - Save a new flow
 */
export async function POST(request: NextRequest) {
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

    if (!nodes || !edges) {
      return NextResponse.json(
        { error: 'Missing nodes or edges' },
        { status: 400 }
      );
    }

    const flow = await azureStorageService.saveFlow(userId, {
      name,
      nodes,
      edges,
    });
    
    return NextResponse.json({ flow });
  } catch (error) {
    console.error('Failed to save flow:', error);
    return NextResponse.json(
      { error: 'Failed to save flow' },
      { status: 500 }
    );
  }
}
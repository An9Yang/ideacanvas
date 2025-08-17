import { NextResponse } from 'next/server';
import { mongoDBStorageService } from '@/lib/services/mongodb-storage.service';

// GET /api/flows/health - Health check endpoint
export async function GET() {
  try {
    const isAvailable = await mongoDBStorageService.isAvailable();
    return NextResponse.json({ 
      status: isAvailable ? 'healthy' : 'degraded',
      mongodb: isAvailable 
    });
  } catch (error) {
    console.error('Health check failed:', error);
    return NextResponse.json(
      { status: 'error', mongodb: false },
      { status: 500 }
    );
  }
}
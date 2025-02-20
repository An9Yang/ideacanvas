import { NextResponse } from 'next/server';
import { azureOpenAI } from '@/lib/config/azure-openai';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const preferredRegion = 'auto';

export async function GET() {
  try {
    // 测试 Azure OpenAI 连接
    const result = await azureOpenAI.testConnection();
    
    // 返回健康状态
    return NextResponse.json({
      status: 'healthy',
      azure_openai: result,
      timestamp: new Date().toISOString()
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '未知错误';
    return NextResponse.json({
      status: 'unhealthy',
      error: message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

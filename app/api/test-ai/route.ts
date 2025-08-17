import { NextRequest, NextResponse } from 'next/server';
import { aiService } from '@/lib/services/ai-service';

export async function GET(request: NextRequest) {
  console.log('[测试AI] 开始测试');
  
  try {
    const response = await aiService.generateCompletion({
      prompt: '说"Hello World"',
      maxTokens: 10
    });
    
    console.log('[测试AI] 成功，响应:', response);
    
    return NextResponse.json({ 
      success: true, 
      response,
      length: response.length 
    });
  } catch (error: any) {
    console.error('[测试AI] 失败:', error);
    
    return NextResponse.json({ 
      success: false, 
      error: error.message,
      details: error.response?.data || error
    }, { status: 500 });
  }
}
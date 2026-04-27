import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { executeCode } from '@/lib/executor';

export const POST = requireAuth(async (request: NextRequest, user) => {
  try {
    const body = await request.json();
    const { code, language, input } = body;

    if (!code || !language) {
      return NextResponse.json({ error: 'Code and language are required' }, { status: 400 });
    }

    const result = await executeCode(code, language, input || '');

    return NextResponse.json({
      stdout: result.output || '',
      time: result.cpuTime || '0',
      memory: result.memory || 0,
    }, { status: 200 });

  } catch (error: any) {
    console.error('Execution error:', error);
    return NextResponse.json({ error: 'Code execution failed' }, { status: 500 });
  }
});

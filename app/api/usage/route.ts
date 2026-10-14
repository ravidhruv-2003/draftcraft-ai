import { NextResponse } from 'next/server';
import { getUsageAnalytics } from '@/lib/supabase';

export async function GET() {
  try {
    const stats = await getUsageAnalytics();
    return NextResponse.json(stats);
  } catch (err: unknown) {
    console.error('Error in /api/usage:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to fetch usage analytics' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { recordUsageLog } = await import('@/lib/supabase');
    const log = await recordUsageLog(body);
    return NextResponse.json({ success: true, log });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to record usage' },
      { status: 500 }
    );
  }
}

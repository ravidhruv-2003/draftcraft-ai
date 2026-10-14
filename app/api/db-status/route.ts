import { NextRequest, NextResponse } from 'next/server';
import { checkSupabaseConnection, isSupabaseConfigured } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  try {
    const urlParam = req.nextUrl.searchParams.get('url') || req.headers.get('x-supabase-url') || undefined;
    const keyParam = req.nextUrl.searchParams.get('key') || req.headers.get('x-supabase-key') || undefined;
    const status = await checkSupabaseConnection(urlParam, keyParam);
    return NextResponse.json({
      configured: isSupabaseConfigured || status.connected,
      ...status,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      {
        configured: false,
        connected: false,
        draftsCount: 0,
        logsCount: 0,
        message: err instanceof Error ? err.message : 'Connection check failed',
      },
      { status: 500 }
    );
  }
}

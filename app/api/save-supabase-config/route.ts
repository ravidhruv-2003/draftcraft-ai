import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(req: NextRequest) {
  try {
    const { url, key } = await req.json();
    if (!url || !key) {
      return NextResponse.json({ success: false, message: 'URL and Key are required' }, { status: 400 });
    }

    const envPath = path.join(process.cwd(), '.env.local');
    let envContent = '';
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
    }

    // Update or append NEXT_PUBLIC_SUPABASE_URL
    if (envContent.includes('NEXT_PUBLIC_SUPABASE_URL=')) {
      envContent = envContent.replace(/NEXT_PUBLIC_SUPABASE_URL=.*/g, `NEXT_PUBLIC_SUPABASE_URL=${url}`);
    } else {
      envContent += `\nNEXT_PUBLIC_SUPABASE_URL=${url}`;
    }

    // Update or append NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (envContent.includes('NEXT_PUBLIC_SUPABASE_ANON_KEY=')) {
      envContent = envContent.replace(/NEXT_PUBLIC_SUPABASE_ANON_KEY=.*/g, `NEXT_PUBLIC_SUPABASE_ANON_KEY=${key}`);
    } else {
      envContent += `\nNEXT_PUBLIC_SUPABASE_ANON_KEY=${key}`;
    }

    fs.writeFileSync(envPath, envContent.trim() + '\n', 'utf8');

    return NextResponse.json({ success: true, message: 'Supabase configuration saved to environment' });
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, message: err instanceof Error ? err.message : 'Failed to save configuration' },
      { status: 500 }
    );
  }
}

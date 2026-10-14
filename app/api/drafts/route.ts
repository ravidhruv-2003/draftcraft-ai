import { NextRequest, NextResponse } from 'next/server';
import { fetchDrafts, saveDraftItem, removeDraft } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  try {
    const drafts = await fetchDrafts();
    return NextResponse.json({ drafts });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to retrieve drafts' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.content) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    const saved = await saveDraftItem(body);
    return NextResponse.json({ draft: saved });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to save draft' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Draft ID is required' }, { status: 400 });
    }

    await removeDraft(id);
    return NextResponse.json({ success: true, id });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to delete draft' },
      { status: 500 }
    );
  }
}

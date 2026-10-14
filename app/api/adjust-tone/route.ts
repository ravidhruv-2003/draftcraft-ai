import { NextRequest, NextResponse } from 'next/server';
import { runAIGeneration } from '@/lib/ai-agent';
import { optimizePromptAndContext } from '@/lib/optimizer';
import { calculateCost } from '@/lib/pricing';
import { recordUsageLog } from '@/lib/supabase';
import { TonePreset } from '@/types/draft';

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  try {
    const body = await req.json();
    const { currentContent, targetPreset, action, model = 'claude-haiku-4-5-20251001', apiKey } = body;
    const clientApiKey = req.headers.get('x-anthropic-key') || apiKey || '';

    if (!currentContent) {
      return NextResponse.json({ error: 'Current content is required' }, { status: 400 });
    }

    let instruction = '';
    if (action === 'shorten') {
      instruction = 'Rewrite the following text to be ultra-concise, removing fluff while preserving all core facts and call-to-actions.';
    } else if (action === 'executive') {
      instruction = 'Rewrite the following text to sound authoritative, executive-level, highly polished, and decisive.';
    } else if (action === 'friendly') {
      instruction = 'Rewrite the following text to sound warm, empathetic, collaborative, and approachable.';
    } else if (action === 'add-cta') {
      instruction = 'Strengthen the closing of the following text with a clear, compelling call-to-action and clear next steps.';
    } else {
      instruction = `Re-tone the following text to match a ${targetPreset || 'professional'} tone.`;
    }

    const { optimizedPrompt, metrics } = optimizePromptAndContext(instruction, currentContent);

    const result = await runAIGeneration({
      prompt: `${optimizedPrompt}\n\nOriginal Text:\n"""\n${currentContent}\n"""`,
      draftType: 'email',
      toneSettings: {
        preset: (targetPreset as TonePreset) || 'formal',
        formality: targetPreset === 'executive' ? 5 : 4,
        length: action === 'shorten' ? 'concise' : 'balanced',
        directness: targetPreset === 'assertive' ? 4 : 3,
      },
      model,
      apiKey: clientApiKey,
    });

    const latencyMs = Date.now() - startTime;
    const costUsd = calculateCost(result.modelUsed, result.inputTokens, result.outputTokens);

    await recordUsageLog({
      model: result.modelUsed,
      draftType: `tone_${action || targetPreset}`,
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens,
      totalTokens: result.inputTokens + result.outputTokens,
      rawTokensBeforeOpt: metrics.rawTokensEstimate,
      tokensSaved: metrics.tokensSaved,
      efficiencyPercentage: metrics.efficiencyPercentage,
      costUsd,
      latencyMs,
      prompt: `${instruction}\n\n[Source Draft Snippet]:\n${currentContent.slice(0, 300)}${currentContent.length > 300 ? '...' : ''}`,
      resultContent: result.content,
      subjectLine: result.subjectLine,
    });

    return NextResponse.json({
      content: result.content,
      subjectLine: result.subjectLine,
      tokensUsed: result.inputTokens + result.outputTokens,
    });
  } catch (err: unknown) {
    console.error('Error in /api/adjust-tone:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Tone adjustment failed' },
      { status: 500 }
    );
  }
}

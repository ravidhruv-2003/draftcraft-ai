import { NextRequest, NextResponse } from 'next/server';
import { runAIRefine } from '@/lib/refine-agent';
import { calculateCost } from '@/lib/pricing';
import { recordUsageLog } from '@/lib/supabase';
import { estimateTokens } from '@/lib/optimizer';

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  try {
    const body = await req.json();
    const {
      currentContent,
      currentSubject = '',
      targetPreset = 'formal',
      action = 'shorten',
      customInstruction = '',
      model = 'claude-haiku-4-5-20251001',
      apiKey,
    } = body;
    const clientApiKey = req.headers.get('x-anthropic-key') || apiKey || '';

    if (!currentContent || !currentContent.trim()) {
      return NextResponse.json({ error: 'Current draft content is required to perform quick refinement' }, { status: 400 });
    }

    const result = await runAIRefine({
      currentContent,
      currentSubject,
      action,
      customInstruction,
      targetPreset,
      model,
      apiKey: clientApiKey,
    });

    const latencyMs = Date.now() - startTime;
    const costUsd = calculateCost(result.modelUsed, result.inputTokens, result.outputTokens);

    const rawEstimated = estimateTokens(currentContent);
    const tokensSaved = Math.max(0, rawEstimated - result.outputTokens);
    const efficiencyPercentage = rawEstimated > 0 ? Number(((tokensSaved / rawEstimated) * 100).toFixed(1)) : 0;

    const usageRecord = await recordUsageLog({
      model: result.modelUsed,
      draftType: `tone_${action}`,
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens,
      totalTokens: result.inputTokens + result.outputTokens,
      rawTokensBeforeOpt: rawEstimated,
      tokensSaved,
      efficiencyPercentage,
      costUsd,
      latencyMs,
      prompt: `Quick Refinement [${action}]:\n${currentContent.slice(0, 300)}${currentContent.length > 300 ? '...' : ''}`,
      resultContent: result.content,
      subjectLine: result.subjectLine,
    });

    return NextResponse.json({
      content: result.content,
      subjectLine: result.subjectLine,
      tokensUsed: result.inputTokens + result.outputTokens,
      usageRecord,
    });
  } catch (err: unknown) {
    console.error('Error in /api/adjust-tone:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Tone adjustment failed' },
      { status: 500 }
    );
  }
}

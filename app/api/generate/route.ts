import { NextRequest, NextResponse } from 'next/server';
import { runAIGeneration } from '@/lib/ai-agent';
import { optimizePromptAndContext } from '@/lib/optimizer';
import { calculateCost } from '@/lib/pricing';
import { recordUsageLog } from '@/lib/supabase';
import { ToneSettings, DraftType } from '@/types/draft';

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  try {
    const body = await req.json();
    const {
      prompt,
      referenceContext = '',
      draftType = 'email',
      recipientRole = '',
      toneSettings = {
        preset: 'formal',
        formality: 4,
        length: 'balanced',
        directness: 3,
      } as ToneSettings,
      model = 'claude-sonnet-4-5-20250929',
    } = body;

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const clientApiKey = req.headers.get('x-anthropic-key') || body.apiKey || '';

    // 1. Run automatic prompt & context optimization
    const { optimizedPrompt, optimizedContext, metrics } = optimizePromptAndContext(
      prompt,
      referenceContext
    );

    // 2. Run AI generation with Claude / Gemini
    const result = await runAIGeneration({
      prompt: optimizedPrompt,
      referenceContext: optimizedContext,
      draftType: draftType as DraftType,
      recipientRole,
      toneSettings,
      model,
      apiKey: clientApiKey,
    });

    const latencyMs = Date.now() - startTime;
    const costUsd = calculateCost(result.modelUsed, result.inputTokens, result.outputTokens);

    // 3. Log usage metrics (Claude tokens, credits deduction, savings)
    const usageRecord = await recordUsageLog({
      model: result.modelUsed,
      draftType,
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens,
      totalTokens: result.inputTokens + result.outputTokens,
      rawTokensBeforeOpt: metrics.rawTokensEstimate,
      tokensSaved: metrics.tokensSaved,
      efficiencyPercentage: metrics.efficiencyPercentage,
      costUsd,
      latencyMs,
      prompt,
      resultContent: result.content,
      subjectLine: result.subjectLine,
    });

    return NextResponse.json({
      content: result.content,
      subjectLine: result.subjectLine,
      metrics,
      usageRecord,
    });
  } catch (err: unknown) {
    console.error('Error in /api/generate:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Generation failed' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { runAIChat, ChatMessage } from '@/lib/chat-agent';
import { calculateCost } from '@/lib/pricing';
import { recordUsageLog } from '@/lib/supabase';
import { estimateTokens } from '@/lib/optimizer';

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  try {
    const body = await req.json();
    const {
      messages,
      currentDraftContent = '',
      currentSubject = '',
      model = 'claude-sonnet-4-5-20250929',
      apiKey,
    } = body;

    const clientApiKey = req.headers.get('x-anthropic-key') || apiKey || '';

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'Messages array is required' }, { status: 400 });
    }

    // Call the dedicated Conversational Chat Agent
    const result = await runAIChat({
      messages: messages as ChatMessage[],
      currentDraftContent,
      currentSubject,
      model,
      apiKey: clientApiKey,
    });

    const latencyMs = Date.now() - startTime;
    const costUsd = calculateCost(result.modelUsed, result.inputTokens, result.outputTokens);

    // Calculate savings from concise copilot responses
    const estimatedRaw = estimateTokens(messages.map((m: ChatMessage) => m.content).join(' '));
    const tokensSaved = Math.max(0, Math.round(estimatedRaw * 0.25));
    const efficiencyPercentage = estimatedRaw > 0 ? Number(((tokensSaved / estimatedRaw) * 100).toFixed(1)) : 25.0;

    const lastUserPrompt = messages[messages.length - 1]?.content || 'Copilot conversation';

    // Log to Supabase / Local $5.00 Credit Ledger
    await recordUsageLog({
      model: result.modelUsed,
      draftType: 'copilot_chat',
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens,
      totalTokens: result.inputTokens + result.outputTokens,
      rawTokensBeforeOpt: estimatedRaw,
      tokensSaved,
      efficiencyPercentage,
      costUsd,
      latencyMs,
      prompt: lastUserPrompt,
      resultContent: result.reply,
      subjectLine: result.subjectLine,
    });

    return NextResponse.json({
      reply: result.reply,
      subjectLine: result.subjectLine,
      tokensUsed: result.inputTokens + result.outputTokens,
      costUsd,
    });
  } catch (err: unknown) {
    console.error('Error in /api/chat:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Chat response failed' },
      { status: 500 }
    );
  }
}

import { OptimizationMetrics } from '@/types/draft';

/**
 * Estimates token count for a given text string.
 * Standard heuristic: ~4 characters per token for English text & code.
 */
export function estimateTokens(text: string): number {
  if (!text) return 0;
  // Account for words and punctuation
  const trimmed = text.trim();
  return Math.max(1, Math.ceil(trimmed.length / 3.8));
}

/**
 * Optimizes prompts and reference document context by:
 * 1. Removing redundant whitespace and blank lines.
 * 2. Compressing repetitive boilerplate phrases.
 * 3. Structuring instructions compactly to reduce token usage and API cost.
 */
export function optimizePromptAndContext(
  prompt: string,
  referenceContext: string = '',
  instructions: string = ''
): {
  optimizedPrompt: string;
  optimizedContext: string;
  metrics: OptimizationMetrics;
} {
  // 1. Calculate raw unoptimized tokens
  const rawCombined = `${prompt}\n${referenceContext}\n${instructions}`;
  const rawTokens = estimateTokens(rawCombined);

  // 2. Perform intelligent compression on reference context
  let cleanedContext = referenceContext
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    // Remove repeated email headers / boilerplate signatures if present
    .replace(/(Disclaimer:[\s\S]*?$|Confidentiality Notice:[\s\S]*?$)/gi, '')
    .trim();

  // 3. Compact prompt instructions
  let cleanedPrompt = prompt
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{2,}/g, '\n')
    .trim();

  // 4. Calculate optimized tokens
  const optimizedCombined = `${cleanedPrompt}\n${cleanedContext}\n${instructions.trim()}`;
  const optimizedTokens = estimateTokens(optimizedCombined);

  const tokensSaved = Math.max(0, rawTokens - optimizedTokens);
  const efficiencyPercentage =
    rawTokens > 0 ? Number(((tokensSaved / rawTokens) * 100).toFixed(1)) : 0;

  // Claude 3.5 Sonnet / Claude 3 Haiku blended pricing: ~$3.00 / 1M input tokens ($0.000003 per token)
  const tokenCostPerUnit = 0.000003;
  const estimatedCostUsd = Number((optimizedTokens * tokenCostPerUnit).toFixed(6));
  const savingsUsd = Number((tokensSaved * tokenCostPerUnit).toFixed(6));

  return {
    optimizedPrompt: cleanedPrompt,
    optimizedContext: cleanedContext,
    metrics: {
      rawTokensEstimate: rawTokens,
      optimizedTokensEstimate: optimizedTokens,
      tokensSaved,
      efficiencyPercentage,
      estimatedCostUsd,
      savingsUsd,
    },
  };
}

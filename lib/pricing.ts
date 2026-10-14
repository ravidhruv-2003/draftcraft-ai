export interface ModelRate {
  name: string;
  inputPerMillion: number;
  outputPerMillion: number;
}

export const MODEL_PRICING: Record<string, ModelRate> = {
  'claude-sonnet-4-5-20250929': {
    name: 'Claude Sonnet 4.5',
    inputPerMillion: 3.0,
    outputPerMillion: 15.0,
  },
  'claude-haiku-4-5-20251001': {
    name: 'Claude Haiku 4.5 (Fast)',
    inputPerMillion: 0.25,
    outputPerMillion: 1.25,
  },
  'claude-sonnet-4-6': {
    name: 'Claude Sonnet 4.6',
    inputPerMillion: 3.0,
    outputPerMillion: 15.0,
  },
  'claude-opus-4-6': {
    name: 'Claude Opus 4.6',
    inputPerMillion: 15.0,
    outputPerMillion: 75.0,
  },
  'claude-3-5-sonnet-20241022': {
    name: 'Claude 3.5 Sonnet (Legacy)',
    inputPerMillion: 3.0,
    outputPerMillion: 15.0,
  },
  'claude-3-haiku-20240307': {
    name: 'Claude 3 Haiku (Legacy)',
    inputPerMillion: 0.25,
    outputPerMillion: 1.25,
  },
  'gemini-1.5-flash': {
    name: 'Gemini 1.5 Flash',
    inputPerMillion: 0.075,
    outputPerMillion: 0.3,
  },
};

export const INITIAL_SUBSCRIPTION_CREDIT = 5.0; // $5.00 starting subscription

/**
 * Maps any requested model identifier to an active, validated Anthropic model.
 * Resolves retired/legacy model IDs (like claude-3-5-sonnet-20241022) to currently active models.
 */
export function resolveClaudeModel(modelName?: string): string {
  if (!modelName) return 'claude-sonnet-4-5-20250929';
  const m = modelName.toLowerCase();
  if (m.includes('haiku')) return 'claude-haiku-4-5-20251001';
  if (m.includes('opus')) return 'claude-opus-4-6';
  if (m.includes('sonnet-4-6')) return 'claude-sonnet-4-6';
  if (m.includes('sonnet')) return 'claude-sonnet-4-5-20250929';
  if (MODEL_PRICING[modelName]) return modelName;
  return 'claude-sonnet-4-5-20250929';
}

/**
 * Calculates exact API cost in USD based on model rates
 */
export function calculateCost(
  model: string,
  inputTokens: number,
  outputTokens: number
): number {
  const resolved = resolveClaudeModel(model);
  const rate = MODEL_PRICING[resolved] || MODEL_PRICING[model] || MODEL_PRICING['claude-sonnet-4-5-20250929'];
  const inputCost = (inputTokens / 1_000_000) * rate.inputPerMillion;
  const outputCost = (outputTokens / 1_000_000) * rate.outputPerMillion;
  return Number((inputCost + outputCost).toFixed(6));
}

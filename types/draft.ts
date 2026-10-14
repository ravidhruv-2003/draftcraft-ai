export type DraftType = 'email' | 'formal_letter' | 'cover_letter' | 'follow_up' | 'apology' | 'outreach';

export type TonePreset = 'formal' | 'friendly' | 'assertive' | 'persuasive' | 'urgent' | 'empathetic' | 'executive';

export interface ToneSettings {
  preset: TonePreset;
  formality: number; // 1 to 5
  length: 'concise' | 'balanced' | 'detailed';
  directness: number; // 1 to 5
}

export interface OptimizationMetrics {
  rawTokensEstimate: number;
  optimizedTokensEstimate: number;
  tokensSaved: number;
  efficiencyPercentage: number;
  estimatedCostUsd: number;
  savingsUsd: number;
}

export interface UsageRecord {
  id: string;
  timestamp: string;
  model: string;
  draftType: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  rawTokensBeforeOpt: number;
  tokensSaved: number;
  efficiencyPercentage: number;
  costUsd: number;
  latencyMs: number;
  prompt?: string;
  resultContent?: string;
  subjectLine?: string;
}

export interface DraftItem {
  id: string;
  createdAt: string;
  updatedAt: string;
  title: string;
  draftType: DraftType;
  subjectLine?: string;
  content: string;
  recipientRole?: string;
  toneSettings: ToneSettings;
  referenceSummary?: string;
  isFavorite?: boolean;
}

export interface TemplateItem {
  id: string;
  title: string;
  category: 'Job Search' | 'Workplace' | 'Client Outreach' | 'Formal / Legal' | 'Personal';
  description: string;
  draftType: DraftType;
  samplePrompt: string;
  defaultTone: TonePreset;
  recipientRole: string;
}

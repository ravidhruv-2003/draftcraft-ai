import { DraftType, ToneSettings, UsageRecord, OptimizationMetrics } from '@/types/draft';

export interface GenerateResponse {
  content: string;
  subjectLine?: string;
  metrics: OptimizationMetrics;
  usageRecord: UsageRecord;
}

export interface AdjustToneResponse {
  content: string;
  subjectLine?: string;
  tokensUsed: number;
  usageRecord?: UsageRecord;
}

export interface UsageAnalyticsResponse {
  logs: UsageRecord[];
  totalTokens: number;
  totalCostUsd: number;
  remainingCreditsUsd: number;
  totalTokensSaved: number;
  overallEfficiencyPercentage: number;
}

/**
 * Retrieves client-side private API key if stored in localStorage
 */
function getClientApiKey(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('user_anthropic_api_key') || '';
}

/**
 * Validates network connectivity before issuing external API requests
 */
function checkNetworkOnline(): void {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    throw new Error('System is offline: Please verify your internet connection to reach Claude AI.');
  }
}

/**
 * Centralized API Service for drafting, tone adjustment, and analytics
 */
export const apiService = {
  /**
   * Generates a new email or letter draft
   */
  async generateDraft(params: {
    prompt: string;
    referenceContext?: string;
    draftType: DraftType;
    recipientRole?: string;
    toneSettings: ToneSettings;
    model: string;
  }): Promise<GenerateResponse> {
    checkNetworkOnline();
    const apiKey = getClientApiKey();

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(apiKey ? { 'x-anthropic-key': apiKey } : {}),
        },
        body: JSON.stringify(params),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate draft');
      }
      return data;
    } catch (err: unknown) {
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        throw new Error('System is offline: Please verify your internet connection to reach Claude AI.');
      }
      if (err instanceof TypeError && err.message.toLowerCase().includes('fetch')) {
        throw new Error('Network error: Unable to connect to the server. Please check your internet connection.');
      }
      throw err;
    }
  },

  /**
   * Re-tones or refines an existing draft
   */
  async adjustTone(params: {
    currentContent: string;
    currentSubject?: string;
    targetPreset?: string;
    action: 'shorten' | 'executive' | 'friendly' | 'add-cta' | 'grammar' | 'bullets' | 'custom' | 're-tone';
    customInstruction?: string;
    model?: string;
  }): Promise<AdjustToneResponse> {
    checkNetworkOnline();
    const apiKey = getClientApiKey();

    try {
      const response = await fetch('/api/adjust-tone', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(apiKey ? { 'x-anthropic-key': apiKey } : {}),
        },
        body: JSON.stringify(params),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to adjust tone');
      }
      return data;
    } catch (err: unknown) {
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        throw new Error('System is offline: Please verify your internet connection.');
      }
      if (err instanceof TypeError && err.message.toLowerCase().includes('fetch')) {
        throw new Error('Network error: Unable to connect to the server. Please check your internet connection.');
      }
      throw err;
    }
  },

  /**
   * Fetches latest token usage and credit analytics
   */
  async fetchUsageAnalytics(): Promise<UsageAnalyticsResponse> {
    try {
      const response = await fetch('/api/usage');
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch analytics');
      }
      return data;
    } catch (err: unknown) {
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        throw new Error('System is offline: Cannot sync cloud analytics.');
      }
      throw err;
    }
  },

  /**
   * Sends conversational message to AI Copilot
   */
  async sendChatMessage(params: {
    messages: { role: 'user' | 'assistant'; content: string }[];
    currentDraftContent?: string;
    currentSubject?: string;
    model?: string;
  }): Promise<{ reply: string; subjectLine?: string; tokensUsed: number; costUsd: number }> {
    checkNetworkOnline();
    const apiKey = getClientApiKey();

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(apiKey ? { 'x-anthropic-key': apiKey } : {}),
        },
        body: JSON.stringify(params),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Chat request failed');
      }
      return data;
    } catch (err: unknown) {
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        throw new Error('System is offline: Please verify your internet connection to chat with Copilot.');
      }
      if (err instanceof TypeError && err.message.toLowerCase().includes('fetch')) {
        throw new Error('Network error: Unable to reach AI Copilot. Please check your internet connection.');
      }
      throw err;
    }
  },

  /**
   * Fetches saved drafts from backend / Supabase
   */
  async fetchDrafts() {
    try {
      const response = await fetch('/api/drafts');
      const data = await response.json();
      return data.drafts || [];
    } catch {
      return [];
    }
  },

  /**
   * Saves a draft to backend / Supabase
   */
  async saveDraft(draft: unknown) {
    try {
      const response = await fetch('/api/drafts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draft),
      });
      const data = await response.json();
      return data.draft || null;
    } catch {
      return null;
    }
  },

  /**
   * Deletes a draft from backend / Supabase
   */
  async deleteDraft(id: string) {
    try {
      const response = await fetch(`/api/drafts?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      return response.ok;
    } catch {
      return false;
    }
  },
};

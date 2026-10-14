import { createClient } from '@supabase/supabase-js';
import { DraftItem, UsageRecord } from '@/types/draft';
import { INITIAL_SUBSCRIPTION_CREDIT } from './pricing';

const envSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const envSupabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  envSupabaseUrl && envSupabaseAnonKey && envSupabaseUrl.startsWith('http')
);

export function getSupabaseCredentials(): { url: string; key: string } {
  if (typeof window !== 'undefined') {
    const localUrl = localStorage.getItem('user_supabase_url') || '';
    const localKey = localStorage.getItem('user_supabase_anon_key') || '';
    return {
      url: localUrl || envSupabaseUrl,
      key: localKey || envSupabaseAnonKey,
    };
  }
  return { url: envSupabaseUrl, key: envSupabaseAnonKey };
}

export function getSupabaseClient() {
  const { url, key } = getSupabaseCredentials();
  if (url && key && url.startsWith('http')) {
    return createClient(url, key);
  }
  return null;
}

export const supabase = getSupabaseClient();

/**
 * Checks live connection health to Supabase Cloud PostgreSQL
 */
export async function checkSupabaseConnection(customUrl?: string, customKey?: string): Promise<{
  connected: boolean;
  draftsCount: number;
  logsCount: number;
  message: string;
}> {
  let client = getSupabaseClient();
  if (customUrl && customKey && customUrl.startsWith('http')) {
    client = createClient(customUrl, customKey);
  }

  if (!client) {
    return {
      connected: false,
      draftsCount: 0,
      logsCount: 0,
      message: 'Supabase URL and Anon Key are not configured yet.',
    };
  }

  try {
    const [draftsRes, logsRes] = await Promise.all([
      client.from('drafts').select('id', { count: 'exact', head: true }),
      client.from('usage_logs').select('id', { count: 'exact', head: true }),
    ]);

    if (draftsRes.error) {
      return {
        connected: false,
        draftsCount: 0,
        logsCount: 0,
        message: `Connected to Supabase, but "drafts" table was not found: ${draftsRes.error.message}. Please run supabase/schema.sql in your Supabase SQL Editor.`,
      };
    }

    return {
      connected: true,
      draftsCount: draftsRes.count ?? 0,
      logsCount: logsRes.count ?? 0,
      message: 'Successfully connected to Supabase Cloud PostgreSQL! Tables are active and ready.',
    };
  } catch (err) {
    return {
      connected: false,
      draftsCount: 0,
      logsCount: 0,
      message: err instanceof Error ? err.message : 'Failed to reach Supabase server.',
    };
  }
}

// Local storage fallback keys
const LOCAL_DRAFTS_KEY = 'ai_assistant_drafts';
const LOCAL_USAGE_KEY = 'ai_assistant_usage_logs';

// In-memory fallback for server runtime (when window is undefined and Supabase is optional)
const serverState = globalThis as unknown as {
  __draftcraft_serverUsageLogs?: UsageRecord[];
  __draftcraft_serverDrafts?: DraftItem[];
};
if (!serverState.__draftcraft_serverUsageLogs) {
  serverState.__draftcraft_serverUsageLogs = [];
}
if (!serverState.__draftcraft_serverDrafts) {
  serverState.__draftcraft_serverDrafts = [];
}

/**
 * Save draft to Supabase or fallback to localStorage
 */
export async function saveDraftItem(draft: Omit<DraftItem, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<DraftItem> {
  const now = new Date().toISOString();
  const fullDraft: DraftItem = {
    ...draft,
    id: draft.id || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `draft_${Date.now()}`),
    createdAt: now,
    updatedAt: now,
  };

  const client = getSupabaseClient();
  if (client) {
    try {
      const { data, error } = await client
        .from('drafts')
        .upsert({
          id: fullDraft.id,
          title: fullDraft.title,
          draft_type: fullDraft.draftType,
          subject_line: fullDraft.subjectLine,
          content: fullDraft.content,
          recipient_role: fullDraft.recipientRole,
          tone_settings: fullDraft.toneSettings,
          reference_summary: fullDraft.referenceSummary,
          updated_at: now,
        })
        .select()
        .single();

      if (!error && data) {
        return {
          id: data.id,
          title: data.title,
          draftType: data.draft_type,
          subjectLine: data.subject_line,
          content: data.content,
          recipientRole: data.recipient_role,
          toneSettings: data.tone_settings,
          referenceSummary: data.reference_summary,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        };
      }
    } catch (err) {
      console.warn('Supabase save failed, falling back to local storage:', err);
    }
  }

  if (serverState.__draftcraft_serverDrafts) {
    serverState.__draftcraft_serverDrafts = [
      fullDraft,
      ...serverState.__draftcraft_serverDrafts.filter((d) => d.id !== fullDraft.id),
    ];
  }

  // Local storage fallback
  if (typeof window !== 'undefined') {
    const existing = getLocalDrafts();
    const updated = [fullDraft, ...existing.filter((d) => d.id !== fullDraft.id)];
    localStorage.setItem(LOCAL_DRAFTS_KEY, JSON.stringify(updated));
  }
  return fullDraft;
}

/**
 * Retrieve saved drafts
 */
export async function fetchDrafts(): Promise<DraftItem[]> {
  const client = getSupabaseClient();
  if (client) {
    try {
      const { data, error } = await client
        .from('drafts')
        .select('*')
        .order('updated_at', { ascending: false });

      if (!error && data && data.length > 0) {
        return data.map((d) => ({
          id: d.id,
          title: d.title,
          draftType: d.draft_type,
          subjectLine: d.subject_line,
          content: d.content,
          recipientRole: d.recipient_role,
          toneSettings: d.tone_settings,
          referenceSummary: d.reference_summary,
          createdAt: d.created_at,
          updatedAt: d.updated_at,
        }));
      }
    } catch (err) {
      console.warn('Supabase fetch failed, falling back to local storage:', err);
    }
  }

  const clientDrafts = getLocalDrafts();
  const serverDrafts = serverState.__draftcraft_serverDrafts || [];
  return clientDrafts.length > 0 ? clientDrafts : serverDrafts;
}

/**
 * Delete a draft
 */
export async function removeDraft(id: string): Promise<boolean> {
  const client = getSupabaseClient();
  if (client) {
    try {
      await client.from('drafts').delete().eq('id', id);
    } catch (err) {
      console.warn('Supabase delete error:', err);
    }
  }

  if (typeof window !== 'undefined') {
    const drafts = getLocalDrafts().filter((d) => d.id !== id);
    localStorage.setItem(LOCAL_DRAFTS_KEY, JSON.stringify(drafts));
  }
  return true;
}

/**
 * Log token usage and cost
 */
export async function recordUsageLog(record: Omit<UsageRecord, 'id' | 'timestamp'>): Promise<UsageRecord> {
  const fullRecord: UsageRecord = {
    ...record,
    id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `log_${Date.now()}`,
    timestamp: new Date().toISOString(),
  };

  const client = getSupabaseClient();
  if (client) {
    try {
      await client.from('usage_logs').insert([
        {
          id: fullRecord.id,
          model: fullRecord.model,
          draft_type: fullRecord.draftType,
          input_tokens: fullRecord.inputTokens,
          output_tokens: fullRecord.outputTokens,
          total_tokens: fullRecord.totalTokens,
          raw_tokens_before_opt: fullRecord.rawTokensBeforeOpt,
          tokens_saved: fullRecord.tokensSaved,
          efficiency_percentage: fullRecord.efficiencyPercentage,
          cost_usd: fullRecord.costUsd,
          latency_ms: fullRecord.latencyMs,
          prompt: fullRecord.prompt,
          result_content: fullRecord.resultContent,
          subject_line: fullRecord.subjectLine,
        },
      ]);
    } catch (err) {
      console.warn('Failed to insert log to Supabase, logging locally:', err);
    }
  }

  if (serverState.__draftcraft_serverUsageLogs) {
    serverState.__draftcraft_serverUsageLogs.unshift(fullRecord);
    if (serverState.__draftcraft_serverUsageLogs.length > 100) {
      serverState.__draftcraft_serverUsageLogs.pop();
    }
  }

  if (typeof window !== 'undefined') {
    const logs = getLocalUsageLogs();
    logs.unshift(fullRecord);
    localStorage.setItem(LOCAL_USAGE_KEY, JSON.stringify(logs.slice(0, 100)));
  }

  return fullRecord;
}

/**
 * Fetch usage logs and aggregated stats
 */
export async function getUsageAnalytics(): Promise<{
  logs: UsageRecord[];
  totalTokens: number;
  totalCostUsd: number;
  remainingCreditsUsd: number;
  totalTokensSaved: number;
  overallEfficiencyPercentage: number;
}> {
  let logs: UsageRecord[] = [];

  const client = getSupabaseClient();
  if (client) {
    try {
      const { data, error } = await client
        .from('usage_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (!error && data && data.length > 0) {
        logs = data.map((l) => ({
          id: l.id,
          timestamp: l.created_at,
          model: l.model,
          draftType: l.draft_type,
          inputTokens: l.input_tokens,
          outputTokens: l.output_tokens,
          totalTokens: l.total_tokens,
          rawTokensBeforeOpt: l.raw_tokens_before_opt,
          tokensSaved: l.tokens_saved,
          efficiencyPercentage: Number(l.efficiency_percentage || 0),
          costUsd: Number(l.cost_usd || 0),
          latencyMs: l.latency_ms,
          prompt: l.prompt,
          resultContent: l.result_content || l.resultContent,
          subjectLine: l.subject_line || l.subjectLine,
        }));
      }
    } catch (err) {
      console.warn('Error reading logs from Supabase:', err);
    }
  }

  if (logs.length === 0) {
    const clientLogs = getLocalUsageLogs();
    const serverLogs = serverState.__draftcraft_serverUsageLogs || [];
    logs = clientLogs.length > 0 ? clientLogs : serverLogs;
  }

  const totalTokens = logs.reduce((acc, curr) => acc + curr.totalTokens, 0);
  const totalCostUsd = logs.reduce((acc, curr) => acc + curr.costUsd, 0);
  const totalTokensSaved = logs.reduce((acc, curr) => acc + curr.tokensSaved, 0);
  const rawSum = logs.reduce((acc, curr) => acc + (curr.rawTokensBeforeOpt || curr.totalTokens), 0);

  const overallEfficiencyPercentage =
    rawSum > 0 ? Number(((totalTokensSaved / rawSum) * 100).toFixed(1)) : 0;

  const remainingCreditsUsd = Math.max(
    0,
    Number((INITIAL_SUBSCRIPTION_CREDIT - totalCostUsd).toFixed(4))
  );

  return {
    logs,
    totalTokens,
    totalCostUsd: Number(totalCostUsd.toFixed(4)),
    remainingCreditsUsd,
    totalTokensSaved,
    overallEfficiencyPercentage,
  };
}

// Local storage helper
function getLocalDrafts(): DraftItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_DRAFTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function getLocalUsageLogs(): UsageRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_USAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

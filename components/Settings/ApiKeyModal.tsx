'use client';

import React, { useState, useEffect } from 'react';
import {
  KeyRound,
  ShieldCheck,
  Eye,
  EyeOff,
  Save,
  Trash2,
  X,
  Database,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveKey: (key: string) => void;
}

export const LOCAL_STORAGE_API_KEY = 'user_anthropic_api_key';
export const LOCAL_STORAGE_SUPABASE_URL = 'user_supabase_url';
export const LOCAL_STORAGE_SUPABASE_KEY = 'user_supabase_anon_key';

const SUPABASE_SCHEMA_SQL = `-- DraftCraft AI - Supabase PostgreSQL Schema
CREATE TABLE IF NOT EXISTS public.drafts (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  draft_type TEXT NOT NULL,
  subject_line TEXT,
  content TEXT NOT NULL,
  recipient_role TEXT,
  tone_settings JSONB,
  reference_summary TEXT,
  is_favorite BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.usage_logs (
  id TEXT PRIMARY KEY,
  model TEXT NOT NULL,
  draft_type TEXT NOT NULL,
  input_tokens INTEGER DEFAULT 0 NOT NULL,
  output_tokens INTEGER DEFAULT 0 NOT NULL,
  total_tokens INTEGER DEFAULT 0 NOT NULL,
  raw_tokens_before_opt INTEGER DEFAULT 0 NOT NULL,
  tokens_saved INTEGER DEFAULT 0 NOT NULL,
  efficiency_percentage NUMERIC(5,2) DEFAULT 0 NOT NULL,
  cost_usd NUMERIC(10,6) DEFAULT 0 NOT NULL,
  latency_ms INTEGER DEFAULT 0 NOT NULL,
  prompt TEXT,
  result_content TEXT,
  subject_line TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public all drafts" ON public.drafts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all usage_logs" ON public.usage_logs FOR ALL USING (true) WITH CHECK (true);`;

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onClose, onSaveKey }) => {
  const [activeTab, setActiveTab] = useState<'api' | 'supabase'>('api');
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);

  // Supabase Cloud State
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseKey, setSupabaseKey] = useState('');
  const [showSupabaseKey, setShowSupabaseKey] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<{
    tested: boolean;
    success: boolean;
    message: string;
  } | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && isOpen) {
      const storedKey = localStorage.getItem(LOCAL_STORAGE_API_KEY) || '';
      const storedUrl = localStorage.getItem(LOCAL_STORAGE_SUPABASE_URL) || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
      const storedSupaKey = localStorage.getItem(LOCAL_STORAGE_SUPABASE_KEY) || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
      setApiKey(storedKey);
      setSupabaseUrl(storedUrl);
      setSupabaseKey(storedSupaKey);

      // Auto-check live connection status
      fetch('/api/db-status')
        .then((res) => res.json())
        .then((data) => {
          if (data.connected) {
            setConnectionStatus({
              tested: true,
              success: true,
              message: `Connected! PostgreSQL tables verified (${data.draftsCount ?? 0} drafts, ${data.logsCount ?? 0} usage logs).`,
            });
          }
        })
        .catch(() => {});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    setTestingConnection(true);
    setConnectionStatus(null);
    try {
      // Temporarily write to localStorage to test client resolution
      if (typeof window !== 'undefined') {
        if (supabaseUrl) localStorage.setItem(LOCAL_STORAGE_SUPABASE_URL, supabaseUrl.trim());
        if (supabaseKey) localStorage.setItem(LOCAL_STORAGE_SUPABASE_KEY, supabaseKey.trim());
      }

      const res = await fetch('/api/db-status', {
        headers: {
          'x-supabase-url': supabaseUrl.trim(),
          'x-supabase-key': supabaseKey.trim(),
        },
      });
      const data = await res.json();

      if (data.connected) {
        setConnectionStatus({
          tested: true,
          success: true,
          message: `Connected! PostgreSQL tables verified (${data.draftsCount || 0} drafts, ${data.logsCount || 0} usage logs).`,
        });
      } else {
        setConnectionStatus({
          tested: true,
          success: false,
          message: data.message || 'Connection failed. Please check your Supabase URL & Key.',
        });
      }
    } catch (err: unknown) {
      setConnectionStatus({
        tested: true,
        success: false,
        message: err instanceof Error ? err.message : 'Network test error',
      });
    } finally {
      setTestingConnection(false);
    }
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SCHEMA_SQL);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  const handleSave = () => {
    const trimmedKey = apiKey.trim();
    const trimmedUrl = supabaseUrl.trim();
    const trimmedSupaKey = supabaseKey.trim();

    if (typeof window !== 'undefined') {
      if (trimmedKey) {
        localStorage.setItem(LOCAL_STORAGE_API_KEY, trimmedKey);
      } else {
        localStorage.removeItem(LOCAL_STORAGE_API_KEY);
      }

      if (trimmedUrl) {
        localStorage.setItem(LOCAL_STORAGE_SUPABASE_URL, trimmedUrl);
      } else {
        localStorage.removeItem(LOCAL_STORAGE_SUPABASE_URL);
      }

      if (trimmedSupaKey) {
        localStorage.setItem(LOCAL_STORAGE_SUPABASE_KEY, trimmedSupaKey);
      } else {
        localStorage.removeItem(LOCAL_STORAGE_SUPABASE_KEY);
      }
    }

    // Also persist to server .env.local for seamless server-side API routes
    if (trimmedUrl && trimmedSupaKey) {
      fetch('/api/save-supabase-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: trimmedUrl, key: trimmedSupaKey }),
      }).catch((e) => console.warn('Could not sync to .env.local:', e));
    }

    onSaveKey(trimmedKey);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
      window.location.reload();
    }, 1000);
  };

  const handleClear = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(LOCAL_STORAGE_API_KEY);
      localStorage.removeItem(LOCAL_STORAGE_SUPABASE_URL);
      localStorage.removeItem(LOCAL_STORAGE_SUPABASE_KEY);
    }
    setApiKey('');
    setSupabaseUrl('');
    setSupabaseKey('');
    onSaveKey('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl p-6 shadow-2xl text-white space-y-5">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-sky-500/10 flex items-center justify-center text-sky-400">
              {activeTab === 'api' ? <KeyRound className="w-4 h-4" /> : <Database className="w-4 h-4" />}
            </div>
            <div>
              <h3 className="font-semibold text-sm text-slate-100">Settings & Database Storage</h3>
              <p className="text-[11px] text-slate-400">Configure AI API Keys & Cloud PostgreSQL</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex space-x-2 p-1 bg-slate-950 rounded-xl border border-slate-800 text-xs font-medium">
          <button
            type="button"
            onClick={() => setActiveTab('api')}
            className={`flex-1 py-1.5 rounded-lg flex items-center justify-center space-x-1.5 transition-all ${
              activeTab === 'api'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Anthropic AI Key</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('supabase')}
            className={`flex-1 py-1.5 rounded-lg flex items-center justify-center space-x-1.5 transition-all ${
              activeTab === 'supabase'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Supabase Cloud DB</span>
          </button>
        </div>

        {/* Tab 1: Anthropic API Key */}
        {activeTab === 'api' && (
          <div className="space-y-4">
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 text-xs text-emerald-300 flex items-start space-x-2.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                Your key is stored <strong>privately</strong> in your browser&apos;s <code className="bg-emerald-950/60 px-1 py-0.5 rounded font-mono">localStorage</code> or inside server-side <code className="bg-emerald-950/60 px-1 py-0.5 rounded font-mono">.env.local</code>. It is protected by <code className="bg-emerald-950/60 px-1 py-0.5 rounded font-mono">.gitignore</code> and never exposed.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-300">
                Anthropic / Claude API Key
              </label>
              <div className="relative">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="sk-ant-api03-..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 pr-10 text-xs font-mono text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200 transition-colors"
                >
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[10px] text-slate-500">
                If left blank, the app uses your server <code className="text-slate-400">.env.local</code> key.
              </p>
            </div>
          </div>
        )}

        {/* Tab 2: Supabase Cloud Database */}
        {activeTab === 'supabase' && (
          <div className="space-y-3.5">
            <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-3 text-xs text-indigo-300 flex items-start justify-between">
              <div className="flex items-start space-x-2">
                <Database className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  Connect your free <strong>Supabase Cloud PostgreSQL</strong> database to persist all email drafts, prompts, and token telemetry across devices.
                </p>
              </div>
              <button
                type="button"
                onClick={handleCopySql}
                className="ml-2 flex items-center space-x-1 px-2 py-1 bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/30 rounded-lg text-[10px] text-indigo-200 font-semibold transition-all whitespace-nowrap"
              >
                {copiedSql ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedSql ? 'Copied SQL!' : 'Copy Schema SQL'}</span>
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-300">
                Supabase Project URL
              </label>
              <input
                type="text"
                value={supabaseUrl}
                onChange={(e) => setSupabaseUrl(e.target.value)}
                placeholder="https://xyzcompany.supabase.co"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-300">
                Supabase Anon Public API Key
              </label>
              <div className="relative">
                <input
                  type={showSupabaseKey ? 'text' : 'password'}
                  value={supabaseKey}
                  onChange={(e) => setSupabaseKey(e.target.value)}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 pr-10 text-xs font-mono text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
                <button
                  type="button"
                  onClick={() => setShowSupabaseKey(!showSupabaseKey)}
                  className="absolute right-3 top-2 text-slate-400 hover:text-slate-200 transition-colors"
                >
                  {showSupabaseKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Test Connection Button & Result */}
            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={testingConnection || !supabaseUrl || !supabaseKey}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-750 disabled:opacity-40 border border-slate-700 rounded-lg text-xs font-medium text-slate-200 transition-all"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${testingConnection ? 'animate-spin' : ''}`} />
                <span>{testingConnection ? 'Testing Connection...' : 'Test Connection'}</span>
              </button>

              <span className="text-[11px] text-slate-400">
                {supabaseUrl ? 'Ready to test' : 'Leave empty for local fallback'}
              </span>
            </div>

            {connectionStatus && (
              <div
                className={`p-2.5 rounded-xl text-xs flex items-center space-x-2 animate-in fade-in ${
                  connectionStatus.success
                    ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                    : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
                }`}
              >
                {connectionStatus.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                )}
                <span>{connectionStatus.message}</span>
              </div>
            )}
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800">
          <button
            type="button"
            onClick={handleClear}
            className="flex items-center space-x-1 text-xs text-slate-400 hover:text-rose-400 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Reset Settings</span>
          </button>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className={`flex items-center space-x-1.5 px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${
                savedSuccess
                  ? 'bg-emerald-500 text-white shadow-sm'
                  : 'bg-sky-600 hover:bg-sky-500 text-white shadow-sm shadow-sky-600/30'
              }`}
            >
              <Save className="w-3.5 h-3.5" />
              <span>{savedSuccess ? 'Saved & Synced!' : 'Save & Connect'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

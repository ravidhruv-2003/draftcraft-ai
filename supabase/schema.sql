-- ============================================================
-- DraftCraft AI - Supabase PostgreSQL Schema & Realtime Setup
-- Run this script in your Supabase Project -> SQL Editor
-- ============================================================

-- 1. Drafts Table: Stores all saved letters and email drafts
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

-- Index for fast ordering by recency
CREATE INDEX IF NOT EXISTS idx_drafts_updated_at ON public.drafts (updated_at DESC);

-- 2. Usage Logs Table: Stores token telemetry, prompt history, and financial deductions
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

-- Index for fast retrieval of latest telemetry
CREATE INDEX IF NOT EXISTS idx_usage_logs_created_at ON public.usage_logs (created_at DESC);

-- 3. Row Level Security (RLS) Configuration
ALTER TABLE public.drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any to prevent duplicate errors
DROP POLICY IF EXISTS "Allow public all drafts" ON public.drafts;
DROP POLICY IF EXISTS "Allow public all usage_logs" ON public.usage_logs;
DROP POLICY IF EXISTS "Allow public read drafts" ON public.drafts;
DROP POLICY IF EXISTS "Allow public insert drafts" ON public.drafts;
DROP POLICY IF EXISTS "Allow public update drafts" ON public.drafts;
DROP POLICY IF EXISTS "Allow public delete drafts" ON public.drafts;
DROP POLICY IF EXISTS "Allow public read usage_logs" ON public.usage_logs;
DROP POLICY IF EXISTS "Allow public insert usage_logs" ON public.usage_logs;
DROP POLICY IF EXISTS "Allow public update usage_logs" ON public.usage_logs;
DROP POLICY IF EXISTS "Allow public delete usage_logs" ON public.usage_logs;

-- Allow read/write access via Supabase anon key for the application
CREATE POLICY "Allow public all drafts" ON public.drafts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all usage_logs" ON public.usage_logs FOR ALL USING (true) WITH CHECK (true);

-- 4. Enable Supabase Realtime Replication (Optional - enables instant multi-tab sync)
BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime;
COMMIT;
ALTER PUBLICATION supabase_realtime ADD TABLE public.drafts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.usage_logs;

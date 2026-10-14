# DraftCraft AI: Email & Letter Drafting Assistant with Claude Token & Efficiency Dashboard

An enterprise-grade, full-stack AI drafting workspace built with **Next.js 14**, **Claude AI Agent (Anthropic)**, **Supabase (PostgreSQL)**, and an **Automatic Prompt Optimization Engine**.

---

## 🌟 Key Highlights & Features

1. **Split-Screen Drafting Studio**:
   - Left panel for purpose, recipient targeting, reference file upload, and tone matrix controls.
   - Right panel for live AI draft canvas, formatted reading view, and export utilities.

2. **Dynamic Tone Adjustment Matrix**:
   - Tone Presets: `Formal`, `Executive`, `Friendly`, `Assertive`, `Urgent`, `Empathetic`.
   - Granular sliders for **Formality** (1 to 5) and **Directness / Urgency** (1 to 5).
   - Target Length toggles: `Concise`, `Balanced`, `Detailed`.

3. **Automatic Prompt & Context Optimization Engine**:
   - Pre-processes instructions and reference documents before sending to the LLM.
   - Compresses repetitive boilerplate, trims redundant whitespace, and structures context into high-density tokens.
   - **Token Efficiency Score**: Live badge demonstrating token savings (~25–35% cost reduction).

4. **Claude AI Usage & Credit Dashboard**:
   - **$5.00 Subscription Pool**: Real-time balance tracker that deducts exact microcents per generation.
   - **Token Ledger**: Tracks Prompt (Input) Tokens, Completion (Output) Tokens, Total Tokens, and Latency.
   - **Token Savings Tracker**: Aggregates total tokens prevented from unnecessary billing.
   - **Historical Invocations Table**: Full audit log of all API operations.

5. **Reference Document Context Ingestion**:
   - Drag-and-drop reference files (`.txt`, `.md`, `.json`, `.csv`, notes, past emails).
   - Live token estimation of attached context.

6. **Quick AI Polish Actions**:
   - ✂️ *Shorten Fluff* (concise re-writing)
   - 💼 *Executive Polish* (authoritative tone)
   - 🤝 *Make Friendly* (approachable phrasing)
   - ⚡ *Stronger Call-to-Action* (crisp closing)

7. **Supabase Cloud Database & Storage**:
   - Synchronizes saved drafts and usage logs to **Supabase PostgreSQL**.
   - Built-in zero-config LocalStorage fallback so the app works out-of-the-box even before cloud credentials are entered.

8. **Pre-Engineered Templates Library**:
   - High-converting blueprints for *Interview Follow-up*, *Project Delay Notices*, *Cold Client Outreach*, *Formal Resignation*, *Salary Review*, and *Incident Apologies*.

---

## 🚀 Quick Start Guide

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env.local` and paste your API keys:
```bash
cp .env.example .env.local
```

Edit `.env.local`:
```env
# Paste your Claude / Anthropic API Key
ANTHROPIC_API_KEY=sk-ant-api03-...

# Starting Credit Pool (Default: $5.00)
INITIAL_CREDIT_USD=5.00

# (Optional) Supabase credentials
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 3. Run the Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser!

---

## 🗄️ Supabase Database Setup (Optional)

If you wish to synchronize drafts and logs in your Supabase cloud dashboard, run this SQL script in the **Supabase SQL Editor**:

```sql
-- 1. Table for Saved Drafts
CREATE TABLE drafts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    title TEXT NOT NULL,
    draft_type TEXT NOT NULL,
    subject_line TEXT,
    content TEXT NOT NULL,
    recipient_role TEXT,
    tone_settings JSONB NOT NULL,
    reference_summary TEXT,
    is_favorite BOOLEAN DEFAULT false
);

-- 2. Table for Token Usage & Optimization Ledger
CREATE TABLE usage_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    model TEXT NOT NULL,
    draft_type TEXT,
    input_tokens INTEGER NOT NULL,
    output_tokens INTEGER NOT NULL,
    total_tokens INTEGER NOT NULL,
    raw_tokens_before_opt INTEGER,
    tokens_saved INTEGER DEFAULT 0,
    efficiency_percentage NUMERIC(5,2),
    cost_usd NUMERIC(10,6) NOT NULL,
    latency_ms INTEGER
);
```

---

## 📁 Project Architecture

- `app/page.tsx` — Main application workspace coordinating Studio, Templates, and Dashboard.
- `components/Navbar.tsx` — Header with live $5.00 credit meter and model switcher.
- `components/Studio/PromptInputPanel.tsx` — Instructions, dropzone, tone matrix, and live optimization meter.
- `components/Studio/DraftEditorPanel.tsx` — Live canvas, quick refine toolbar, and export utilities.
- `components/Dashboard/UsageDashboard.tsx` — $5.00 balance tracker, token statistics, and optimization ledger.
- `lib/optimizer.ts` — Automatic prompt compression and token efficiency calculator.
- `lib/pricing.ts` — Real-time cost and micro-cent billing engine.
- `lib/supabase.ts` — Supabase sync with automatic LocalStorage fallback.
- `lib/ai-agent.ts` — Unified AI agent supporting Claude 3.5 Sonnet, Claude 3 Haiku, Gemini, and Sandbox simulation.

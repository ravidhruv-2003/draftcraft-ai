'use client';

import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Bot,
  Sliders,
  Copy,
  Check,
  Zap,
  Clock,
  Coins,
  ArrowRight,
  TrendingDown,
  Layers,
  FileText,
  Send,
} from 'lucide-react';
import { UsageRecord } from '@/types/draft';

interface InvocationDetailModalProps {
  record: UsageRecord | null;
  onClose: () => void;
  onApplyToStudio?: (content: string, subject?: string) => void;
}

export const InvocationDetailModal: React.FC<InvocationDetailModalProps> = ({
  record,
  onClose,
  onApplyToStudio,
}) => {
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [copiedResult, setCopiedResult] = useState(false);

  if (!record) return null;

  // Format draft type title
  const formatActionName = (type: string) => {
    if (type === 'copilot_chat') return 'Copilot Assistant Chat';
    if (type.startsWith('tone_')) {
      const action = type.replace('tone_', '');
      return `Tone Adjustment: ${action.charAt(0).toUpperCase() + action.slice(1)}`;
    }
    return `Draft Generation: ${type.replace('_', ' ').toUpperCase()}`;
  };

  // Determine icon based on action
  const renderActionIcon = (type: string) => {
    if (type === 'copilot_chat') return <Bot className="w-5 h-5 text-sky-400" />;
    if (type.startsWith('tone_')) return <Sliders className="w-5 h-5 text-purple-400" />;
    return <Sparkles className="w-5 h-5 text-emerald-400" />;
  };

  // Prompt fallback if older record
  const promptText =
    record.prompt ||
    (record.draftType === 'copilot_chat'
      ? 'Interactive conversation with DraftCraft Copilot'
      : record.draftType.startsWith('tone_')
      ? `Tone refinement instruction: ${record.draftType.replace('tone_', '')}`
      : 'Email / letter drafting request');

  // Result content fallback if older record
  const resultText =
    record.resultContent ||
    (record.subjectLine ? `Subject: ${record.subjectLine}\n\n` : '') +
      'Response generated with Claude AI and recorded in the token telemetry ledger.';

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(promptText);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2000);
  };

  const handleCopyResult = () => {
    const fullText = record.subjectLine ? `Subject: ${record.subjectLine}\n\n${resultText}` : resultText;
    navigator.clipboard.writeText(fullText);
    setCopiedResult(true);
    setTimeout(() => setCopiedResult(false), 2000);
  };

  const handleApply = () => {
    if (onApplyToStudio) {
      onApplyToStudio(resultText, record.subjectLine);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-2xl shadow-2xl text-white flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center shadow-inner">
              {renderActionIcon(record.draftType)}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-base text-slate-100">
                  {formatActionName(record.draftType)}
                </h3>
                <span className="text-[10px] font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/30 px-2 py-0.5 rounded-full font-mono">
                  {record.model}
                </span>
              </div>
              <p className="text-xs text-slate-400 flex items-center space-x-2 mt-0.5">
                <span>
                  {new Date(record.timestamp).toLocaleString([], {
                    dateStyle: 'medium',
                    timeStyle: 'medium',
                  })}
                </span>
                <span>•</span>
                <span className="text-emerald-400">Success (HTTP 200)</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Diagnostic Metrics Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-4 bg-slate-950/70 border-b border-slate-800 text-xs">
          <div className="bg-slate-900/80 border border-slate-800 p-2.5 rounded-xl">
            <span className="text-slate-400 text-[10px] uppercase font-semibold block">Total Tokens</span>
            <span className="text-sm font-bold text-slate-100 font-mono">
              {record.totalTokens}
            </span>
            <span className="text-[10px] text-slate-500 block font-mono">
              {record.inputTokens} in / {record.outputTokens} out
            </span>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 p-2.5 rounded-xl">
            <span className="text-slate-400 text-[10px] uppercase font-semibold block">Tokens Saved</span>
            <span className="text-sm font-bold text-emerald-400 font-mono">
              +{record.tokensSaved}
            </span>
            <span className="text-[10px] text-emerald-500/80 block">
              {record.efficiencyPercentage}% efficiency
            </span>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 p-2.5 rounded-xl">
            <span className="text-slate-400 text-[10px] uppercase font-semibold block">Billed Cost</span>
            <span className="text-sm font-bold text-amber-300 font-mono">
              ${record.costUsd.toFixed(5)}
            </span>
            <span className="text-[10px] text-slate-500 block">Deducted from $5 pool</span>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 p-2.5 rounded-xl">
            <span className="text-slate-400 text-[10px] uppercase font-semibold block">Execution Time</span>
            <span className="text-sm font-bold text-sky-300 font-mono">
              {record.latencyMs}ms
            </span>
            <span className="text-[10px] text-slate-500 block">Round-trip latency</span>
          </div>
        </div>

        {/* Scrollable Content Area */}
        <div className="p-5 space-y-5 overflow-y-auto flex-1 text-xs">
          {/* Section 1: User Request / Prompt Input */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300 flex items-center space-x-1.5 uppercase tracking-wider">
                <FileText className="w-3.5 h-3.5 text-sky-400" />
                <span>What was Requested (Prompt / Input)</span>
              </label>
              <button
                type="button"
                onClick={handleCopyPrompt}
                className="text-[11px] text-slate-400 hover:text-slate-200 flex items-center space-x-1 transition-colors"
              >
                {copiedPrompt ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedPrompt ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-slate-200 font-sans leading-relaxed whitespace-pre-wrap max-h-40 overflow-y-auto">
              {promptText}
            </div>
          </div>

          {/* Section 2: AI Generated Result */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300 flex items-center space-x-1.5 uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>AI Generated Response / Result</span>
              </label>
              <button
                type="button"
                onClick={handleCopyResult}
                className="text-[11px] text-slate-400 hover:text-slate-200 flex items-center space-x-1 transition-colors"
              >
                {copiedResult ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedResult ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            {record.subjectLine && (
              <div className="bg-slate-950/80 border border-slate-800 px-3.5 py-2 rounded-lg text-slate-300 flex items-center space-x-2">
                <span className="text-[11px] font-semibold text-slate-400 uppercase">Subject:</span>
                <span className="font-medium text-slate-100">{record.subjectLine}</span>
              </div>
            )}

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-slate-200 font-sans leading-relaxed whitespace-pre-wrap max-h-72 overflow-y-auto shadow-inner">
              {resultText}
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex flex-wrap items-center justify-between gap-3">
          <div className="text-[11px] text-slate-400 flex items-center space-x-1">
            <Coins className="w-3.5 h-3.5 text-amber-400" />
            <span>ID: <code className="font-mono text-slate-300">{record.id.slice(0, 16)}...</code></span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-750 transition-colors"
            >
              Close
            </button>

            {onApplyToStudio && (
              <button
                type="button"
                onClick={handleApply}
                className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-600 text-white shadow-lg shadow-sky-500/20 hover:opacity-95 active:scale-95 transition-all"
              >
                <ArrowRight className="w-3.5 h-3.5" />
                <span>Apply to Studio Editor</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

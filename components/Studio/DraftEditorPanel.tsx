'use client';

import React, { useState } from 'react';
import {
  Copy,
  Check,
  Download,
  Mail,
  Bookmark,
  Zap,
  FileCheck,
  Edit3,
  Eye,
  AlertCircle,
} from 'lucide-react';
import { UsageRecord } from '@/types/draft';
import { SubjectBar } from './SubjectBar';
import { QuickPolishBar, RefinementAction } from './QuickPolishBar';
import { DraftCanvas } from './DraftCanvas';

interface DraftEditorPanelProps {
  content: string;
  setContent: (val: string) => void;
  subjectLine: string;
  setSubjectLine: (val: string) => void;
  isLoading: boolean;
  onSaveDraft: () => void;
  isSaving: boolean;
  onQuickRefine: (action: RefinementAction, customInstruction?: string) => void;
  isRefining: boolean;
  latestUsageRecord: UsageRecord | null;
  errorMessage?: string | null;
  canUndo?: boolean;
  onUndo?: () => void;
  lastActionApplied?: string | null;
}

export const DraftEditorPanel: React.FC<DraftEditorPanelProps> = ({
  content,
  setContent,
  subjectLine,
  setSubjectLine,
  isLoading,
  onSaveDraft,
  isSaving,
  onQuickRefine,
  isRefining,
  latestUsageRecord,
  errorMessage,
  canUndo,
  onUndo,
  lastActionApplied,
}) => {
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState<'edit' | 'preview'>('edit');
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleCopy = () => {
    if (!content) return;
    const fullText = subjectLine ? `Subject: ${subjectLine}\n\n${content}` : content;
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!content) return;
    const fullText = subjectLine ? `Subject: ${subjectLine}\n\n${content}` : content;
    const blob = new Blob([fullText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${subjectLine ? subjectLine.slice(0, 30).replace(/[^a-z0-9]/gi, '_') : 'draft'}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleOpenInMail = () => {
    if (!content) return;
    const mailto = `mailto:?subject=${encodeURIComponent(subjectLine || '')}&body=${encodeURIComponent(content)}`;
    window.location.href = mailto;
  };

  const handleSave = async () => {
    await onSaveDraft();
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col h-full text-white space-y-4">
      {/* Panel Header & Mode Toggle */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center space-x-2">
          <FileCheck className="w-5 h-5 text-emerald-400" />
          <h2 className="font-semibold text-base text-slate-100">Draft Canvas & Refinement</h2>
        </div>

        {/* View Switcher: Editor vs Formatted */}
        <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
          <button
            type="button"
            onClick={() => setViewMode('edit')}
            className={`flex items-center space-x-1 px-3 py-1 rounded-md transition-all font-medium ${
              viewMode === 'edit'
                ? 'bg-sky-500 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Editor</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('preview')}
            className={`flex items-center space-x-1 px-3 py-1 rounded-md transition-all font-medium ${
              viewMode === 'preview'
                ? 'bg-sky-500 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Formatted</span>
          </button>
        </div>
      </div>

      {/* Block 1: Subject Line Component */}
      <SubjectBar subjectLine={subjectLine} setSubjectLine={setSubjectLine} />

      {/* Offline / Error Alert Banner */}
      {errorMessage && (
        <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 p-3 rounded-xl text-xs flex items-center space-x-2.5 animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
          <span className="leading-relaxed font-medium">{errorMessage}</span>
        </div>
      )}

      {/* Block 2: Quick Refine Toolbar Component */}
      <QuickPolishBar
        onQuickRefine={onQuickRefine}
        isRefining={isRefining}
        disabled={isLoading || isRefining || !content || !content.trim()}
        canUndo={canUndo}
        onUndo={onUndo}
        lastActionApplied={lastActionApplied}
      />

      {/* Block 3: Dedicated High-Contrast Draft Canvas Component */}
      <DraftCanvas
        content={content}
        setContent={setContent}
        viewMode={viewMode}
        isLoading={isLoading}
      />

      {/* Block 4: Token & Cost Usage Micro-Bar */}
      {latestUsageRecord && (
        <div className="flex items-center justify-between text-[11px] bg-slate-950 border border-slate-800 px-3.5 py-2 rounded-xl text-slate-400 font-mono">
          <div className="flex items-center space-x-2">
            <Zap className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
            <span>Tokens: <strong className="text-slate-200">{latestUsageRecord.totalTokens}</strong></span>
            <span>•</span>
            <span>Cost: <strong className="text-slate-200">${latestUsageRecord.costUsd.toFixed(5)}</strong></span>
          </div>
          {latestUsageRecord.tokensSaved > 0 && (
            <span className="text-emerald-400 font-semibold font-sans">
              +{latestUsageRecord.efficiencyPercentage}% optimized
            </span>
          )}
        </div>
      )}

      {/* Block 5: Export & Action Buttons Footer */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800">
        <div className="flex items-center space-x-2">
          <button
            disabled={!content}
            onClick={handleCopy}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
              copied
                ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
            }`}
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied!' : 'Copy'}</span>
          </button>

          <button
            disabled={!content}
            onClick={handleDownload}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download .txt</span>
          </button>

          <button
            disabled={!content}
            onClick={handleOpenInMail}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 transition-all"
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Send in Mail</span>
          </button>
        </div>

        <button
          disabled={!content || isSaving}
          onClick={handleSave}
          className={`flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${
            saveSuccess
              ? 'bg-emerald-500 border-emerald-400 text-white shadow-sm'
              : 'bg-sky-600 hover:bg-sky-500 border-sky-500 text-white shadow-sm shadow-sky-600/30'
          }`}
        >
          <Bookmark className="w-3.5 h-3.5" />
          <span>{saveSuccess ? 'Saved to Supabase!' : isSaving ? 'Saving...' : 'Save Draft'}</span>
        </button>
      </div>
    </div>
  );
};

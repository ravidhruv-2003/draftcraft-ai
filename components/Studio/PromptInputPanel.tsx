'use client';

import React, { useMemo } from 'react';
import { DraftType, ToneSettings } from '@/types/draft';
import { optimizePromptAndContext } from '@/lib/optimizer';
import {
  FileText,
  Sliders,
  Sparkles,
  Gauge,
  TrendingDown,
  Info,
} from 'lucide-react';
import { ToneMatrix } from './ToneMatrix';
import { ReferenceDropzone } from './ReferenceDropzone';

interface PromptInputPanelProps {
  prompt: string;
  setPrompt: (val: string) => void;
  referenceContext: string;
  setReferenceContext: (val: string) => void;
  referenceFileName: string;
  setReferenceFileName: (val: string) => void;
  draftType: DraftType;
  setDraftType: (val: DraftType) => void;
  recipientRole: string;
  setRecipientRole: (val: string) => void;
  toneSettings: ToneSettings;
  setToneSettings: React.Dispatch<React.SetStateAction<ToneSettings>>;
  onGenerate: () => void;
  isLoading: boolean;
}

export const PromptInputPanel: React.FC<PromptInputPanelProps> = ({
  prompt,
  setPrompt,
  referenceContext,
  setReferenceContext,
  referenceFileName,
  setReferenceFileName,
  draftType,
  setDraftType,
  recipientRole,
  setRecipientRole,
  toneSettings,
  setToneSettings,
  onGenerate,
  isLoading,
}) => {
  // Compute live optimization metrics
  const optimizationStats = useMemo(() => {
    return optimizePromptAndContext(prompt, referenceContext).metrics;
  }, [prompt, referenceContext]);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col space-y-5 text-white">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center space-x-2">
          <Sliders className="w-5 h-5 text-sky-400" />
          <h2 className="font-semibold text-base text-slate-100">Draft Instructions & Context</h2>
        </div>
        <span className="text-xs text-slate-400 font-medium">Step 1 of 2</span>
      </div>

      {/* Block 1: Draft Type & Recipient Audience */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
            Draft Format
          </label>
          <select
            value={draftType}
            onChange={(e) => setDraftType(e.target.value as DraftType)}
            className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
          >
            <option value="email">Standard Email</option>
            <option value="formal_letter">Official Business Letter</option>
            <option value="cover_letter">Job Cover Letter</option>
            <option value="follow_up">Meeting / Interview Follow-up</option>
            <option value="apology">Apology & Resolution Notice</option>
            <option value="outreach">Cold Pitch / Outreach</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
            Recipient Role / Audience
          </label>
          <input
            type="text"
            value={recipientRole}
            onChange={(e) => setRecipientRole(e.target.value)}
            placeholder="e.g. Hiring Manager, Client, Landlord, Team"
            className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>
      </div>

      {/* Block 2: Main Instructions / Talking Points */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs font-semibold text-slate-300 flex items-center space-x-1.5 uppercase tracking-wider">
            <FileText className="w-3.5 h-3.5 text-sky-400" />
            <span>Core Instructions & Goals</span>
          </label>
          <span className="text-[11px] text-slate-500 font-mono">{prompt.length} chars</span>
        </div>
        <textarea
          rows={4}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g. Explain that the project release will be delayed by 2 days due to unexpected security testing. Thank the client for their patience, detail the mitigation plan, and offer a quick status call on Thursday at 2 PM."
          style={{ backgroundColor: '#090d16', color: '#f8fafc' }}
          className="w-full bg-slate-950 border border-slate-700/80 rounded-xl p-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none transition-all leading-relaxed"
        />
      </div>

      {/* Block 3: Isolated Reference Document Ingestion */}
      <ReferenceDropzone
        referenceContext={referenceContext}
        setReferenceContext={setReferenceContext}
        referenceFileName={referenceFileName}
        setReferenceFileName={setReferenceFileName}
      />

      {/* Block 4: Isolated Tone Adjustment Matrix */}
      <ToneMatrix toneSettings={toneSettings} setToneSettings={setToneSettings} />

      {/* Block 5: Automatic Optimization & Token Efficiency Banner */}
      <div className="bg-gradient-to-r from-emerald-950/40 to-slate-950 border border-emerald-500/20 rounded-xl p-3 flex items-center justify-between text-xs">
        <div className="flex items-center space-x-2 text-emerald-300">
          <Gauge className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <div>
            <span className="font-semibold block text-slate-200">Claude Optimization Engine</span>
            <span className="text-[11px] text-slate-400 font-mono">
              Input: {optimizationStats.optimizedTokensEstimate} tokens
              {optimizationStats.tokensSaved > 0 && (
                <span className="text-emerald-400 ml-1 font-semibold">
                  ({optimizationStats.tokensSaved} tokens compressed)
                </span>
              )}
            </span>
          </div>
        </div>
        {optimizationStats.efficiencyPercentage > 0 ? (
          <div className="flex items-center space-x-1 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 px-2.5 py-1 rounded-full text-[11px] font-bold">
            <TrendingDown className="w-3 h-3" />
            <span>+{optimizationStats.efficiencyPercentage}% Saved</span>
          </div>
        ) : (
          <span className="text-[10px] text-slate-500 flex items-center space-x-1">
            <Info className="w-3 h-3" />
            <span>Active</span>
          </span>
        )}
      </div>

      {/* Generate Action Button */}
      <button
        type="button"
        disabled={isLoading || !prompt.trim()}
        onClick={onGenerate}
        className={`w-full py-3.5 px-4 rounded-xl font-semibold text-sm flex items-center justify-center space-x-2 shadow-lg transition-all ${
          isLoading || !prompt.trim()
            ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
            : 'bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-600 text-white hover:opacity-95 shadow-sky-500/25 active:scale-[0.99]'
        }`}
      >
        <Sparkles className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        <span>{isLoading ? 'Generating with Claude AI...' : 'Draft Letter / Email'}</span>
      </button>
    </div>
  );
};

'use client';

import React, { useState } from 'react';
import {
  Wand2,
  Scissors,
  Award,
  HeartHandshake,
  Zap,
  CheckCheck,
  ListFilter,
  Loader2,
  Undo2,
  Sparkles,
  ArrowRight,
} from 'lucide-react';

export type RefinementAction =
  | 'shorten'
  | 'executive'
  | 'friendly'
  | 'add-cta'
  | 'grammar'
  | 'bullets'
  | 'custom';

interface QuickPolishBarProps {
  onQuickRefine: (action: RefinementAction, customInstruction?: string) => void;
  isRefining: boolean;
  disabled: boolean;
  canUndo?: boolean;
  onUndo?: () => void;
  lastActionApplied?: string | null;
}

export const QuickPolishBar: React.FC<QuickPolishBarProps> = ({
  onQuickRefine,
  isRefining,
  disabled,
  canUndo,
  onUndo,
  lastActionApplied,
}) => {
  const [customPrompt, setCustomPrompt] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  const actions: {
    id: RefinementAction;
    label: string;
    description: string;
    icon: React.ReactNode;
    color: string;
  }[] = [
    {
      id: 'shorten',
      label: 'Shorten Fluff',
      description: 'Trim redundancies and tighten phrasing',
      icon: <Scissors className="w-3.5 h-3.5 text-sky-400" />,
      color: 'hover:border-sky-500/50 hover:bg-sky-500/10',
    },
    {
      id: 'executive',
      label: 'Executive Polish',
      description: 'Authoritative, decisive C-suite tone',
      icon: <Award className="w-3.5 h-3.5 text-amber-400" />,
      color: 'hover:border-amber-500/50 hover:bg-amber-500/10',
    },
    {
      id: 'friendly',
      label: 'Make Friendly',
      description: 'Warm, collaborative, and approachable',
      icon: <HeartHandshake className="w-3.5 h-3.5 text-emerald-400" />,
      color: 'hover:border-emerald-500/50 hover:bg-emerald-500/10',
    },
    {
      id: 'add-cta',
      label: 'Stronger CTA',
      description: 'Crisp closing with decisive next steps',
      icon: <Zap className="w-3.5 h-3.5 text-purple-400" />,
      color: 'hover:border-purple-500/50 hover:bg-purple-500/10',
    },
    {
      id: 'grammar',
      label: 'Fix Grammar',
      description: 'Flawless spelling, syntax, and flow',
      icon: <CheckCheck className="w-3.5 h-3.5 text-cyan-400" />,
      color: 'hover:border-cyan-500/50 hover:bg-cyan-500/10',
    },
    {
      id: 'bullets',
      label: 'Bullet Points',
      description: 'Convert key points into scannable bullets',
      icon: <ListFilter className="w-3.5 h-3.5 text-pink-400" />,
      color: 'hover:border-pink-500/50 hover:bg-pink-500/10',
    },
  ];

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customPrompt.trim() || disabled || isRefining) return;
    onQuickRefine('custom', customPrompt.trim());
    setCustomPrompt('');
  };

  return (
    <div className="bg-slate-950/70 border border-slate-800/90 rounded-xl p-3 space-y-2.5 shadow-inner transition-all">
      {/* Header Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-5 h-5 rounded-md bg-purple-500/20 flex items-center justify-center text-purple-400">
            <Wand2 className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
            Quick AI Refinement Suite
          </span>
          {lastActionApplied && !isRefining && (
            <span className="text-[10px] bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-medium animate-in fade-in">
              ✓ Applied {lastActionApplied}
            </span>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {/* Undo Button */}
          {canUndo && onUndo && !isRefining && (
            <button
              type="button"
              onClick={onUndo}
              className="flex items-center space-x-1 text-[11px] bg-slate-800 hover:bg-slate-700 text-amber-300 hover:text-amber-200 border border-amber-500/30 px-2.5 py-1 rounded-lg transition-all shadow-sm active:scale-95"
              title="Undo last refinement and restore your previous draft"
            >
              <Undo2 className="w-3 h-3 text-amber-400" />
              <span>Undo Last Refine</span>
            </button>
          )}

          {/* Loading Indicator */}
          {isRefining && (
            <span className="text-[11px] text-purple-400 flex items-center space-x-1.5 animate-pulse font-medium">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Polishing with Claude...</span>
            </span>
          )}

          {/* Toggle Custom Prompt Bar */}
          <button
            type="button"
            disabled={disabled}
            onClick={() => setShowCustomInput(!showCustomInput)}
            className={`text-[11px] px-2 py-0.5 rounded transition-colors flex items-center space-x-1 ${
              showCustomInput
                ? 'bg-purple-600/30 text-purple-200 border border-purple-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3 h-3" />
            <span>{showCustomInput ? 'Presets' : 'Custom'}</span>
          </button>
        </div>
      </div>

      {/* Preset Action Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
        {actions.map((act) => (
          <button
            key={act.id}
            type="button"
            disabled={disabled || isRefining}
            onClick={() => onQuickRefine(act.id)}
            title={disabled ? 'Enter or generate a draft in the editor first to refine' : act.description}
            className={`flex items-center space-x-2 text-xs bg-slate-900/90 disabled:opacity-40 disabled:cursor-not-allowed border border-slate-800 text-slate-200 px-2.5 py-1.5 rounded-lg transition-all shadow-sm active:scale-95 text-left ${act.color}`}
          >
            <div className="flex-shrink-0">{act.icon}</div>
            <div className="truncate">
              <div className="font-medium text-[11px] leading-tight truncate">{act.label}</div>
            </div>
          </button>
        ))}
      </div>

      {/* Custom AI Refine Prompt Bar */}
      {showCustomInput && (
        <form onSubmit={handleCustomSubmit} className="pt-1 flex items-center space-x-1.5 animate-in fade-in duration-150">
          <div className="relative flex-1">
            <input
              type="text"
              value={customPrompt}
              disabled={disabled || isRefining}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="e.g. 'Make it more urgent', 'Add deadline by Friday', 'Translate to Spanish'..."
              className="w-full bg-slate-900 border border-slate-700/80 rounded-lg pl-3 pr-8 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-purple-500 disabled:opacity-40"
            />
          </div>
          <button
            type="submit"
            disabled={disabled || isRefining || !customPrompt.trim()}
            className="flex items-center space-x-1 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white text-xs px-3 py-1.5 rounded-lg transition-all shadow-sm active:scale-95 flex-shrink-0 font-medium"
          >
            <span>Refine</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </form>
      )}
    </div>
  );
};

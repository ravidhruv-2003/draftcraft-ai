'use client';

import React from 'react';
import { Wand2, Scissors, Award, HeartHandshake, Zap, Loader2 } from 'lucide-react';

interface QuickPolishBarProps {
  onQuickRefine: (action: 'shorten' | 'executive' | 'friendly' | 'add-cta') => void;
  isRefining: boolean;
  disabled: boolean;
}

export const QuickPolishBar: React.FC<QuickPolishBarProps> = ({
  onQuickRefine,
  isRefining,
  disabled,
}) => {
  const actions: {
    id: 'shorten' | 'executive' | 'friendly' | 'add-cta';
    label: string;
    icon: React.ReactNode;
  }[] = [
    { id: 'shorten', label: 'Shorten Fluff', icon: <Scissors className="w-3 h-3 text-sky-400" /> },
    { id: 'executive', label: 'Executive Polish', icon: <Award className="w-3 h-3 text-amber-400" /> },
    { id: 'friendly', label: 'Make Friendly', icon: <HeartHandshake className="w-3 h-3 text-emerald-400" /> },
    { id: 'add-cta', label: 'Stronger CTA', icon: <Zap className="w-3 h-3 text-purple-400" /> },
  ];

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold text-slate-400 flex items-center space-x-1 uppercase tracking-wider">
          <Wand2 className="w-3 h-3 text-purple-400" />
          <span>Quick AI Refinement</span>
        </span>
        {isRefining && (
          <span className="text-[11px] text-purple-400 flex items-center space-x-1 animate-pulse font-medium">
            <Loader2 className="w-3 h-3 animate-spin" />
            <span>Refining with Claude...</span>
          </span>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {actions.map((act) => (
          <button
            key={act.id}
            type="button"
            disabled={disabled || isRefining}
            onClick={() => onQuickRefine(act.id)}
            title={disabled ? 'Enter or generate a draft in the editor first to refine' : `Apply ${act.label}`}
            className="flex items-center space-x-1.5 text-xs bg-slate-800/90 hover:bg-slate-750 disabled:opacity-40 disabled:cursor-not-allowed border border-slate-700 text-slate-200 hover:text-white px-3 py-1.5 rounded-lg transition-all shadow-sm active:scale-95"
          >
            {act.icon}
            <span>{act.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

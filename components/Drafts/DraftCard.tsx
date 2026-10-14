'use client';

import React, { useState } from 'react';
import { DraftItem } from '@/types/draft';
import { Trash2, ArrowRight, Copy, Check } from 'lucide-react';

interface DraftCardProps {
  draft: DraftItem;
  onLoad: (draft: DraftItem) => void;
  onDelete: (id: string) => void;
}

export const DraftCard: React.FC<DraftCardProps> = ({ draft, onLoad, onDelete }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    const text = draft.subjectLine ? `Subject: ${draft.subjectLine}\n\n${draft.content}` : draft.content;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(draft.id);
  };

  return (
    <div
      onClick={() => onLoad(draft)}
      className="group bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-emerald-500/50 p-5 rounded-2xl transition-all duration-200 cursor-pointer shadow-lg flex flex-col justify-between"
    >
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
            {draft.draftType.replace('_', ' ')}
          </span>
          <span className="text-[11px] text-slate-500 font-mono">
            {new Date(draft.updatedAt).toLocaleDateString([], {
              month: 'short',
              day: 'numeric',
            })}
          </span>
        </div>

        <h3 className="font-semibold text-sm text-slate-100 group-hover:text-emerald-300 transition-colors line-clamp-1">
          {draft.subjectLine || draft.title || 'Untitled Draft'}
        </h3>

        <p className="text-xs text-slate-400 mt-2 line-clamp-3 leading-relaxed font-sans">
          {draft.content}
        </p>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={handleCopy}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            title="Copy content"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="p-1.5 rounded-lg hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 transition-colors"
            title="Delete draft"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex items-center space-x-1 font-medium group-hover:text-emerald-400 transition-colors">
          <span>Open in Studio</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </div>
  );
};

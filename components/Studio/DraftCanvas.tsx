'use client';

import React from 'react';
import { Sparkles } from 'lucide-react';

interface DraftCanvasProps {
  content: string;
  setContent: (val: string) => void;
  viewMode: 'edit' | 'preview';
  isLoading: boolean;
}

export const DraftCanvas: React.FC<DraftCanvasProps> = ({
  content,
  setContent,
  viewMode,
  isLoading,
}) => {
  // Highlights bracketed placeholders like [Recipient Name], [Your Title] in formatted view
  const renderFormattedContent = (rawText: string) => {
    const parts = rawText.split(/(\[[^\]]+\])/g);
    return parts.map((part, index) => {
      if (part.startsWith('[') && part.endsWith(']')) {
        return (
          <span
            key={index}
            className="bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1 py-0.5 rounded font-mono text-xs font-semibold"
          >
            {part}
          </span>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  return (
    <div className="flex-1 min-h-[380px] flex flex-col relative rounded-xl overflow-hidden">
      {isLoading ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-3 bg-slate-950 border border-slate-800 rounded-xl">
          <div className="w-12 h-12 rounded-full border-4 border-sky-500/20 border-t-sky-500 animate-spin" />
          <p className="text-sm font-medium text-slate-200">Claude AI is drafting your letter...</p>
          <p className="text-xs text-slate-400">Applying tone parameters, greetings, and context structure</p>
        </div>
      ) : !content ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-3 bg-slate-950 border border-dashed border-slate-800 rounded-xl">
          <Sparkles className="w-8 h-8 text-slate-600" />
          <h3 className="text-sm font-medium text-slate-300">No Draft Generated Yet</h3>
          <p className="text-xs text-slate-500 max-w-sm">
            Enter your talking points or upload a reference file on the left, then click &quot;Draft Letter / Email&quot;.
          </p>
        </div>
      ) : viewMode === 'edit' ? (
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Edit your generated draft here..."
          style={{ backgroundColor: '#090d16', color: '#f8fafc' }}
          className="flex-1 w-full bg-slate-950 text-slate-100 placeholder-slate-500 border border-slate-700/80 rounded-xl p-4 text-sm font-sans leading-relaxed focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none transition-all"
        />
      ) : (
        <div
          style={{ backgroundColor: '#090d16', color: '#f8fafc' }}
          className="flex-1 w-full bg-slate-950 text-slate-100 border border-slate-700/80 rounded-xl p-5 text-sm overflow-y-auto whitespace-pre-wrap leading-relaxed font-sans"
        >
          {renderFormattedContent(content)}
        </div>
      )}
    </div>
  );
};

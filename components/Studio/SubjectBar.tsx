'use client';

import React, { useState } from 'react';
import { Mail, Copy, Check } from 'lucide-react';

interface SubjectBarProps {
  subjectLine: string;
  setSubjectLine: (val: string) => void;
}

export const SubjectBar: React.FC<SubjectBarProps> = ({ subjectLine, setSubjectLine }) => {
  const [copied, setCopied] = useState(false);

  const handleCopySubject = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!subjectLine) return;
    navigator.clipboard.writeText(subjectLine);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center space-x-1">
          <Mail className="w-3 h-3 text-sky-400" />
          <span>Subject Line</span>
        </label>
        {subjectLine && (
          <span className="text-[10px] text-slate-500 font-mono">
            {subjectLine.length} chars
          </span>
        )}
      </div>

      <div className="flex items-center space-x-2 bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 focus-within:ring-2 focus-within:ring-sky-500 transition-all">
        <input
          type="text"
          value={subjectLine}
          onChange={(e) => setSubjectLine(e.target.value)}
          placeholder="Subject line will be auto-generated or type your custom subject..."
          style={{ backgroundColor: 'transparent', color: '#f8fafc' }}
          className="w-full text-sm text-slate-100 placeholder-slate-500 focus:outline-none"
        />

        {subjectLine && (
          <button
            type="button"
            onClick={handleCopySubject}
            title="Copy subject line"
            className="p-1 rounded text-slate-400 hover:text-white transition-colors"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </button>
        )}
      </div>
    </div>
  );
};

'use client';

import React, { useState } from 'react';
import { UploadCloud, FileCheck, X, Eye } from 'lucide-react';
import { estimateTokens } from '@/lib/optimizer';

interface ReferenceDropzoneProps {
  referenceContext: string;
  setReferenceContext: (val: string) => void;
  referenceFileName: string;
  setReferenceFileName: (val: string) => void;
}

export const ReferenceDropzone: React.FC<ReferenceDropzoneProps> = ({
  referenceContext,
  setReferenceContext,
  referenceFileName,
  setReferenceFileName,
}) => {
  const [showPreview, setShowPreview] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setReferenceFileName(file.name);
    setShowPreview(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setReferenceContext(text || '');
    };
    reader.readAsText(file);
  };

  const handleRemove = () => {
    setReferenceFileName('');
    setReferenceContext('');
    setShowPreview(false);
  };

  return (
    <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 space-y-2.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-300 flex items-center space-x-1.5 uppercase tracking-wider">
          <UploadCloud className="w-4 h-4 text-sky-400" />
          <span>Reference Document / Context</span>
        </span>
        {referenceFileName && (
          <button
            type="button"
            onClick={handleRemove}
            className="text-[11px] text-rose-400 hover:text-rose-300 flex items-center space-x-1 transition-colors"
          >
            <X className="w-3 h-3" />
            <span>Remove</span>
          </button>
        )}
      </div>

      {!referenceFileName ? (
        <label className="border-2 border-dashed border-slate-700/80 hover:border-sky-500/60 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer transition-all bg-slate-900/50 hover:bg-slate-900 group">
          <UploadCloud className="w-6 h-6 text-slate-400 group-hover:text-sky-400 mb-1 transition-colors" />
          <span className="text-xs font-medium text-slate-300 group-hover:text-white">
            Drop reference file or click to browse
          </span>
          <span className="text-[10px] text-slate-500 mt-0.5">Supports .txt, .md, .json, past threads</span>
          <input
            type="file"
            accept=".txt,.md,.json,.csv,.doc,.docx"
            onChange={handleFileUpload}
            className="hidden"
          />
        </label>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center justify-between bg-slate-900 px-3 py-2 rounded-lg border border-slate-800 text-xs">
            <div className="flex items-center space-x-2 text-slate-200">
              <FileCheck className="w-4 h-4 text-emerald-400" />
              <span className="font-medium truncate max-w-[200px]">{referenceFileName}</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-[11px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded font-mono">
                ~{estimateTokens(referenceContext)} tokens
              </span>
              <button
                type="button"
                onClick={() => setShowPreview(!showPreview)}
                className="text-slate-400 hover:text-white"
                title="Toggle context preview"
              >
                <Eye className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {showPreview && (
            <textarea
              rows={3}
              value={referenceContext}
              onChange={(e) => setReferenceContext(e.target.value)}
              placeholder="Reference text context..."
              style={{ backgroundColor: '#090d16', color: '#f8fafc' }}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-sky-500 font-mono"
            />
          )}
        </div>
      )}
    </div>
  );
};

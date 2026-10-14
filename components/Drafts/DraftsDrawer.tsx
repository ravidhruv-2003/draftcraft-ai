'use client';

import React, { useState } from 'react';
import { DraftItem } from '@/types/draft';
import { BookmarkCheck, Search, FileText } from 'lucide-react';
import { DraftCard } from './DraftCard';

interface DraftsDrawerProps {
  drafts: DraftItem[];
  onLoadDraft: (draft: DraftItem) => void;
  onDeleteDraft: (id: string) => void;
}

export const DraftsDrawer: React.FC<DraftsDrawerProps> = ({ drafts, onLoadDraft, onDeleteDraft }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredDrafts = drafts.filter((d) => {
    const q = searchTerm.toLowerCase();
    return (
      d.title.toLowerCase().includes(q) ||
      (d.subjectLine && d.subjectLine.toLowerCase().includes(q)) ||
      d.content.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto text-white">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <BookmarkCheck className="w-5 h-5 text-emerald-400" />
            <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-emerald-400 to-sky-400 bg-clip-text text-transparent">
              Saved Drafts Library
            </h1>
            <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Supabase Synced ({drafts.length})</span>
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Browse and manage your saved letters and email drafts synchronized in your Supabase Cloud PostgreSQL database.
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search saved drafts..."
            className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>
      </div>

      {/* Grid of Modular Draft Cards */}
      {filteredDrafts.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-500 space-y-3">
          <FileText className="w-10 h-10 mx-auto text-slate-600" />
          <h3 className="text-sm font-medium text-slate-300">No Drafts Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {searchTerm
              ? 'No drafts matched your search query. Try different keywords.'
              : 'Generate a draft in the Studio and click "Save Draft" to store it here.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredDrafts.map((draft) => (
            <DraftCard
              key={draft.id}
              draft={draft}
              onLoad={onLoadDraft}
              onDelete={onDeleteDraft}
            />
          ))}
        </div>
      )}
    </div>
  );
};

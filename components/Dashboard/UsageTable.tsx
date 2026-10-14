'use client';

import React, { useState } from 'react';
import { UsageRecord } from '@/types/draft';
import { Clock, Search, Eye, Sparkles } from 'lucide-react';
import { InvocationDetailModal } from './InvocationDetailModal';

interface UsageTableProps {
  logs: UsageRecord[];
  onApplyToStudio?: (content: string, subject?: string) => void;
}

export const UsageTable: React.FC<UsageTableProps> = ({ logs, onApplyToStudio }) => {
  const [filterQuery, setFilterQuery] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<UsageRecord | null>(null);

  const filteredLogs = logs.filter((l) => {
    const q = filterQuery.toLowerCase();
    return (
      l.model.toLowerCase().includes(q) ||
      l.draftType.toLowerCase().includes(q)
    );
  });

  return (
    <>
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="font-semibold text-sm text-slate-100">API Invocations & Token Ledger</h2>
              <span className="text-[10px] bg-sky-500/10 text-sky-400 border border-sky-500/30 px-2 py-0.5 rounded-full font-medium hidden sm:inline-flex items-center space-x-1">
                <Sparkles className="w-2.5 h-2.5" />
                <span>Click any row to view full prompts & results</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Click any invocation record to inspect the exact prompt, AI response, savings, and apply back to Studio.
            </p>
          </div>

          <div className="relative w-full sm:w-60">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              placeholder="Filter by model or type..."
              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
          </div>
        </div>

        {filteredLogs.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-2">
            <Clock className="w-8 h-8 mx-auto text-slate-600" />
            <p className="text-sm font-medium">No API calls found.</p>
            <p className="text-xs text-slate-600">
              {filterQuery ? 'No calls matched your filter.' : 'Draft a letter in the Studio to view live token metrics here.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Time</th>
                  <th className="py-3 px-4">Model</th>
                  <th className="py-3 px-4">Action / Type</th>
                  <th className="py-3 px-4">Tokens (In / Out)</th>
                  <th className="py-3 px-4">Total Tokens</th>
                  <th className="py-3 px-4">Tokens Saved</th>
                  <th className="py-3 px-4">Cost ($)</th>
                  <th className="py-3 px-4">Latency</th>
                  <th className="py-3 px-4 text-center">Inspect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                {filteredLogs.map((log) => (
                  <tr
                    key={log.id}
                    onClick={() => setSelectedRecord(log)}
                    title="Click to view prompt, generated result, and metrics breakdown"
                    className="hover:bg-slate-800/70 cursor-pointer transition-colors group"
                  >
                    <td suppressHydrationWarning className="py-3 px-4 font-sans text-slate-400 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </td>
                    <td className="py-3 px-4 font-sans text-slate-200 whitespace-nowrap">
                      <span className="bg-slate-800 border border-slate-700 px-2 py-0.5 rounded text-[10px] group-hover:border-sky-500/50 transition-colors">
                        {log.model.split('-')[0] || log.model}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-sans capitalize text-slate-300 font-medium">
                      {log.draftType.replace('_', ' ')}
                    </td>
                    <td className="py-3 px-4 text-slate-400">
                      {log.inputTokens} / {log.outputTokens}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-200">
                      {log.totalTokens}
                    </td>
                    <td className="py-3 px-4 text-emerald-400 font-semibold font-sans">
                      +{log.tokensSaved} ({log.efficiencyPercentage}%)
                    </td>
                    <td className="py-3 px-4 text-amber-300 font-bold">
                      ${log.costUsd.toFixed(5)}
                    </td>
                    <td className="py-3 px-4 text-slate-400">
                      {log.latencyMs}ms
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedRecord(log);
                        }}
                        className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-slate-800 group-hover:bg-sky-500 group-hover:text-white text-slate-400 text-[11px] font-sans font-medium transition-all shadow-sm"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail & History Modal */}
      <InvocationDetailModal
        record={selectedRecord}
        onClose={() => setSelectedRecord(null)}
        onApplyToStudio={onApplyToStudio}
      />
    </>
  );
};

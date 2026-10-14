'use client';

import React, { useState } from 'react';
import { Mail, Sparkles, BarChart3, BookOpen, BookmarkCheck, Zap, KeyRound, Database } from 'lucide-react';
import { ApiKeyModal } from './Settings/ApiKeyModal';

interface NavbarProps {
  activeTab: 'studio' | 'templates' | 'dashboard' | 'drafts';
  setActiveTab: (tab: 'studio' | 'templates' | 'dashboard' | 'drafts') => void;
  selectedModel: string;
  setSelectedModel: (model: string) => void;
  remainingCredits: number;
  totalTokens: number;
  onApiKeyUpdated?: (key: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  selectedModel,
  setSelectedModel,
  remainingCredits,
  onApiKeyUpdated,
}) => {
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [dbStatus, setDbStatus] = useState<{ connected: boolean; draftsCount: number } | null>(null);

  const checkDbStatus = React.useCallback(() => {
    fetch('/api/db-status')
      .then((res) => res.json())
      .then((data) => setDbStatus({ connected: !!data.connected, draftsCount: data.draftsCount || 0 }))
      .catch(() => setDbStatus({ connected: false, draftsCount: 0 }));
  }, []);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    setIsOnline(navigator.onLine);
    const handleOnline = () => {
      setIsOnline(true);
      checkDbStatus();
    };
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    checkDbStatus();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [checkDbStatus]);

  return (
    <>
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('studio')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 via-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-sky-500/20">
              <Mail className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                  DraftCraft AI
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-wider bg-sky-500/10 text-sky-400 border border-sky-500/30 px-1.5 py-0.5 rounded">
                  Pro
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">AI Email & Letter Assistant</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center space-x-1 sm:space-x-2 bg-slate-800/80 p-1 rounded-xl border border-slate-700/60 text-sm">
            <button
              onClick={() => setActiveTab('studio')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
                activeTab === 'studio'
                  ? 'bg-sky-500 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span className="hidden md:inline">Studio</span>
            </button>

            <button
              onClick={() => setActiveTab('templates')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
                activeTab === 'templates'
                  ? 'bg-sky-500 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span className="hidden md:inline">Templates</span>
            </button>

            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-sky-500 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span className="hidden md:inline">Usage & Efficiency</span>
            </button>

            <button
              onClick={() => setActiveTab('drafts')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
                activeTab === 'drafts'
                  ? 'bg-sky-500 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <BookmarkCheck className="w-4 h-4" />
              <span className="hidden md:inline">Saved</span>
            </button>
          </nav>

          {/* Right Utility: Private Key, Model Selector & Live Credit Balance */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Database & API Status Button */}
            <button
              onClick={() => setIsKeyModalOpen(true)}
              title={
                dbStatus?.connected
                  ? `Supabase Cloud PostgreSQL Active (${dbStatus.draftsCount} drafts synced)`
                  : 'Click to configure Supabase Cloud Database'
              }
              className={`flex items-center space-x-1.5 text-xs px-2.5 py-1.5 rounded-lg border transition-all ${
                dbStatus?.connected
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20 shadow-sm shadow-emerald-500/10'
                  : 'bg-slate-800 hover:bg-slate-750 border-slate-700 text-slate-300 hover:text-white'
              }`}
            >
              <Database className={`w-3.5 h-3.5 ${dbStatus?.connected ? 'text-emerald-400' : 'text-sky-400'}`} />
              <span className="hidden xl:inline">
                {dbStatus?.connected ? 'Supabase Connected' : 'Database & API'}
              </span>
              {dbStatus?.connected && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse hidden sm:inline-block" />
              )}
            </button>

            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-sky-500 cursor-pointer hidden lg:block"
            >
              <option value="claude-sonnet-4-5-20250929">Claude Sonnet 4.5 (Recommended)</option>
              <option value="claude-haiku-4-5-20251001">Claude Haiku 4.5 (Fast)</option>
              <option value="claude-sonnet-4-6">Claude Sonnet 4.6 (Next-Gen)</option>
              <option value="claude-opus-4-6">Claude Opus 4.6 (Deep)</option>
              <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
            </select>

            {/* Online / Offline Status Badge */}
            <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700 text-[11px] hidden sm:flex">
              <span className={`w-2 h-2 rounded-full ${!isOnline ? 'bg-rose-500 animate-pulse' : 'bg-emerald-400'}`} />
              <span className="text-slate-300 font-medium">
                {!isOnline ? 'Offline' : 'Online'}
              </span>
            </div>

            {/* $5 Credit Balance Pill */}
            <div
              onClick={() => setActiveTab('dashboard')}
              title="Remaining from your $5.00 Subscription. Click to view analytics."
              className="flex items-center space-x-2 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/30 px-3 py-1 rounded-full cursor-pointer hover:border-emerald-400 transition-all"
            >
              <Zap className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <div className="text-right">
                <span className="text-[10px] text-emerald-400 block leading-tight font-medium uppercase">Balance</span>
                <span className="text-xs font-bold text-emerald-300">
                  ${remainingCredits.toFixed(3)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Private API Key Modal */}
      <ApiKeyModal
        isOpen={isKeyModalOpen}
        onClose={() => {
          setIsKeyModalOpen(false);
          checkDbStatus();
        }}
        onSaveKey={(key) => {
          if (onApiKeyUpdated) onApiKeyUpdated(key);
          checkDbStatus();
        }}
      />
    </>
  );
};

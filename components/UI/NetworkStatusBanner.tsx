'use client';

import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi, RefreshCw } from 'lucide-react';

export const NetworkStatusBanner: React.FC = () => {
  const [isOnline, setIsOnline] = useState(true);
  const [showReconnected, setShowReconnected] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      setShowReconnected(true);
      setTimeout(() => setShowReconnected(false), 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowReconnected(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline && !showReconnected) {
    return null;
  }

  if (showReconnected) {
    return (
      <div className="bg-emerald-600 text-white px-4 py-2 text-xs font-semibold flex items-center justify-center space-x-2 shadow-md animate-in fade-in duration-200">
        <Wifi className="w-4 h-4" />
        <span>Internet connection restored. You are back online!</span>
      </div>
    );
  }

  return (
    <div className="bg-rose-600 text-white px-4 py-2.5 text-xs font-medium flex items-center justify-between shadow-lg sticky top-0 z-50 animate-in fade-in duration-200">
      <div className="flex items-center space-x-2 max-w-7xl mx-auto w-full">
        <WifiOff className="w-4 h-4 text-white animate-pulse flex-shrink-0" />
        <div className="flex-1">
          <strong className="font-bold">System Offline:</strong> You appear to have lost internet connectivity. Claude AI generation, Copilot chat, and Supabase sync require an active connection.
        </div>
        <button
          onClick={() => window.location.reload()}
          className="bg-white/20 hover:bg-white/30 text-white text-[11px] font-semibold px-2.5 py-1 rounded-md transition-all flex items-center space-x-1"
        >
          <RefreshCw className="w-3 h-3" />
          <span>Retry</span>
        </button>
      </div>
    </div>
  );
};

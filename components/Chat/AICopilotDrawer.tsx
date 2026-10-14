'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Bot,
  Send,
  X,
  Sparkles,
  ArrowUpRight,
  RefreshCw,
  Copy,
  Check,
  FileCheck,
  Minimize2,
  Maximize2,
  Lightbulb,
} from 'lucide-react';
import { apiService } from '@/services/apiService';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  subjectLine?: string;
}

interface AICopilotDrawerProps {
  currentDraftContent: string;
  currentSubject: string;
  onApplyDraftToStudio: (content: string, subject?: string) => void;
  selectedModel: string;
  onRefreshUsage: () => void;
}

export const AICopilotDrawer: React.FC<AICopilotDrawerProps> = ({
  currentDraftContent,
  currentSubject,
  onApplyDraftToStudio,
  selectedModel,
  onRefreshUsage,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        "👋 Hello! I am your **DraftCraft Copilot**.\n\nI can:\n• **Suggest**: Brainstorm subject lines, angles, and strategies.\n• **Optimise**: Critique and compress your draft to save tokens.\n• **Create**: Write customized emails and letters that you can insert directly into your Studio editor.\n\nHow can I help you today?",
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || isLoading) return;

    const userMessage: ChatMessage = {
      id: `usr_${Date.now()}`,
      role: 'user',
      content: text,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await apiService.sendChatMessage({
        messages: [...messages, userMessage].map((m) => ({
          role: m.role,
          content: m.content,
        })),
        currentDraftContent,
        currentSubject,
        model: selectedModel,
      });

      const assistantMessage: ChatMessage = {
        id: `asst_${Date.now()}`,
        role: 'assistant',
        content: response.reply,
        subjectLine: response.subjectLine,
      };

      setMessages((prev) => [...prev, assistantMessage]);
      onRefreshUsage();
    } catch (err: unknown) {
      console.error('Copilot chat error:', err);
      const errorMessage: ChatMessage = {
        id: `err_${Date.now()}`,
        role: 'assistant',
        content: '⚠️ ' + (err instanceof Error ? err.message : 'Failed to reach AI Copilot. Please check your network or API key.'),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const handleClearHistory = () => {
    setMessages([
      {
        id: 'welcome_reset',
        role: 'assistant',
        content: "Chat cleared. What would you like to draft, optimize, or brainstorm next?",
      },
    ]);
  };

  const quickPromptChips = [
    { label: '🎯 Critique current draft', prompt: 'Review my current draft in the studio. Highlight 3 areas to optimize for clarity, tone, and token efficiency.' },
    { label: '💡 Suggest 3 subject lines', prompt: 'Suggest 3 high-converting email subject lines for my current draft with open-rate appeal.' },
    { label: '💼 Make it more executive', prompt: 'Rewrite my current draft to sound authoritative, executive-level, and decisive while keeping it under 150 words.' },
    { label: '✍️ Draft client follow-up', prompt: 'Write a polite, professional 2-paragraph follow-up email to a prospective client who has not replied for 4 days.' },
  ];

  return (
    <>
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-40 flex items-center space-x-2 bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-600 text-white px-4 py-3 rounded-full shadow-2xl hover:shadow-sky-500/30 hover:scale-105 active:scale-95 transition-all duration-200 group border border-white/20"
        >
          <div className="relative">
            <Bot className="w-5 h-5 text-white" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full animate-ping" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full" />
          </div>
          <span className="text-xs font-bold tracking-wide">Ask AI Copilot</span>
        </button>
      )}

      {/* Floating Chat Drawer Window */}
      {isOpen && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex flex-col bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden transition-all duration-200 text-white ${
            isExpanded ? 'w-[95vw] sm:w-[620px] h-[85vh]' : 'w-[95vw] sm:w-[440px] h-[600px]'
          }`}
          style={{ backgroundColor: '#090d16' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-slate-950 border-b border-slate-800">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-md">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center space-x-1.5">
                  <span className="font-semibold text-xs text-slate-100">DraftCraft Copilot</span>
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.2 rounded font-medium">
                    Online
                  </span>
                </div>
                <p className="text-[10px] text-slate-400">Suggest • Optimise • Create</p>
              </div>
            </div>

            <div className="flex items-center space-x-1 text-slate-400">
              <button
                type="button"
                onClick={handleClearHistory}
                title="Clear chat"
                className="p-1.5 rounded-lg hover:text-white hover:bg-slate-800 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                title={isExpanded ? 'Restore size' : 'Expand window'}
                className="p-1.5 rounded-lg hover:text-white hover:bg-slate-800 transition-colors"
              >
                {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                title="Close Copilot"
                className="p-1.5 rounded-lg hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Context Banner: Connected to current studio draft */}
          {currentDraftContent && (
            <div className="px-4 py-1.5 bg-sky-950/40 border-b border-sky-500/20 text-[11px] text-sky-300 flex items-center justify-between">
              <div className="flex items-center space-x-1.5 truncate">
                <FileCheck className="w-3.5 h-3.5 text-sky-400 flex-shrink-0" />
                <span className="truncate">
                  Linked to draft: <strong className="text-white">{currentSubject || 'Current Editor Content'}</strong>
                </span>
              </div>
              <span className="text-[10px] bg-sky-500/20 px-1.5 py-0.5 rounded text-sky-200 font-mono">
                Active
              </span>
            </div>
          )}

          {/* Messages Stream */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs font-sans">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[88%] rounded-2xl p-3.5 leading-relaxed whitespace-pre-wrap ${
                    msg.role === 'user'
                      ? 'bg-sky-600 text-white rounded-br-none shadow-md'
                      : 'bg-slate-850 border border-slate-800 text-slate-200 rounded-bl-none shadow-sm'
                  }`}
                  style={msg.role === 'assistant' ? { backgroundColor: '#0e1628' } : undefined}
                >
                  {msg.content}
                </div>

                {/* Assistant Action Bar (Copy & Insert into Studio) */}
                {msg.role === 'assistant' && msg.id !== 'welcome' && (
                  <div className="flex items-center space-x-2 mt-1.5 text-[11px] text-slate-400">
                    <button
                      type="button"
                      onClick={() => handleCopy(msg.id, msg.content)}
                      className="hover:text-white flex items-center space-x-1 p-1 rounded"
                    >
                      {copiedId === msg.id ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-400">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>

                    {/* If message appears to be a draft */}
                    <button
                      type="button"
                      onClick={() => onApplyDraftToStudio(msg.content, msg.subjectLine)}
                      className="flex items-center space-x-1 text-sky-400 hover:text-sky-300 font-semibold p-1 rounded transition-colors"
                      title="Replace editor content with this draft"
                    >
                      <ArrowUpRight className="w-3 h-3" />
                      <span>Apply to Editor</span>
                    </button>
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex items-center space-x-2 text-slate-400 text-xs py-2">
                <div className="w-4 h-4 border-2 border-sky-500/20 border-t-sky-500 rounded-full animate-spin" />
                <span className="animate-pulse">Copilot is thinking & optimizing...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompt Chips */}
          <div className="px-3 py-2 bg-slate-950/70 border-t border-slate-800/80 overflow-x-auto flex items-center space-x-1.5 no-scrollbar">
            <Lightbulb className="w-3 h-3 text-amber-400 flex-shrink-0 ml-1" />
            {quickPromptChips.map((chip, idx) => (
              <button
                key={idx}
                type="button"
                disabled={isLoading}
                onClick={() => handleSendMessage(chip.prompt)}
                className="whitespace-nowrap text-[11px] bg-slate-800/80 hover:bg-slate-750 border border-slate-700/60 text-slate-300 hover:text-white px-2.5 py-1 rounded-full transition-all flex-shrink-0"
              >
                {chip.label}
              </button>
            ))}
          </div>

          {/* Input Box Footer */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-3 bg-slate-950 border-t border-slate-800 flex items-center space-x-2"
          >
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Ask Copilot to suggest, optimize, or write..."
              style={{ backgroundColor: '#090d16', color: '#f8fafc' }}
              className="flex-1 bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
            <button
              type="submit"
              disabled={isLoading || !inputMessage.trim()}
              className="p-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-40 text-white transition-all shadow-md active:scale-95 flex-shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
};

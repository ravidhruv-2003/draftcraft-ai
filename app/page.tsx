'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from '@/components/Navbar';
import { PromptInputPanel } from '@/components/Studio/PromptInputPanel';
import { DraftEditorPanel } from '@/components/Studio/DraftEditorPanel';
import { UsageDashboard } from '@/components/Dashboard/UsageDashboard';
import { TemplatesGallery } from '@/components/Templates/TemplatesGallery';
import { DraftsDrawer } from '@/components/Drafts/DraftsDrawer';
import { DraftType, ToneSettings, UsageRecord, DraftItem, TemplateItem } from '@/types/draft';
import { fetchDrafts, saveDraftItem, removeDraft, getUsageAnalytics } from '@/lib/supabase';
import { INITIAL_SUBSCRIPTION_CREDIT } from '@/lib/pricing';
import { apiService } from '@/services/apiService';
import { AICopilotDrawer } from '@/components/Chat/AICopilotDrawer';

import { NetworkStatusBanner } from '@/components/UI/NetworkStatusBanner';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'studio' | 'templates' | 'dashboard' | 'drafts'>('studio');
  const [selectedModel, setSelectedModel] = useState<string>('claude-sonnet-4-5-20250929');

  // Studio State
  const [prompt, setPrompt] = useState('');
  const [referenceContext, setReferenceContext] = useState('');
  const [referenceFileName, setReferenceFileName] = useState('');
  const [draftType, setDraftType] = useState<DraftType>('email');
  const [recipientRole, setRecipientRole] = useState('');
  const [toneSettings, setToneSettings] = useState<ToneSettings>({
    preset: 'formal',
    formality: 4,
    length: 'balanced',
    directness: 3,
  });

  const [generatedContent, setGeneratedContent] = useState('');
  const [subjectLine, setSubjectLine] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [latestUsageRecord, setLatestUsageRecord] = useState<UsageRecord | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Analytics & Database State
  const [usageLogs, setUsageLogs] = useState<UsageRecord[]>([]);
  const [draftsList, setDraftsList] = useState<DraftItem[]>([]);
  const [remainingCredits, setRemainingCredits] = useState<number>(INITIAL_SUBSCRIPTION_CREDIT);
  const [totalTokens, setTotalTokens] = useState<number>(0);
  const [totalCostUsd, setTotalCostUsd] = useState<number>(0);
  const [totalTokensSaved, setTotalTokensSaved] = useState<number>(0);
  const [overallEfficiencyPercentage, setOverallEfficiencyPercentage] = useState<number>(28.5);
  const [isRefreshingStats, setIsRefreshingStats] = useState(false);

  // Load initial data
  const loadData = useCallback(async () => {
    setIsRefreshingStats(true);
    try {
      const [drafts, analytics] = await Promise.all([
        apiService.fetchDrafts().then((d) => (d && d.length > 0 ? d : fetchDrafts())),
        apiService.fetchUsageAnalytics().catch(() => getUsageAnalytics()),
      ]);

      setDraftsList(drafts);
      setUsageLogs(analytics.logs);
      setTotalTokens(analytics.totalTokens);
      setTotalCostUsd(analytics.totalCostUsd);
      setRemainingCredits(analytics.remainingCreditsUsd);
      setTotalTokensSaved(analytics.totalTokensSaved);
      if (analytics.overallEfficiencyPercentage > 0) {
        setOverallEfficiencyPercentage(analytics.overallEfficiencyPercentage);
      }
    } catch (err) {
      console.warn('Initial data load error:', err);
    } finally {
      setIsRefreshingStats(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // AI Generation Handler
  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const data = await apiService.generateDraft({
        prompt,
        referenceContext,
        draftType,
        recipientRole,
        toneSettings,
        model: selectedModel,
      });

      if (data.content) {
        setGeneratedContent(data.content);
        if (data.subjectLine) {
          setSubjectLine(data.subjectLine);
        }
        if (data.usageRecord) {
          setLatestUsageRecord(data.usageRecord);
          // Refresh analytics in background
          loadData();
        }
      }
    } catch (err: unknown) {
      console.error('Generation error:', err);
      const msg = err instanceof Error ? err.message : 'Error communicating with drafting engine';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // Quick Refine Action Handler
  const handleQuickRefine = async (action: 'shorten' | 'executive' | 'friendly' | 'add-cta') => {
    if (!generatedContent) return;
    setIsRefining(true);
    try {
      const data = await apiService.adjustTone({
        currentContent: generatedContent,
        targetPreset: toneSettings.preset,
        action,
        model: 'claude-haiku-4-5-20251001',
      });

      if (data.content) {
        setGeneratedContent(data.content);
        loadData();
      }
    } catch (err: unknown) {
      console.error('Refine error:', err);
      alert(err instanceof Error ? err.message : 'Error refining draft');
    } finally {
      setIsRefining(false);
    }
  };

  // Save to Supabase / Backend Handler
  const handleSaveDraft = async () => {
    if (!generatedContent) return;
    setIsSaving(true);
    try {
      const draftPayload = {
        title: subjectLine || `${draftType.toUpperCase()} - ${prompt.slice(0, 30)}`,
        draftType,
        subjectLine,
        content: generatedContent,
        recipientRole,
        toneSettings,
        referenceSummary: referenceFileName ? `Referenced file: ${referenceFileName}` : undefined,
      };

      const saved = (await apiService.saveDraft(draftPayload)) as DraftItem | null;
      const finalDraft = saved || (await saveDraftItem(draftPayload));

      setDraftsList((prev) => [finalDraft, ...prev.filter((d) => d.id !== finalDraft.id)]);
    } catch (err) {
      console.error('Save draft error:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Load Template Blueprint into Studio
  const handleSelectTemplate = (tpl: TemplateItem) => {
    setPrompt(tpl.samplePrompt);
    setDraftType(tpl.draftType);
    setRecipientRole(tpl.recipientRole);
    setToneSettings((prev) => ({
      ...prev,
      preset: tpl.defaultTone,
    }));
    setActiveTab('studio');
  };

  // Load Saved Draft into Studio
  const handleLoadDraft = (draft: DraftItem) => {
    setGeneratedContent(draft.content);
    setSubjectLine(draft.subjectLine || '');
    setDraftType(draft.draftType);
    if (draft.recipientRole) setRecipientRole(draft.recipientRole);
    if (draft.toneSettings) setToneSettings(draft.toneSettings);
    setActiveTab('studio');
  };

  // Delete Draft
  const handleDeleteDraft = async (id: string) => {
    await apiService.deleteDraft(id);
    await removeDraft(id);
    setDraftsList((prev) => prev.filter((d) => d.id !== id));
  };

  // Apply draft suggested or created by Copilot straight into the studio canvas
  const handleApplyDraftFromCopilot = (content: string, subject?: string) => {
    let cleanContent = content;
    let cleanSubject = subject || '';
    const match = content.match(/^Subject:\s*(.*)$/im);
    if (match) {
      cleanSubject = match[1].trim();
      cleanContent = content.replace(/^Subject:\s*.*$/im, '').trim();
    }
    setGeneratedContent(cleanContent);
    if (cleanSubject) setSubjectLine(cleanSubject);
    setActiveTab('studio');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-sky-500/30 selection:text-sky-200">
      {/* Network Offline / Online Banner */}
      <NetworkStatusBanner />

      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        selectedModel={selectedModel}
        setSelectedModel={setSelectedModel}
        remainingCredits={remainingCredits}
        totalTokens={totalTokens}
      />

      {/* Main App Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {activeTab === 'studio' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left 6-cols: Instructions, Context, Tone */}
            <div className="lg:col-span-6">
              <PromptInputPanel
                prompt={prompt}
                setPrompt={setPrompt}
                referenceContext={referenceContext}
                setReferenceContext={setReferenceContext}
                referenceFileName={referenceFileName}
                setReferenceFileName={setReferenceFileName}
                draftType={draftType}
                setDraftType={setDraftType}
                recipientRole={recipientRole}
                setRecipientRole={setRecipientRole}
                toneSettings={toneSettings}
                setToneSettings={setToneSettings}
                onGenerate={handleGenerate}
                isLoading={isLoading}
              />
            </div>

            {/* Right 6-cols: Live Canvas & Refine */}
            <div className="lg:col-span-6 sticky top-20">
              <DraftEditorPanel
                content={generatedContent}
                setContent={setGeneratedContent}
                subjectLine={subjectLine}
                setSubjectLine={setSubjectLine}
                isLoading={isLoading}
                onSaveDraft={handleSaveDraft}
                isSaving={isSaving}
                onQuickRefine={handleQuickRefine}
                isRefining={isRefining}
                latestUsageRecord={latestUsageRecord}
                errorMessage={errorMessage}
              />
            </div>
          </div>
        )}

        {activeTab === 'templates' && (
          <TemplatesGallery onSelectTemplate={handleSelectTemplate} />
        )}

        {activeTab === 'dashboard' && (
          <UsageDashboard
            logs={usageLogs}
            totalTokens={totalTokens}
            totalCostUsd={totalCostUsd}
            remainingCreditsUsd={remainingCredits}
            totalTokensSaved={totalTokensSaved}
            overallEfficiencyPercentage={overallEfficiencyPercentage}
            onRefresh={loadData}
            isLoading={isRefreshingStats}
            onApplyToStudio={handleApplyDraftFromCopilot}
          />
        )}

        {activeTab === 'drafts' && (
          <DraftsDrawer
            drafts={draftsList}
            onLoadDraft={handleLoadDraft}
            onDeleteDraft={handleDeleteDraft}
          />
        )}
      </main>

      {/* Floating AI Copilot Widget (Suggest, Optimise, Create) */}
      <AICopilotDrawer
        currentDraftContent={generatedContent}
        currentSubject={subjectLine}
        onApplyDraftToStudio={handleApplyDraftFromCopilot}
        selectedModel={selectedModel}
        onRefreshUsage={loadData}
      />
    </div>
  );
}

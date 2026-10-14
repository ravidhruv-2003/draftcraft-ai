'use client';

import React from 'react';
import { ToneSettings, TonePreset } from '@/types/draft';

interface ToneMatrixProps {
  toneSettings: ToneSettings;
  setToneSettings: React.Dispatch<React.SetStateAction<ToneSettings>>;
}

export const ToneMatrix: React.FC<ToneMatrixProps> = ({ toneSettings, setToneSettings }) => {
  const tonePresets: { id: TonePreset; label: string; desc: string; formality: number; directness: number }[] = [
    { id: 'formal', label: 'Formal', desc: 'Standard business & official', formality: 4, directness: 3 },
    { id: 'executive', label: 'Executive', desc: 'Authoritative & high-level', formality: 5, directness: 4 },
    { id: 'friendly', label: 'Friendly', desc: 'Warm & approachable', formality: 2, directness: 2 },
    { id: 'assertive', label: 'Assertive', desc: 'Firm, direct & decisive', formality: 4, directness: 5 },
    { id: 'urgent', label: 'Urgent', desc: 'Time-sensitive with clear deadlines', formality: 3, directness: 5 },
    { id: 'empathetic', label: 'Empathetic', desc: 'Understanding & considerate', formality: 3, directness: 2 },
  ];

  return (
    <div className="space-y-3.5">
      <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
        Tone Presets & Nuance
      </label>

      {/* Preset Badges Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {tonePresets.map((preset) => (
          <button
            key={preset.id}
            type="button"
            onClick={() =>
              setToneSettings((prev) => ({
                ...prev,
                preset: preset.id,
                formality: preset.formality,
                directness: preset.directness,
              }))
            }
            className={`text-left p-2.5 rounded-xl border transition-all ${
              toneSettings.preset === preset.id
                ? 'bg-sky-500/10 border-sky-500 text-sky-200 ring-1 ring-sky-500/50'
                : 'bg-slate-800/60 border-slate-700/70 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <div className="text-xs font-semibold">{preset.label}</div>
            <div className="text-[10px] text-slate-400 truncate mt-0.5">{preset.desc}</div>
          </button>
        ))}
      </div>

      {/* Formality & Directness Sliders */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
        <div>
          <div className="flex justify-between text-[11px] mb-1">
            <span className="text-slate-400">Formality Level</span>
            <span className="font-semibold text-sky-400">{toneSettings.formality}/5</span>
          </div>
          <input
            type="range"
            min="1"
            max="5"
            value={toneSettings.formality}
            onChange={(e) =>
              setToneSettings((prev) => ({ ...prev, formality: Number(e.target.value) }))
            }
            className="w-full accent-sky-500 bg-slate-700 h-1.5 rounded-lg appearance-none cursor-pointer"
          />
        </div>

        <div>
          <div className="flex justify-between text-[11px] mb-1">
            <span className="text-slate-400">Directness / Urgency</span>
            <span className="font-semibold text-sky-400">{toneSettings.directness}/5</span>
          </div>
          <input
            type="range"
            min="1"
            max="5"
            value={toneSettings.directness}
            onChange={(e) =>
              setToneSettings((prev) => ({ ...prev, directness: Number(e.target.value) }))
            }
            className="w-full accent-sky-500 bg-slate-700 h-1.5 rounded-lg appearance-none cursor-pointer"
          />
        </div>
      </div>

      {/* Target Length Toggle Chips */}
      <div className="flex items-center space-x-2 pt-1">
        <span className="text-[11px] text-slate-400">Length:</span>
        {(['concise', 'balanced', 'detailed'] as const).map((len) => (
          <button
            key={len}
            type="button"
            onClick={() => setToneSettings((prev) => ({ ...prev, length: len }))}
            className={`text-xs px-3 py-1 rounded-lg font-medium capitalize transition-all ${
              toneSettings.length === len
                ? 'bg-slate-700 text-white border border-slate-600 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {len}
          </button>
        ))}
      </div>
    </div>
  );
};

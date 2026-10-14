'use client';

import React from 'react';
import { TemplateItem } from '@/types/draft';
import { ArrowRight, Briefcase, UserCheck, MessageSquare, Scale, HeartHandshake } from 'lucide-react';

interface TemplateCardProps {
  template: TemplateItem;
  onSelect: (tpl: TemplateItem) => void;
}

export const TemplateCard: React.FC<TemplateCardProps> = ({ template, onSelect }) => {
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Job Search':
        return <UserCheck className="w-4 h-4 text-sky-400" />;
      case 'Workplace':
        return <Briefcase className="w-4 h-4 text-indigo-400" />;
      case 'Client Outreach':
        return <MessageSquare className="w-4 h-4 text-purple-400" />;
      case 'Formal / Legal':
        return <Scale className="w-4 h-4 text-amber-400" />;
      default:
        return <HeartHandshake className="w-4 h-4 text-emerald-400" />;
    }
  };

  return (
    <div
      onClick={() => onSelect(template)}
      className="group bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-sky-500/50 p-5 rounded-2xl transition-all duration-200 cursor-pointer shadow-lg hover:shadow-sky-500/10 flex flex-col justify-between"
    >
      <div>
        <div className="flex items-center justify-between mb-3">
          <span className="flex items-center space-x-1.5 text-xs font-semibold bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 text-slate-300">
            {getCategoryIcon(template.category)}
            <span>{template.category}</span>
          </span>
          <span className="text-[10px] uppercase font-bold tracking-wider text-sky-400 bg-sky-500/10 border border-sky-500/20 px-2 py-0.5 rounded">
            {template.defaultTone}
          </span>
        </div>

        <h3 className="font-semibold text-base text-slate-100 group-hover:text-sky-300 transition-colors">
          {template.title}
        </h3>
        <p className="text-xs text-slate-400 mt-2 leading-relaxed">
          {template.description}
        </p>
      </div>

      <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs font-medium text-slate-400 group-hover:text-sky-400 transition-colors">
        <span>Audience: {template.recipientRole}</span>
        <div className="flex items-center space-x-1 group-hover:translate-x-1 transition-transform">
          <span>Use Blueprint</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </div>
      </div>
    </div>
  );
};

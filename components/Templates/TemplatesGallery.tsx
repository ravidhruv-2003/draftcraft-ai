'use client';

import React from 'react';
import { TemplateItem } from '@/types/draft';
import { BookOpen } from 'lucide-react';
import { TemplateCard } from './TemplateCard';

interface TemplatesGalleryProps {
  onSelectTemplate: (template: TemplateItem) => void;
}

export const starterTemplates: TemplateItem[] = [
  {
    id: 'tpl_1',
    title: 'Follow-Up After Final Interview',
    category: 'Job Search',
    description: 'A courteous and impactful follow-up reiterating excitement, key qualifications, and next steps.',
    draftType: 'follow_up',
    samplePrompt: 'Draft a professional follow-up email after my final round interview for the Senior Full-Stack Engineer position. Express genuine appreciation for the interviewers time, recap my enthusiasm for building scalable web platforms, and ask about the expected hiring timeline.',
    defaultTone: 'formal',
    recipientRole: 'Hiring Manager & Recruiter',
  },
  {
    id: 'tpl_2',
    title: 'Project Delivery Delay Notice',
    category: 'Workplace',
    description: 'Proactively communicates a 2-day timeline extension with transparency, root cause, and mitigation steps.',
    draftType: 'email',
    samplePrompt: 'Notify my manager and the client that our scheduled Friday release needs to be postponed to Tuesday due to rigorous end-to-end security audits. Highlight that all core features are ready and the extra time guarantees a flawless launch.',
    defaultTone: 'executive',
    recipientRole: 'Department Lead & Client Stakeholders',
  },
  {
    id: 'tpl_3',
    title: 'Cold Client Pitch & Outreach',
    category: 'Client Outreach',
    description: 'A high-converting, concise pitch introducing modern AI & web development services.',
    draftType: 'outreach',
    samplePrompt: 'Write a compelling cold outreach email to the VP of Engineering at an e-commerce company, offering custom AI workflow automation and Next.js performance optimization that increases conversion rates. Include a clear call-to-action for a 15-minute intro chat.',
    defaultTone: 'persuasive',
    recipientRole: 'VP of Engineering / Decision Maker',
  },
  {
    id: 'tpl_4',
    title: 'Formal Resignation Letter (2-Week Notice)',
    category: 'Formal / Legal',
    description: 'A respectful, legally sound 2-week notice letter expressing gratitude and offering transition support.',
    draftType: 'formal_letter',
    samplePrompt: 'Draft a formal 2-week notice resignation letter to HR and my direct manager. State my final working day clearly, express gratitude for mentorship and growth over the past 2 years, and offer full assistance during the knowledge handover.',
    defaultTone: 'formal',
    recipientRole: 'HR Director & Direct Supervisor',
  },
  {
    id: 'tpl_5',
    title: 'Salary & Compensation Review Request',
    category: 'Workplace',
    description: 'Assertive yet diplomatic proposal outlining achievements, market benchmarks, and requesting compensation review.',
    draftType: 'email',
    samplePrompt: 'Write an email to my manager requesting a compensation adjustment during the upcoming quarterly review. Point out that I spearheaded the AI integration project, reduced server costs by 35%, and exceeded all sprint KPIs.',
    defaultTone: 'assertive',
    recipientRole: 'Engineering Manager',
  },
  {
    id: 'tpl_6',
    title: 'Apology & Service Incident Resolution',
    category: 'Client Outreach',
    description: 'Empathetic and structured apology addressing a recent service disruption with corrective actions.',
    draftType: 'apology',
    samplePrompt: 'Draft an apology letter to our enterprise customers regarding a 45-minute service outage yesterday. Explain that database failover completed successfully, no customer data was compromised, and outline 3 infrastructure improvements to prevent future occurrences.',
    defaultTone: 'empathetic',
    recipientRole: 'Valued Enterprise Customers',
  },
];

export const TemplatesGallery: React.FC<TemplatesGalleryProps> = ({ onSelectTemplate }) => {
  return (
    <div className="space-y-6 max-w-7xl mx-auto text-white">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2">
            <BookOpen className="w-5 h-5 text-sky-400" />
            <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-sky-400 to-indigo-400 bg-clip-text text-transparent">
              Pre-Engineered Letter & Email Templates
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Curated prompt blueprints with pre-tuned tone parameters and recipient framing. Click any template to immediately load it into the Studio.
          </p>
        </div>
        <span className="text-xs bg-sky-500/10 text-sky-400 border border-sky-500/30 px-3 py-1 rounded-full font-medium hidden sm:inline-block">
          {starterTemplates.length} Templates Ready
        </span>
      </div>

      {/* Grid of Modular Template Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {starterTemplates.map((tpl) => (
          <TemplateCard key={tpl.id} template={tpl} onSelect={onSelectTemplate} />
        ))}
      </div>
    </div>
  );
};

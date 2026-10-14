'use client';

import React from 'react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subValue?: string;
  icon: React.ReactNode;
  iconBgColor?: string;
  bottomSlot?: React.ReactNode;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subValue,
  icon,
  iconBgColor = 'bg-sky-500/10 text-sky-400',
  bottomSlot,
}) => {
  return (
    <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl relative overflow-hidden shadow-lg flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{title}</span>
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${iconBgColor}`}>
            {icon}
          </div>
        </div>

        <div className="mt-3">
          <div className="text-2xl font-extrabold text-white tracking-tight">{value}</div>
          {subValue && <div className="text-xs text-slate-400 mt-0.5">{subValue}</div>}
        </div>
      </div>

      {bottomSlot && <div className="mt-4 pt-3 border-t border-slate-800/80">{bottomSlot}</div>}
    </div>
  );
};

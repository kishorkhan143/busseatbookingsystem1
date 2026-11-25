import React from 'react';
import { Armchair, Disc } from 'lucide-react';

export const SeatLegend: React.FC = () => {
  return (
    <div className="liquid-glass-card rounded-2xl px-4 py-3 transition-colors">
      <div className="flex flex-wrap items-center justify-between sm:justify-around gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-500/12 border border-emerald-200 dark:border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <Armchair className="w-4 h-4" />
          </div>
          <div>
            <span className="font-medium text-slate-800 dark:text-slate-200 block leading-tight">
              Available
            </span>
            <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
              ₹150
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-cyan-600 dark:bg-cyan-500 flex items-center justify-center text-white dark:text-slate-950">
            <Armchair className="w-4 h-4" />
          </div>
          <div>
            <span className="font-medium text-slate-800 dark:text-slate-200 block leading-tight">
              Selected
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              Your choice
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-white/[0.05] border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-400 dark:text-slate-500">
            <Armchair className="w-4 h-4" />
          </div>
          <div>
            <span className="font-medium text-slate-600 dark:text-slate-400 block leading-tight">
              Booked
            </span>
            <span className="text-[11px] text-slate-400 dark:text-slate-500">
              Unavailable
            </span>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-2 text-slate-500 dark:text-slate-400">
          <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-white/[0.05] border border-slate-200 dark:border-white/10 flex items-center justify-center text-cyan-600 dark:text-cyan-400">
            <Disc className="w-4 h-4" />
          </div>
          <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
            Driver cabin
          </span>
        </div>
      </div>
    </div>
  );
};

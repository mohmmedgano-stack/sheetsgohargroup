import React from 'react';

/**
 * Shimmer pulse base class with theme-aware styling
 */
const shimmerBase = "animate-pulse rounded-lg bg-slate-200/80 dark:bg-slate-950/60";

/**
 * Specialized lightweight skeleton for the Spreadsheet View
 * Matches the exact layout of SpreadsheetView: search bar, KPI metrics, table header, and data rows.
 */
export const SpreadsheetSkeleton: React.FC = () => {
  return (
    <div className="w-full space-y-4 text-right" aria-busy="true" aria-label="جاري تحميل جدول شيت العملاء...">
      {/* Top Search and Controls Bar */}
      <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-900/60 bg-white/70 dark:bg-[#000000]/70 backdrop-blur-sm flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="w-full md:w-80 h-10 rounded-xl bg-slate-200 dark:bg-slate-950/70 animate-pulse" />
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto justify-end">
          <div className="w-20 h-9 rounded-xl bg-slate-200 dark:bg-slate-950/60 animate-pulse" />
          <div className="w-24 h-9 rounded-xl bg-slate-200 dark:bg-slate-950/60 animate-pulse" />
          <div className="w-28 h-9 rounded-xl bg-[#A8CCC0]/70 dark:bg-[#2A6B5C]/20 border border-[#4F9282]/30 animate-pulse" />
        </div>
      </div>

      {/* 4 KPI Summary Pill Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map(idx => (
          <div
            key={idx}
            className="p-3 rounded-xl border border-slate-200 dark:border-slate-900/50 bg-white/60 dark:bg-[#061B13]/60 backdrop-blur-sm flex items-center justify-between"
          >
            <div className="space-y-1.5 flex-1">
              <div className="w-16 h-3 rounded bg-slate-200 dark:bg-slate-900/60 animate-pulse" />
              <div className="w-10 h-6 rounded bg-slate-300 dark:bg-slate-800/60 animate-pulse" />
            </div>
            <div className="w-8 h-8 rounded-lg bg-[#4F9282]/20 dark:bg-[#4F9282]/10 animate-pulse" />
          </div>
        ))}
      </div>

      {/* Spreadsheet Table Skeleton */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-900/70 bg-white/80 dark:bg-[#000000]/90 backdrop-blur-md overflow-hidden shadow-sm">
        {/* Table Header */}
        <div className="p-3.5 border-b border-slate-200 dark:border-slate-900/60 bg-slate-100/80 dark:bg-[#04140E] flex items-center justify-between gap-4">
          <div className="w-8 h-4 rounded bg-slate-300 dark:bg-slate-900/70 animate-pulse" />
          <div className="w-28 h-4 rounded bg-slate-300 dark:bg-slate-900/70 animate-pulse" />
          <div className="w-24 h-4 rounded bg-slate-300 dark:bg-slate-900/70 animate-pulse hidden sm:block" />
          <div className="w-20 h-4 rounded bg-slate-300 dark:bg-slate-900/70 animate-pulse hidden md:block" />
          <div className="w-20 h-4 rounded bg-slate-300 dark:bg-slate-900/70 animate-pulse hidden lg:block" />
          <div className="w-16 h-4 rounded bg-slate-300 dark:bg-slate-900/70 animate-pulse" />
          <div className="w-16 h-4 rounded bg-slate-300 dark:bg-slate-900/70 animate-pulse" />
        </div>

        {/* 6 Mock Data Rows */}
        <div className="divide-y divide-slate-100 dark:divide-slate-950/60">
          {[1, 2, 3, 4, 5, 6].map(row => (
            <div key={row} className="p-3.5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2.5 flex-1 min-w-0">
                <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-900/70 shrink-0 animate-pulse" />
                <div className="space-y-1">
                  <div className="w-28 sm:w-36 h-3.5 rounded bg-slate-300 dark:bg-slate-800/70 animate-pulse" />
                  <div className="w-20 h-2.5 rounded bg-slate-200 dark:bg-slate-950 animate-pulse" />
                </div>
              </div>
              <div className="w-24 h-4 rounded bg-slate-200 dark:bg-slate-900/50 animate-pulse hidden sm:block" />
              <div className="w-20 h-5 rounded-full bg-slate-500/20 dark:bg-slate-500/10 animate-pulse hidden md:block" />
              <div className="w-16 h-5 rounded-full bg-[#2A6B5C]/20 dark:bg-[#4F9282]/10 animate-pulse" />
              <div className="flex items-center gap-1.5">
                <div className="w-7 h-7 rounded-lg bg-slate-200 dark:bg-slate-900/60 animate-pulse" />
                <div className="w-7 h-7 rounded-lg bg-slate-200 dark:bg-slate-900/60 animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/**
 * Specialized lightweight skeleton for the Admin & Reports Views (Dashboard / Users)
 * Matches dashboard analytics cards, charts wireframe, and team grid layout.
 */
export const AdminSkeleton: React.FC = () => {
  return (
    <div className="w-full space-y-5 text-right" aria-busy="true" aria-label="جاري تحميل لوحة الإدارة والتقارير...">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl border border-slate-200 dark:border-slate-900/60 bg-white/70 dark:bg-[#000000]/70 backdrop-blur-sm">
        <div className="space-y-1.5">
          <div className="w-40 h-5 rounded-lg bg-slate-300 dark:bg-slate-800/70 animate-pulse" />
          <div className="w-56 h-3 rounded bg-slate-200 dark:bg-slate-950 animate-pulse" />
        </div>
        <div className="flex items-center gap-2">
          <div className="w-28 h-9 rounded-xl bg-slate-200 dark:bg-slate-950/70 animate-pulse" />
          <div className="w-24 h-9 rounded-xl bg-[#A8CCC0]/70 dark:bg-[#2A6B5C]/20 animate-pulse" />
        </div>
      </div>

      {/* 4 Big Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(idx => (
          <div
            key={idx}
            className="p-4 rounded-2xl border border-slate-200 dark:border-slate-900/60 bg-white/80 dark:bg-[#061B13]/80 backdrop-blur-sm space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="w-24 h-3.5 rounded bg-slate-200 dark:bg-slate-900/60 animate-pulse" />
              <div className="w-8 h-8 rounded-xl bg-[#4F9282]/20 dark:bg-[#2A6B5C]/10 animate-pulse" />
            </div>
            <div className="w-20 h-7 rounded bg-slate-300 dark:bg-slate-800/80 animate-pulse" />
            <div className="w-32 h-2.5 rounded bg-slate-200 dark:bg-slate-950 animate-pulse" />
          </div>
        ))}
      </div>

      {/* Analytics Charts Wireframe (Side-by-side or stacked) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left Chart Card: Bar Chart Simulation */}
        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-900/60 bg-white/80 dark:bg-[#061B13]/80 backdrop-blur-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="w-36 h-4 rounded bg-slate-300 dark:bg-slate-800/70 animate-pulse" />
            <div className="w-16 h-4 rounded bg-slate-200 dark:bg-slate-950 animate-pulse" />
          </div>
          {/* Simulated chart bars */}
          <div className="h-48 flex items-end justify-between gap-3 pt-6 px-2">
            {[45, 70, 30, 90, 60, 85, 40].map((h, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                <div
                  style={{ height: `${h}%` }}
                  className="w-full max-w-[28px] rounded-t-md bg-gradient-to-t from-[#2A6B5C]/30 to-[#2A6B5C]/70 dark:from-slate-900/40 dark:to-[#2A6B5C]/60 animate-pulse"
                />
                <div className="w-6 h-2 rounded bg-slate-200 dark:bg-slate-950" />
              </div>
            ))}
          </div>
        </div>

        {/* Right Chart Card: Funnel / Team Performance */}
        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-900/60 bg-white/80 dark:bg-[#061B13]/80 backdrop-blur-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="w-40 h-4 rounded bg-slate-300 dark:bg-slate-800/70 animate-pulse" />
            <div className="w-20 h-4 rounded bg-slate-200 dark:bg-slate-950 animate-pulse" />
          </div>
          <div className="space-y-3 pt-2">
            {[80, 65, 45, 90].map((val, idx) => (
              <div key={idx} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="w-24 h-3 rounded bg-slate-200 dark:bg-slate-900/60 animate-pulse" />
                  <div className="w-8 h-3 rounded bg-slate-300 dark:bg-slate-800/60 animate-pulse" />
                </div>
                <div className="w-full h-3 rounded-full bg-slate-200 dark:bg-slate-950 overflow-hidden">
                  <div
                    style={{ width: `${val}%` }}
                    className="h-full rounded-full bg-[#2A6B5C]/60 dark:bg-slate-600/60 animate-pulse"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Specialized lightweight skeleton for the Projects Management View
 * Matches projects grid, banners, completion progress bars, and unit counters.
 */
export const ProjectsSkeleton: React.FC = () => {
  return (
    <div className="w-full space-y-5 text-right" aria-busy="true" aria-label="جاري تحميل المشاريع العقارية...">
      {/* Top Action Header */}
      <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-900/60 bg-white/70 dark:bg-[#000000]/70 backdrop-blur-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="space-y-1.5">
          <div className="w-36 h-5 rounded bg-slate-300 dark:bg-slate-800/70 animate-pulse" />
          <div className="w-48 h-3 rounded bg-slate-200 dark:bg-slate-950 animate-pulse" />
        </div>
        <div className="flex items-center gap-2">
          <div className="w-32 h-10 rounded-xl bg-[#4F9282]/30 dark:bg-[#2A6B5C]/20 border border-[#4F9282]/40 animate-pulse" />
        </div>
      </div>

      {/* Projects Grid Skeleton (3 columns on desktop) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map(card => (
          <div
            key={card}
            className="rounded-2xl border border-slate-200 dark:border-slate-900/60 bg-white/80 dark:bg-[#061B13]/80 backdrop-blur-sm overflow-hidden shadow-sm flex flex-col"
          >
            {/* Project Image Banner Placeholder */}
            <div className="w-full h-40 bg-slate-200 dark:bg-slate-950/80 animate-pulse relative">
              <div className="absolute top-3 right-3 w-16 h-5 rounded-full bg-slate-300/80 dark:bg-slate-900/90" />
            </div>

            {/* Project Details */}
            <div className="p-4 space-y-3.5 flex-1 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="w-3/4 h-4 rounded bg-slate-300 dark:bg-slate-800/70 animate-pulse" />
                <div className="w-1/2 h-3 rounded bg-slate-200 dark:bg-slate-950 animate-pulse" />
              </div>

              {/* Progress and Units */}
              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-950/60">
                <div className="flex items-center justify-between">
                  <div className="w-20 h-3 rounded bg-slate-200 dark:bg-slate-900/60 animate-pulse" />
                  <div className="w-10 h-3 rounded bg-slate-300 dark:bg-slate-800/60 animate-pulse" />
                </div>
                <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-950 overflow-hidden">
                  <div className="w-3/5 h-full bg-[#4F9282]/60 rounded-full animate-pulse" />
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="flex items-center gap-2 pt-2">
                <div className="flex-1 h-9 rounded-xl bg-slate-200 dark:bg-slate-900/60 animate-pulse" />
                <div className="w-9 h-9 rounded-xl bg-slate-200 dark:bg-slate-900/60 animate-pulse" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Clean, lightweight general fallback skeleton for archive, followups, or cloud sync views
 */
export const DefaultViewSkeleton: React.FC<{ label?: string }> = ({ label = 'جاري التحميل...' }) => {
  return (
    <div className="w-full p-6 space-y-4 text-center rounded-2xl border border-slate-200 dark:border-slate-900/60 bg-white/70 dark:bg-[#000000]/70 backdrop-blur-sm" aria-busy="true">
      <div className="w-10 h-10 mx-auto rounded-full border-2 border-[#2A6B5C]/20 border-t-[#2A6B5C] animate-spin mb-2" />
      <p className="text-xs font-bold text-slate-700 dark:text-[#A8CCC0]">{label}</p>
      <div className="max-w-md mx-auto space-y-2 pt-2">
        <div className="w-full h-3 rounded bg-slate-200 dark:bg-slate-950 animate-pulse" />
        <div className="w-3/4 mx-auto h-3 rounded bg-slate-200 dark:bg-slate-950 animate-pulse" />
      </div>
    </div>
  );
};

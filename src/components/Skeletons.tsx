"use client";

export function KpiSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="rounded-2xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200/60 dark:border-slate-700/60 p-5 animate-pulse"
        >
          <div className="h-3 w-24 rounded bg-slate-200 dark:bg-slate-700 mb-3" />
          <div className="h-7 w-20 rounded bg-slate-200 dark:bg-slate-700 mb-3" />
          <div className="h-4 w-16 rounded bg-slate-200 dark:bg-slate-700" />
        </div>
      ))}
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div className="rounded-2xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200/60 dark:border-slate-700/60 p-5 animate-pulse">
      <div className="h-3 w-32 rounded bg-slate-200 dark:bg-slate-700 mb-4" />
      <div className="h-[320px] rounded-xl bg-slate-100 dark:bg-slate-700/50" />
    </div>
  );
}

export function TableSkeleton() {
  return (
    <div className="rounded-2xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200/60 dark:border-slate-700/60 overflow-hidden animate-pulse">
      <div className="px-5 py-4 border-b border-slate-200/60 dark:border-slate-700/60">
        <div className="h-3 w-36 rounded bg-slate-200 dark:bg-slate-700" />
      </div>
      <div className="p-5 space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-5 rounded bg-slate-100 dark:bg-slate-700/50" />
        ))}
      </div>
    </div>
  );
}

export function InsightsSkeleton() {
  return (
    <div className="rounded-2xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200/60 dark:border-slate-700/60 overflow-hidden animate-pulse">
      <div className="px-5 py-4 border-b border-slate-200/60 dark:border-slate-700/60">
        <div className="h-3 w-28 rounded bg-slate-200 dark:bg-slate-700" />
      </div>
      <div className="p-5 space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 rounded-xl bg-slate-100 dark:bg-slate-700/50" />
        ))}
      </div>
    </div>
  );
}

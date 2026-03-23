"use client";

interface FilterBarProps {
  activeRange: number;
  onRangeChange: (days: number) => void;
}

const ranges = [
  { label: "7 ngày", value: 7 },
  { label: "14 ngày", value: 14 },
  { label: "30 ngày", value: 30 },
];

export default function FilterBar({ activeRange, onRangeChange }: FilterBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {ranges.map((r) => (
        <button
          key={r.value}
          onClick={() => onRangeChange(r.value)}
          className={`rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200 ${
            activeRange === r.value
              ? "bg-brand-600 text-white shadow-md shadow-brand-500/25"
              : "bg-white/80 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 text-slate-600 dark:text-slate-300 hover:bg-brand-50 dark:hover:bg-brand-950/30 hover:text-brand-600 dark:hover:text-brand-400"
          }`}
        >
          {r.label}
        </button>
      ))}
    </div>
  );
}

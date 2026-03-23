"use client";

import { useState, useEffect, useCallback } from "react";
import { KpiCards } from "@/components/KpiCards";
import TimeSeriesChart from "@/components/TimeSeriesChart";
import LandingPagesTable from "@/components/LandingPagesTable";
import TrafficSourcesTable from "@/components/TrafficSourcesTable";
import InsightsPanel from "@/components/InsightsPanel";
import FilterBar from "@/components/FilterBar";
import {
  KpiSkeleton,
  ChartSkeleton,
  TableSkeleton,
  InsightsSkeleton,
} from "@/components/Skeletons";

interface DashboardData {
  current: {
    totalUsers: number;
    sessions: number;
    screenPageViews: number;
    engagementRate: number;
  };
  previous: {
    totalUsers: number;
    sessions: number;
    screenPageViews: number;
    engagementRate: number;
  };
  timeSeries: {
    date: string;
    totalUsers: number;
    sessions: number;
    screenPageViews: number;
  }[];
  landingPages: {
    page: string;
    screenPageViews: number;
    totalUsers: number;
    engagementRate: number;
  }[];
  trafficSources: {
    sourceMedium: string;
    sessions: number;
    totalUsers: number;
  }[];
  dateRange: { start: string; end: string };
  previousDateRange: { start: string; end: string };
}

function formatDateRange(start: string, end: string): string {
  const opts: Intl.DateTimeFormatOptions = {
    day: "2-digit",
    month: "2-digit",
  };
  const s = new Date(start).toLocaleDateString("vi-VN", opts);
  const e = new Date(end).toLocaleDateString("vi-VN", opts);
  return `${s} — ${e}`;
}

export default function DashboardPage() {
  const [range, setRange] = useState(7);
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (days: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/ga4?range=${days}`);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || `HTTP ${res.status}`);
      }
      const json = await res.json();
      setData(json);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Không thể tải dữ liệu");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(range);
  }, [range, fetchData]);

  const handleRangeChange = (days: number) => {
    setRange(days);
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="header-glow border-b border-slate-200/60 dark:border-slate-700/40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-5">
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 text-white text-sm shadow-lg shadow-brand-500/25">
                  📊
                </span>
                Content Dashboard
              </h1>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Theo dõi hiệu suất website &amp; chiến lược nội dung
                {data && (
                  <span className="ml-2 text-xs text-slate-400 dark:text-slate-500">
                    · {formatDateRange(data.dateRange.start, data.dateRange.end)}
                  </span>
                )}
              </p>
            </div>
            <FilterBar activeRange={range} onRangeChange={handleRangeChange} />
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Error state */}
        {error && (
          <div className="rounded-2xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 p-5">
            <div className="flex items-center gap-3">
              <span className="text-xl">❌</span>
              <div>
                <p className="text-sm font-semibold text-red-800 dark:text-red-300">
                  Lỗi tải dữ liệu
                </p>
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {error}
                </p>
              </div>
              <button
                onClick={() => fetchData(range)}
                className="ml-auto rounded-xl bg-red-100 dark:bg-red-900/50 px-4 py-2 text-sm font-medium text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/70 transition-colors"
              >
                Thử lại
              </button>
            </div>
          </div>
        )}

        {/* KPI Cards */}
        {loading ? (
          <KpiSkeleton />
        ) : (
          data && <KpiCards current={data.current} previous={data.previous} />
        )}

        {/* Time Series Chart */}
        {loading ? (
          <ChartSkeleton />
        ) : (
          data && <TimeSeriesChart data={data.timeSeries} />
        )}

        {/* Tables row */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {loading ? (
            <>
              <TableSkeleton />
              <TableSkeleton />
            </>
          ) : (
            data && (
              <>
                <LandingPagesTable data={data.landingPages} />
                <TrafficSourcesTable data={data.trafficSources} />
              </>
            )
          )}
        </div>

        {/* Insights Panel */}
        {loading ? (
          <InsightsSkeleton />
        ) : (
          data && (
            <InsightsPanel
              current={data.current}
              previous={data.previous}
              landingPages={data.landingPages}
              trafficSources={data.trafficSources}
            />
          )
        )}

        {/* Footer */}
        <footer className="pt-4 pb-8 text-center">
          <p className="text-xs text-slate-400 dark:text-slate-600">
            Dữ liệu từ Google Analytics 4 · Cập nhật khi tải trang ·{" "}
            {new Date().getFullYear()}
          </p>
        </footer>
      </main>
    </div>
  );
}

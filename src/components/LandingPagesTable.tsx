"use client";

interface LandingPageRow {
  page: string;
  screenPageViews: number;
  totalUsers: number;
  engagementRate: number;
}

interface LandingPagesTableProps {
  data: LandingPageRow[];
}

export default function LandingPagesTable({ data }: LandingPagesTableProps) {
  return (
    <div className="rounded-2xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200/60 dark:border-slate-700/60 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-200/60 dark:border-slate-700/60">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Top Landing Pages
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100 dark:border-slate-700/50">
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Trang
              </th>
              <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Lượt xem
              </th>
              <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Người dùng
              </th>
              <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Tương tác
              </th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr
                key={row.page}
                className="border-b border-slate-50 dark:border-slate-700/30 hover:bg-brand-50/30 dark:hover:bg-brand-950/20 transition-colors"
              >
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-700 text-[10px] font-bold text-slate-500 dark:text-slate-400">
                      {i + 1}
                    </span>
                    <span
                      className="text-sm text-slate-700 dark:text-slate-200 truncate max-w-[280px]"
                      title={row.page}
                    >
                      {row.page}
                    </span>
                  </div>
                </td>
                <td className="px-5 py-3 text-right text-sm font-medium text-slate-900 dark:text-white tabular-nums">
                  {row.screenPageViews.toLocaleString("vi-VN")}
                </td>
                <td className="px-5 py-3 text-right text-sm text-slate-600 dark:text-slate-300 tabular-nums">
                  {row.totalUsers.toLocaleString("vi-VN")}
                </td>
                <td className="px-5 py-3 text-right">
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                      row.engagementRate >= 0.6
                        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400"
                        : row.engagementRate >= 0.3
                        ? "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400"
                        : "bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-400"
                    }`}
                  >
                    {(row.engagementRate * 100).toFixed(1)}%
                  </span>
                </td>
              </tr>
            ))}
            {data.length === 0 && (
              <tr>
                <td
                  colSpan={4}
                  className="px-5 py-8 text-center text-sm text-slate-400"
                >
                  Không có dữ liệu
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

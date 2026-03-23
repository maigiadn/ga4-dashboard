"use client";

interface TrafficSourceRow {
  sourceMedium: string;
  sessions: number;
  totalUsers: number;
}

interface TrafficSourcesTableProps {
  data: TrafficSourceRow[];
}

export default function TrafficSourcesTable({
  data,
}: TrafficSourcesTableProps) {
  const maxSessions = data.length > 0 ? data[0].sessions : 1;

  return (
    <div className="rounded-2xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200/60 dark:border-slate-700/60 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-200/60 dark:border-slate-700/60">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Top Nguồn Traffic
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100 dark:border-slate-700/50">
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Nguồn / Kênh
              </th>
              <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Phiên
              </th>
              <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Người dùng
              </th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => {
              const barWidth =
                maxSessions > 0
                  ? Math.max((row.sessions / maxSessions) * 100, 4)
                  : 0;
              return (
                <tr
                  key={row.sourceMedium}
                  className="border-b border-slate-50 dark:border-slate-700/30 hover:bg-brand-50/30 dark:hover:bg-brand-950/20 transition-colors"
                >
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-700 text-[10px] font-bold text-slate-500 dark:text-slate-400">
                        {i + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <span className="text-sm text-slate-700 dark:text-slate-200 block truncate">
                          {row.sourceMedium}
                        </span>
                        {/* Mini bar chart */}
                        <div className="mt-1 h-1 w-full rounded-full bg-slate-100 dark:bg-slate-700">
                          <div
                            className="h-1 rounded-full bg-gradient-to-r from-brand-500 to-brand-400 transition-all duration-500"
                            style={{ width: `${barWidth}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-right text-sm font-medium text-slate-900 dark:text-white tabular-nums">
                    {row.sessions.toLocaleString("vi-VN")}
                  </td>
                  <td className="px-5 py-3 text-right text-sm text-slate-600 dark:text-slate-300 tabular-nums">
                    {row.totalUsers.toLocaleString("vi-VN")}
                  </td>
                </tr>
              );
            })}
            {data.length === 0 && (
              <tr>
                <td
                  colSpan={3}
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

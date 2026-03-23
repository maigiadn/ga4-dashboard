"use client";

interface InsightsPanelProps {
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
}

interface Insight {
  icon: string;
  title: string;
  description: string;
  type: "success" | "warning" | "info" | "action";
}

function generateInsights(props: InsightsPanelProps): Insight[] {
  const { current, previous, landingPages, trafficSources } = props;
  const insights: Insight[] = [];

  // 1. Trend direction
  const userChange =
    previous.totalUsers > 0
      ? ((current.totalUsers - previous.totalUsers) / previous.totalUsers) * 100
      : 0;

  if (userChange > 5) {
    insights.push({
      icon: "📈",
      title: "Xu hướng tăng trưởng",
      description: `Traffic tăng ${userChange.toFixed(1)}% so với kỳ trước. Tiếp tục phát huy chiến lược hiện tại.`,
      type: "success",
    });
  } else if (userChange < -5) {
    insights.push({
      icon: "📉",
      title: "Traffic đang giảm",
      description: `Traffic giảm ${Math.abs(userChange).toFixed(1)}% so với kỳ trước. Cần xem xét lại chiến lược content và nguồn traffic.`,
      type: "warning",
    });
  } else {
    insights.push({
      icon: "➡️",
      title: "Traffic ổn định",
      description: `Traffic thay đổi ${userChange.toFixed(1)}% — khá ổn định so với kỳ trước.`,
      type: "info",
    });
  }

  // 2. Top page highlight
  if (landingPages.length > 0) {
    const top = landingPages[0];
    insights.push({
      icon: "⭐",
      title: "Trang nổi bật nhất",
      description: `${top.page} dẫn đầu với ${top.screenPageViews.toLocaleString("vi-VN")} lượt xem và engagement ${(top.engagementRate * 100).toFixed(1)}%.`,
      type: "success",
    });
  }

  // 3. High traffic, low engagement pages
  const weakPages = landingPages.filter(
    (p) => p.screenPageViews > 10 && p.engagementRate < 0.3
  );
  if (weakPages.length > 0) {
    const pageList = weakPages
      .slice(0, 3)
      .map((p) => p.page)
      .join(", ");
    insights.push({
      icon: "⚠️",
      title: "Traffic cao, engagement thấp",
      description: `Các trang sau có traffic nhưng tỷ lệ tương tác dưới 30%: ${pageList}. Cần cải thiện nội dung hoặc UX.`,
      type: "warning",
    });
  }

  // 4. Notable traffic source
  if (trafficSources.length > 0) {
    const topSource = trafficSources[0];
    const totalSessions = trafficSources.reduce((s, r) => s + r.sessions, 0);
    const share =
      totalSessions > 0
        ? ((topSource.sessions / totalSessions) * 100).toFixed(0)
        : "0";
    insights.push({
      icon: "🔗",
      title: "Nguồn traffic chính",
      description: `${topSource.sourceMedium} chiếm ${share}% tổng phiên (${topSource.sessions.toLocaleString("vi-VN")} phiên). ${
        parseInt(share) > 60
          ? "Nên đa dạng hóa nguồn traffic để giảm phụ thuộc."
          : "Phân bổ nguồn khá tốt."
      }`,
      type: "info",
    });
  }

  // 5. Content action suggestion
  if (landingPages.length >= 2) {
    const topEngaged = [...landingPages]
      .sort((a, b) => b.engagementRate - a.engagementRate)
      .filter((p) => p.screenPageViews >= 5)[0];

    if (topEngaged) {
      insights.push({
        icon: "💡",
        title: "Gợi ý hành động",
        description: `Trang ${topEngaged.page} có engagement cao (${(topEngaged.engagementRate * 100).toFixed(1)}%). Nên viết thêm nội dung liên quan hoặc mở rộng chủ đề này.`,
        type: "action",
      });
    }
  }

  return insights;
}

const typeStyles = {
  success:
    "border-l-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20",
  warning:
    "border-l-amber-500 bg-amber-50/50 dark:bg-amber-950/20",
  info: "border-l-brand-500 bg-brand-50/50 dark:bg-brand-950/20",
  action:
    "border-l-cyan-500 bg-cyan-50/50 dark:bg-cyan-950/20",
};

export default function InsightsPanel(props: InsightsPanelProps) {
  const insights = generateInsights(props);

  return (
    <div className="rounded-2xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200/60 dark:border-slate-700/60 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-200/60 dark:border-slate-700/60 flex items-center gap-2">
        <svg
          className="h-5 w-5 text-brand-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18"
          />
        </svg>
        <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Insight Nội dung
        </h3>
      </div>
      <div className="p-5 space-y-3">
        {insights.map((insight, i) => (
          <div
            key={i}
            className={`rounded-xl border-l-4 p-4 transition-all hover:scale-[1.01] ${typeStyles[insight.type]}`}
          >
            <div className="flex items-start gap-3">
              <span className="text-xl flex-shrink-0">{insight.icon}</span>
              <div>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  {insight.title}
                </p>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  {insight.description}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

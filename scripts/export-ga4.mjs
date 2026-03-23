import fs from "fs";
import path from "path";
import { google } from "googleapis";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, "..");

// Load env block
const envPath = path.join(rootDir, ".env.local");
if (fs.existsSync(envPath)) {
  const envFile = fs.readFileSync(envPath, "utf-8");
  envFile.split("\n").forEach(line => {
    const [key, ...vals] = line.split("=");
    if (key && vals.length > 0) {
      process.env[key.trim()] = vals.join("=").trim();
    }
  });
}

const PROPERTY_ID = process.env.GA4_PROPERTY_ID || "331725099";
const KEY_PATH = process.env.GA4_KEY_PATH || "";

async function getAnalyticsClient() {
  const keyPath = KEY_PATH.replace(/\\/g, "/");

  if (!fs.existsSync(keyPath)) {
    throw new Error(`Service account key not found at: ${keyPath}`);
  }

  const keyFile = JSON.parse(fs.readFileSync(keyPath, "utf-8"));

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: keyFile.client_email,
      private_key: keyFile.private_key,
    },
    scopes: ["https://www.googleapis.com/auth/analytics.readonly"],
  });

  return google.analyticsdata({ version: "v1beta", auth });
}

function formatDate(d) {
  return d.toISOString().split("T")[0];
}

function getDateRanges(days) {
  const now = new Date();
  const endDate = new Date(now);
  endDate.setDate(endDate.getDate() - 1);

  const startDate = new Date(endDate);
  startDate.setDate(startDate.getDate() - days + 1);

  const prevEndDate = new Date(startDate);
  prevEndDate.setDate(prevEndDate.getDate() - 1);

  const prevStartDate = new Date(prevEndDate);
  prevStartDate.setDate(prevStartDate.getDate() - days + 1);

  return {
    current: { start: formatDate(startDate), end: formatDate(endDate) },
    previous: { start: formatDate(prevStartDate), end: formatDate(prevEndDate) },
  };
}

async function fetchSummary(client, startDate, endDate) {
  const response = await client.properties.runReport({
    property: `properties/${PROPERTY_ID}`,
    requestBody: {
      dateRanges: [{ startDate, endDate }],
      metrics: [
        { name: "totalUsers" },
        { name: "sessions" },
        { name: "screenPageViews" },
        { name: "engagementRate" },
      ],
    },
  });

  const row = response.data.rows?.[0];
  const values = row?.metricValues || [];

  return {
    users: parseInt(values[0]?.value || "0", 10),
    sessions: parseInt(values[1]?.value || "0", 10),
    views: parseInt(values[2]?.value || "0", 10),
    engagementRate: parseFloat(values[3]?.value || "0"),
  };
}

async function fetchTopPages(client, startDate, endDate, limit = 20) {
  const response = await client.properties.runReport({
    property: `properties/${PROPERTY_ID}`,
    requestBody: {
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: "landingPagePlusQueryString" }],
      metrics: [
        { name: "screenPageViews" },
        { name: "totalUsers" },
        { name: "engagementRate" },
      ],
      orderBys: [
        { metric: { metricName: "screenPageViews" }, desc: true },
      ],
      limit: limit.toString(),
    },
  });

  return (response.data.rows || []).map((row) => {
    const dims = row.dimensionValues || [];
    const vals = row.metricValues || [];
    return {
      path: dims[0]?.value || "(not set)",
      views: parseInt(vals[0]?.value || "0", 10),
      users: parseInt(vals[1]?.value || "0", 10),
      engagementRate: parseFloat(vals[2]?.value || "0"),
    };
  });
}

async function fetchTopSources(client, startDate, endDate, limit = 10) {
  const response = await client.properties.runReport({
    property: `properties/${PROPERTY_ID}`,
    requestBody: {
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: "sessionSourceMedium" }],
      metrics: [
        { name: "sessions" },
        { name: "totalUsers" },
      ],
      orderBys: [
        { metric: { metricName: "sessions" }, desc: true },
      ],
      limit: limit.toString(),
    },
  });

  return (response.data.rows || []).map((row) => {
    const dims = row.dimensionValues || [];
    const vals = row.metricValues || [];
    return {
      sourceMedium: dims[0]?.value || "(not set)",
      sessions: parseInt(vals[0]?.value || "0", 10),
      users: parseInt(vals[1]?.value || "0", 10),
    };
  });
}

function calcPct(current, previous) {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Number((((current - previous) / previous) * 100).toFixed(2));
}

async function runExport() {
  const client = await getAnalyticsClient();
  const ranges = getDateRanges(30);
  
  const [current, previous, pages, sources] = await Promise.all([
    fetchSummary(client, ranges.current.start, ranges.current.end),
    fetchSummary(client, ranges.previous.start, ranges.previous.end),
    fetchTopPages(client, ranges.current.start, ranges.current.end, 20),
    fetchTopSources(client, ranges.current.start, ranges.current.end, 10),
  ]);

  const exportDir = path.join(rootDir, "exports");
  if (!fs.existsSync(exportDir)) {
    fs.mkdirSync(exportDir, { recursive: true });
  }

  // 1. summary.json
  const summary = {
    period: `${ranges.current.start} to ${ranges.current.end}`,
    comparePeriod: `${ranges.previous.start} to ${ranges.previous.end}`,
    ...current,
    usersChangePct: calcPct(current.users, previous.users),
    sessionsChangePct: calcPct(current.sessions, previous.sessions),
    viewsChangePct: calcPct(current.views, previous.views),
    engagementRateChangePct: calcPct(current.engagementRate, previous.engagementRate)
  };
  fs.writeFileSync(path.join(exportDir, "summary.json"), JSON.stringify(summary, null, 2), "utf-8");

  // 2. top-pages.json
  fs.writeFileSync(path.join(exportDir, "top-pages.json"), JSON.stringify(pages, null, 2), "utf-8");

  // 3. top-sources.json
  fs.writeFileSync(path.join(exportDir, "top-sources.json"), JSON.stringify(sources, null, 2), "utf-8");

  // 4. seo-candidates.json
  const candidates = [];
  pages.filter(p => p.views >= 5 && p.engagementRate < 0.4).forEach(p => {
    let reason = "";
    let priority = "medium";
    if (p.engagementRate < 0.2) {
      reason = "Engagement rate is extremely low (<20%). Content might not match intent.";
      priority = "high";
    } else if (p.engagementRate < 0.4) {
      reason = "Traffic is good but engagement is mediocre (<40%). Needs better hook or UI/UX.";
      priority = "medium";
    }
    candidates.push({
      path: p.path,
      views: p.views,
      users: p.users,
      engagementRate: p.engagementRate,
      reason,
      priority
    });
  });
  
  pages.filter(p => p.views >= 10 && p.engagementRate >= 0.6).forEach(p => {
    // Avoid duplicates if added above (though mutually exclusive due to conditions)
    candidates.push({
      path: p.path,
      views: p.views,
      users: p.users,
      engagementRate: p.engagementRate,
      reason: "High organic engagement page. Potential for content cluster expansion or internal linking.",
      priority: "medium"
    });
  });
  
  candidates.sort((a,b) => b.views - a.views);

  fs.writeFileSync(path.join(exportDir, "seo-candidates.json"), JSON.stringify(candidates, null, 2), "utf-8");

  // 5. insights.md
  let insights = `# Khám phá Dữ liệu GA4 (30 Ngày)\n\n`;
  if (pages.length > 0) {
    const top = pages[0];
    insights += `## Trang nổi bật nhất\n`;
    insights += `- Trang \`${top.path}\` đang dẫn đầu với ${top.views} lượt xem và ${top.users} người dùng.\n\n`;
  }
  
  const lowEng = pages.filter(p => p.views > 5 && p.engagementRate < 0.3);
  if (lowEng.length > 0) {
    insights += `## Traffic cao nhưng Engagement thấp\n`;
    lowEng.slice(0, 3).forEach(p => {
      insights += `- \`${p.path}\`: ${p.views} lượt xem, nhưng tỷ lệ tương tác chỉ ${(p.engagementRate * 100).toFixed(1)}%.\n`;
    });
    insights += `*(Hành động: Cần tối ưu lại nội dung, thêm CTA hoặc cải thiện tốc độ tải trang).* \n\n`;
  }

  if (sources.length > 0) {
    const topS = sources[0];
    insights += `## Nguồn traffic mạnh nhất\n`;
    insights += `- \`${topS.sourceMedium}\` mang lại nhiều traffic nhất với ${topS.sessions} phiên.\n\n`;
  }

  insights += `## Xu hướng tăng/giảm đáng chú ý\n`;
  if (summary.usersChangePct > 0) {
    insights += `- Số người dùng **tăng ${summary.usersChangePct}%** so với kỳ trước.\n`;
  } else if (summary.usersChangePct < 0) {
    insights += `- Số người dùng **giảm ${Math.abs(summary.usersChangePct)}%** so với kỳ trước.\n`;
  }
  if (summary.viewsChangePct > 0) {
    insights += `- Lượt xem trang **tăng ${summary.viewsChangePct}%** so với kỳ trước.\n`;
  } else if (summary.viewsChangePct < 0) {
    insights += `- Lượt xem trang **giảm ${Math.abs(summary.viewsChangePct)}%** so với kỳ trước.\n`;
  }
  
  fs.writeFileSync(path.join(exportDir, "insights.md"), insights, "utf-8");

  console.log("EXPORT SUCCESSFUL");
}

runExport().catch(err => {
  console.error(err);
  process.exit(1);
});

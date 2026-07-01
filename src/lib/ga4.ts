import * as jose from "jose";

const GA4_API = "https://analyticsdata.googleapis.com/v1beta";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const SCOPE = "https://www.googleapis.com/auth/analytics.readonly";

function getPropertyId(): string {
  const id = process.env.GA4_PROPERTY_ID;
  if (!id) {
    throw new Error(
      "Missing GA4_PROPERTY_ID. Set it in wrangler.jsonc `vars` (your own GA4 property id), or in .dev.vars for local dev."
    );
  }
  return id;
}

interface ServiceAccount {
  client_email: string;
  private_key: string;
}

function getServiceAccount(): ServiceAccount {
  const raw = process.env.GA4_SERVICE_ACCOUNT_JSON;
  if (!raw) {
    throw new Error(
      "Missing GA4_SERVICE_ACCOUNT_JSON. Set it via `wrangler secret put GA4_SERVICE_ACCOUNT_JSON` (paste the full service-account JSON), or in .dev.vars for local dev."
    );
  }
  let sa: ServiceAccount;
  try {
    sa = JSON.parse(raw);
  } catch {
    throw new Error("GA4_SERVICE_ACCOUNT_JSON is not valid JSON");
  }
  if (!sa.client_email || !sa.private_key) {
    throw new Error(
      "GA4_SERVICE_ACCOUNT_JSON is missing client_email or private_key"
    );
  }
  return sa;
}

// Cached OAuth token for the lifetime of the isolate (avoids re-signing per request).
let cachedToken: { token: string; exp: number } | null = null;

async function getAccessToken(): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  if (cachedToken && cachedToken.exp - 60 > now) {
    return cachedToken.token;
  }

  const sa = getServiceAccount();
  // jose signs RS256 with WebCrypto — works in the Workers V8 isolate.
  const key = await jose.importPKCS8(sa.private_key, "RS256");
  const assertion = await new jose.SignJWT({ scope: SCOPE })
    .setProtectedHeader({ alg: "RS256", typ: "JWT" })
    .setIssuer(sa.client_email)
    .setSubject(sa.client_email)
    .setAudience(TOKEN_URL)
    .setIssuedAt(now)
    .setExpirationTime(now + 3600)
    .sign(key);

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });

  if (!res.ok) {
    throw new Error(
      `Failed to obtain Google access token: ${res.status} ${await res.text()}`
    );
  }

  const json = (await res.json()) as {
    access_token: string;
    expires_in: number;
  };
  cachedToken = { token: json.access_token, exp: now + json.expires_in };
  return json.access_token;
}

interface GA4Row {
  dimensionValues?: { value?: string }[];
  metricValues?: { value?: string }[];
}

interface GA4ReportResponse {
  rows?: GA4Row[];
}

async function runReport(
  requestBody: Record<string, unknown>
): Promise<GA4ReportResponse> {
  const token = await getAccessToken();
  const res = await fetch(`${GA4_API}/properties/${getPropertyId()}:runReport`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  });

  if (!res.ok) {
    throw new Error(`GA4 runReport failed: ${res.status} ${await res.text()}`);
  }

  return (await res.json()) as GA4ReportResponse;
}

export interface SummaryMetrics {
  totalUsers: number;
  sessions: number;
  screenPageViews: number;
  engagementRate: number;
}

export interface TimeSeriesPoint {
  date: string;
  totalUsers: number;
  sessions: number;
  screenPageViews: number;
}

export interface LandingPageRow {
  page: string;
  screenPageViews: number;
  totalUsers: number;
  engagementRate: number;
}

export interface TrafficSourceRow {
  sourceMedium: string;
  sessions: number;
  totalUsers: number;
}

export interface DashboardData {
  current: SummaryMetrics;
  previous: SummaryMetrics;
  timeSeries: TimeSeriesPoint[];
  landingPages: LandingPageRow[];
  trafficSources: TrafficSourceRow[];
  dateRange: { start: string; end: string };
  previousDateRange: { start: string; end: string };
}

function formatDate(d: Date): string {
  return d.toISOString().split("T")[0];
}

function getDateRanges(days: number) {
  const now = new Date();
  const endDate = new Date(now);
  endDate.setDate(endDate.getDate() - 1); // yesterday (GA4 data lags)

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

export async function fetchSummaryMetrics(
  startDate: string,
  endDate: string
): Promise<SummaryMetrics> {
  const data = await runReport({
    dateRanges: [{ startDate, endDate }],
    metrics: [
      { name: "totalUsers" },
      { name: "sessions" },
      { name: "screenPageViews" },
      { name: "engagementRate" },
    ],
  });

  const row = data.rows?.[0];
  const values = row?.metricValues || [];

  return {
    totalUsers: parseInt(values[0]?.value || "0", 10),
    sessions: parseInt(values[1]?.value || "0", 10),
    screenPageViews: parseInt(values[2]?.value || "0", 10),
    engagementRate: parseFloat(values[3]?.value || "0"),
  };
}

export async function fetchTimeSeries(
  startDate: string,
  endDate: string
): Promise<TimeSeriesPoint[]> {
  const data = await runReport({
    dateRanges: [{ startDate, endDate }],
    dimensions: [{ name: "date" }],
    metrics: [
      { name: "totalUsers" },
      { name: "sessions" },
      { name: "screenPageViews" },
    ],
    orderBys: [{ dimension: { dimensionName: "date" } }],
  });

  return (data.rows || []).map((row) => {
    const dims = row.dimensionValues || [];
    const vals = row.metricValues || [];
    const raw = dims[0]?.value || "00000000";
    const dateStr = `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`;
    return {
      date: dateStr,
      totalUsers: parseInt(vals[0]?.value || "0", 10),
      sessions: parseInt(vals[1]?.value || "0", 10),
      screenPageViews: parseInt(vals[2]?.value || "0", 10),
    };
  });
}

export async function fetchTopLandingPages(
  startDate: string,
  endDate: string,
  topN: number = 10
): Promise<LandingPageRow[]> {
  const data = await runReport({
    dateRanges: [{ startDate, endDate }],
    dimensions: [{ name: "landingPagePlusQueryString" }],
    metrics: [
      { name: "screenPageViews" },
      { name: "totalUsers" },
      { name: "engagementRate" },
    ],
    orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
    limit: topN.toString(),
  });

  return (data.rows || []).map((row) => {
    const dims = row.dimensionValues || [];
    const vals = row.metricValues || [];
    return {
      page: dims[0]?.value || "(not set)",
      screenPageViews: parseInt(vals[0]?.value || "0", 10),
      totalUsers: parseInt(vals[1]?.value || "0", 10),
      engagementRate: parseFloat(vals[2]?.value || "0"),
    };
  });
}

export async function fetchTopTrafficSources(
  startDate: string,
  endDate: string,
  topN: number = 10
): Promise<TrafficSourceRow[]> {
  const data = await runReport({
    dateRanges: [{ startDate, endDate }],
    dimensions: [{ name: "sessionSourceMedium" }],
    metrics: [{ name: "sessions" }, { name: "totalUsers" }],
    orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
    limit: topN.toString(),
  });

  return (data.rows || []).map((row) => {
    const dims = row.dimensionValues || [];
    const vals = row.metricValues || [];
    return {
      sourceMedium: dims[0]?.value || "(not set)",
      sessions: parseInt(vals[0]?.value || "0", 10),
      totalUsers: parseInt(vals[1]?.value || "0", 10),
    };
  });
}

export async function fetchDashboardData(
  days: number = 7
): Promise<DashboardData> {
  const topN = parseInt(process.env.GA4_TOP_N || "10", 10);
  const ranges = getDateRanges(days);

  const [current, previous, timeSeries, landingPages, trafficSources] =
    await Promise.all([
      fetchSummaryMetrics(ranges.current.start, ranges.current.end),
      fetchSummaryMetrics(ranges.previous.start, ranges.previous.end),
      fetchTimeSeries(ranges.current.start, ranges.current.end),
      fetchTopLandingPages(ranges.current.start, ranges.current.end, topN),
      fetchTopTrafficSources(ranges.current.start, ranges.current.end, topN),
    ]);

  return {
    current,
    previous,
    timeSeries,
    landingPages,
    trafficSources,
    dateRange: ranges.current,
    previousDateRange: ranges.previous,
  };
}

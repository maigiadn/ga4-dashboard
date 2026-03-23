import { google } from "googleapis";
import fs from "fs";
import path from "path";

const PROPERTY_ID = process.env.GA4_PROPERTY_ID || "331725099";
const KEY_PATH = process.env.GA4_KEY_PATH || "";

function getAnalyticsClient() {
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
  const client = getAnalyticsClient();

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
  const client = getAnalyticsClient();

  const response = await client.properties.runReport({
    property: `properties/${PROPERTY_ID}`,
    requestBody: {
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: "date" }],
      metrics: [
        { name: "totalUsers" },
        { name: "sessions" },
        { name: "screenPageViews" },
      ],
      orderBys: [{ dimension: { dimensionName: "date" } }],
    },
  });

  return (response.data.rows || []).map((row) => {
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
  const client = getAnalyticsClient();

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
      limit: topN.toString(),
    },
  });

  return (response.data.rows || []).map((row) => {
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
  const client = getAnalyticsClient();

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
      limit: topN.toString(),
    },
  });

  return (response.data.rows || []).map((row) => {
    const dims = row.dimensionValues || [];
    const vals = row.metricValues || [];
    return {
      sourceMedium: dims[0]?.value || "(not set)",
      sessions: parseInt(vals[0]?.value || "0", 10),
      totalUsers: parseInt(vals[1]?.value || "0", 10),
    };
  });
}

export async function fetchDashboardData(days: number = 7): Promise<DashboardData> {
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

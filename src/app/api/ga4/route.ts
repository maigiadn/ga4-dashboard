import { NextResponse } from "next/server";
import { fetchDashboardData } from "@/lib/ga4";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const range = parseInt(searchParams.get("range") || "7", 10);

    // Validate range
    const validRanges = [7, 14, 30];
    const days = validRanges.includes(range) ? range : 7;

    const data = await fetchDashboardData(days);

    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error("GA4 API Error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to fetch GA4 data";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { fetchMetaAdsInsights } from "../metaAds";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function formatDateInput(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getDefaultDateRange() {
  const end = new Date();
  const start = new Date(end);
  start.setDate(end.getDate() - 6);

  return {
    startDate: formatDateInput(start),
    endDate: formatDateInput(end)
  };
}

export async function GET(request: NextRequest) {
  const defaults = getDefaultDateRange();
  const startDate =
    request.nextUrl.searchParams.get("start_date") ?? defaults.startDate;
  const endDate = request.nextUrl.searchParams.get("end_date") ?? defaults.endDate;
  const level = request.nextUrl.searchParams.get("level") ?? "campaign";
  const adAccountId = request.nextUrl.searchParams.get("ad_account_id");

  if (startDate > endDate) {
    return NextResponse.json(
      { error: "Start date must be before or equal to end date" },
      { status: 400 }
    );
  }

  try {
    const payload = await fetchMetaAdsInsights({
      adAccountId,
      startDate,
      endDate,
      level
    });

    return NextResponse.json(payload);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

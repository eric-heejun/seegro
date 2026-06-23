import { NextRequest, NextResponse } from "next/server";
import { getYesterdayKstDate } from "@/lib/insights";
import { createAndSaveDailyInsightReport } from "@/lib/dailyInsightReport";

export async function POST(request: NextRequest) {
  const reportDate =
    request.nextUrl.searchParams.get("date") ?? getYesterdayKstDate();

  try {
    const { report, stored } = await createAndSaveDailyInsightReport(
      request,
      reportDate
    );

    return NextResponse.json({
      report,
      cached: false,
      rebuilt: true,
      stored
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Daily insight rebuild failed"
      },
      { status: 500 }
    );
  }
}

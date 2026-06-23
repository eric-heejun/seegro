import { NextRequest, NextResponse } from "next/server";
import { getYesterdayKstDate } from "@/lib/insights";
import {
  createAndSaveDailyInsightReport,
  getStoredDailyInsightReport
} from "@/lib/dailyInsightReport";

export async function GET(request: NextRequest) {
  const reportDate =
    request.nextUrl.searchParams.get("date") ?? getYesterdayKstDate();

  try {
    const storedReport = await getStoredDailyInsightReport(reportDate);
    if (storedReport) {
      return NextResponse.json({
        report: storedReport,
        cached: true,
        stored: true
      });
    }

    const { report, stored } = await createAndSaveDailyInsightReport(
      request,
      reportDate
    );

    return NextResponse.json({
      report,
      cached: false,
      stored
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Daily insight report failed"
      },
      { status: 500 }
    );
  }
}

import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import {
  buildDailyInsightReport,
  DailyInsightReport,
  getYesterdayKstDate,
  InsightOrder
} from "@/lib/insights";
import {
  isCafe24TokenStoreConfigured,
  redisCommand
} from "@/lib/cafe24TokenStore";

type OrdersPayload = {
  orders?: InsightOrder[];
  error?: string;
};

const INSIGHT_KEY_PREFIX =
  process.env.INSIGHT_REPORT_STORE_KEY_PREFIX ?? "seegro:insights:daily";

function getInsightKey(reportDate: string) {
  return `${INSIGHT_KEY_PREFIX}:${reportDate}`;
}

function getOrigin(request: NextRequest) {
  return `${request.nextUrl.protocol}//${request.nextUrl.host}`;
}

export async function getStoredDailyInsightReport(reportDate: string) {
  if (!isCafe24TokenStoreConfigured()) {
    return null;
  }

  const value = await redisCommand<string | null>([
    "GET",
    getInsightKey(reportDate)
  ]);
  return value ? (JSON.parse(value) as DailyInsightReport) : null;
}

export async function saveDailyInsightReport(report: DailyInsightReport) {
  if (!isCafe24TokenStoreConfigured()) {
    return false;
  }

  await redisCommand<string>([
    "SET",
    getInsightKey(report.reportDate),
    JSON.stringify(report)
  ]);
  return true;
}

async function fetchOrdersForReport(request: NextRequest, reportDate: string) {
  const params = new URLSearchParams({
    shop_no: "all",
    start_date: reportDate,
    end_date: reportDate,
    limit: "100",
    max_pages: "20"
  });
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((cookie) => `${cookie.name}=${cookie.value}`)
    .join("; ");
  const response = await fetch(
    `${getOrigin(request)}/api/cafe24/orders?${params}`,
    {
      headers: cookieHeader ? { cookie: cookieHeader } : undefined,
      cache: "no-store"
    }
  );
  const payload = (await response.json()) as OrdersPayload;

  if (!response.ok || !Array.isArray(payload.orders)) {
    throw new Error(
      payload.error ??
        `Daily insight orders request failed: ${response.status} ${response.statusText}`
    );
  }

  return payload.orders;
}

export async function createAndSaveDailyInsightReport(
  request: NextRequest,
  reportDate = getYesterdayKstDate()
) {
  const orders = await fetchOrdersForReport(request, reportDate);
  const report = buildDailyInsightReport({ reportDate, orders });
  const stored = await saveDailyInsightReport(report);

  return {
    report,
    stored
  };
}

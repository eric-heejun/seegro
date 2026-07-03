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
import { fetchMetaAdsInsights } from "@/lib/metaAds";

type OrdersPayload = {
  orders?: InsightOrder[];
  error?: string;
};

const INSIGHT_KEY_PREFIX =
  process.env.INSIGHT_REPORT_STORE_KEY_PREFIX ?? "seegro:insights:daily";

function getInsightKey(reportDate: string) {
  return `${INSIGHT_KEY_PREFIX}:${reportDate}`;
}

function hasCurrentSummaryFields(report: DailyInsightReport) {
  return (
    Object.prototype.hasOwnProperty.call(report.summary, "adSpend") &&
    Object.prototype.hasOwnProperty.call(report.summary, "marginAfterAds")
  );
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
  if (!value) {
    return null;
  }

  const report = JSON.parse(value) as DailyInsightReport;
  return hasCurrentSummaryFields(report) ? report : null;
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

async function fetchAdSpendForReport(reportDate: string) {
  try {
    const payload = await fetchMetaAdsInsights({
      startDate: reportDate,
      endDate: reportDate,
      level: "campaign"
    });

    return {
      adSpend: payload.summary.spend,
      adSpendError: undefined
    };
  } catch (error) {
    return {
      adSpend: null,
      adSpendError:
        error instanceof Error ? error.message : "Meta ads request failed"
    };
  }
}

export async function createAndSaveDailyInsightReport(
  request: NextRequest,
  reportDate = getYesterdayKstDate()
) {
  const [orders, adSpendResult] = await Promise.all([
    fetchOrdersForReport(request, reportDate),
    fetchAdSpendForReport(reportDate)
  ]);
  const report = buildDailyInsightReport({
    reportDate,
    orders,
    ...adSpendResult
  });
  const stored = await saveDailyInsightReport(report);

  return {
    report,
    stored
  };
}

import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getTodayKstDate() {
  const kstNow = new Date(Date.now() + 9 * 60 * 60 * 1000);
  return kstNow.toISOString().slice(0, 10);
}

function getOrigin(request: NextRequest) {
  return `${request.nextUrl.protocol}//${request.nextUrl.host}`;
}

function getStringField(record: Record<string, unknown>, key: string) {
  const value = record[key];
  return typeof value === "string" && value.trim() ? value.trim() : "";
}

function getPayloadMessage(payload: unknown): string {
  if (!payload || typeof payload !== "object") {
    return typeof payload === "string" ? payload : "";
  }

  const record = payload as Record<string, unknown>;
  return (
    getStringField(record, "message") ||
    getStringField(record, "error") ||
    getStringField(record, "detail") ||
    getPayloadMessage(record.payload) ||
    getPayloadMessage(record.data)
  );
}

export async function POST(request: NextRequest) {
  const date = getTodayKstDate();
  const params = new URLSearchParams({
    start_date: date,
    end_date: date
  });

  try {
    const response = await fetch(`${getOrigin(request)}/api/naver/orders?${params}`, {
      cache: "no-store"
    });
    const payload = await response.json();

    if (!response.ok) {
      return NextResponse.json({
        ok: false,
        message: getPayloadMessage(payload) || "네이버 주문 조회 테스트에 실패했습니다.",
        status: response.status,
        payload
      });
    }

    return NextResponse.json({
      ok: true,
      message: "네이버 주문 조회 테스트에 성공했습니다.",
      date,
      orderCount: Array.isArray(payload.orders) ? payload.orders.length : 0,
      rawCount: typeof payload.raw_count === "number" ? payload.raw_count : 0
    });
  } catch (error) {
    return NextResponse.json({
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "네이버 주문 조회 테스트 중 알 수 없는 오류가 발생했습니다."
    });
  }
}

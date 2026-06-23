import { NextResponse } from "next/server";
import {
  checkNaverProxyHealth,
  getNaverEnvironmentStatus
} from "@/lib/naver";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const environment = getNaverEnvironmentStatus();
  const proxy = await checkNaverProxyHealth();
  const connected = environment.readyForProxyCall && proxy.ok;

  return NextResponse.json({
    connected,
    message: connected
      ? "네이버 연결 준비가 완료되었습니다."
      : environment.readyForProxyCall
        ? proxy.message
        : "네이버 연결 설정이 필요합니다.",
    environment,
    proxy,
    issues: [...environment.issues, ...(proxy.ok ? [] : [proxy.message])]
  });
}

import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import {
  decodeState,
  exchangeCodeForToken,
  getRedirectUri
} from "@/lib/cafe24";

type Cafe24OAuthState = {
  mall_id: string;
  nonce: string;
  issued_at: string;
};

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const stateValue = request.nextUrl.searchParams.get("state");

  if (!code || !stateValue) {
    return NextResponse.json(
      { error: "code and state are required" },
      { status: 400 }
    );
  }

  const cookieStore = await cookies();
  const expectedNonce = cookieStore.get("cafe24_oauth_state")?.value;
  const state = decodeState<Cafe24OAuthState>(stateValue);

  if (!expectedNonce || expectedNonce !== state.nonce) {
    return NextResponse.json(
      { error: "OAuth state does not match" },
      { status: 400 }
    );
  }

  const token = await exchangeCodeForToken({
    code,
    mallId: state.mall_id,
    redirectUri: getRedirectUri(request.url)
  });

  const response = new NextResponse(
    `<!doctype html>
      <html lang="ko">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>Cafe24 연결 완료</title>
          <style>
            body { margin: 0; font-family: Arial, "Apple SD Gothic Neo", "Malgun Gothic", sans-serif; background: #f5f7f8; color: #202124; }
            main { width: min(720px, calc(100% - 32px)); margin: 0 auto; padding: 56px 0; }
            section { border: 1px solid #d7dce2; border-radius: 8px; background: #fff; padding: 28px; }
            h1 { margin: 0 0 12px; font-size: 28px; letter-spacing: 0; }
            p { margin: 0 0 18px; color: #60646c; line-height: 1.6; }
            a { color: #0f766e; font-weight: 700; }
          </style>
        </head>
        <body>
          <main>
            <section>
              <h1>Cafe24 연결 완료</h1>
              <p>${state.mall_id} 쇼핑몰 인증이 완료되었습니다.</p>
              <p><a href="/dashboard">주문 대시보드 열기</a></p>
            </section>
          </main>
        </body>
      </html>`,
    {
      headers: {
        "Content-Type": "text/html; charset=utf-8"
      }
    }
  );

  response.cookies.delete("cafe24_oauth_state");
  response.cookies.set("cafe24_mall_id", state.mall_id, {
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    path: "/",
    maxAge: 60 * 60 * 24 * 30
  });
  response.cookies.set("cafe24_access_token", token.access_token, {
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    path: "/",
    maxAge: 60 * 60 * 2
  });

  if (token.refresh_token) {
    response.cookies.set("cafe24_refresh_token", token.refresh_token, {
      httpOnly: true,
      sameSite: "lax",
      secure: true,
      path: "/",
      maxAge: 60 * 60 * 24 * 30
    });
  }

  return response;
}

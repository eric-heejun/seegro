import { NextRequest, NextResponse } from "next/server";
import {
  encodeState,
  getCafe24Scopes,
  getRedirectUri,
  getRequiredEnv
} from "@/lib/cafe24";

export async function GET(request: NextRequest) {
  const requestUrl = request.url;
  const mallId =
    request.nextUrl.searchParams.get("mall_id") ??
    process.env.CAFE24_MALL_ID ??
    "sevenpet7";

  if (!mallId) {
    return NextResponse.json(
      { error: "mall_id is required" },
      { status: 400 }
    );
  }

  const nonce = crypto.randomUUID();
  const redirectUri = getRedirectUri(requestUrl);
  const state = encodeState({
    mall_id: mallId,
    nonce,
    issued_at: new Date().toISOString()
  });

  const authorizeUrl = new URL(
    `https://${mallId}.cafe24api.com/api/v2/oauth/authorize`
  );
  authorizeUrl.searchParams.set("response_type", "code");
  authorizeUrl.searchParams.set("client_id", getRequiredEnv("CAFE24_CLIENT_ID"));
  authorizeUrl.searchParams.set("state", state);
  authorizeUrl.searchParams.set("redirect_uri", redirectUri);
  authorizeUrl.searchParams.set("scope", getCafe24Scopes());

  const response = NextResponse.redirect(authorizeUrl);
  response.cookies.set("cafe24_oauth_state", nonce, {
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    path: "/",
    maxAge: 10 * 60
  });

  return response;
}

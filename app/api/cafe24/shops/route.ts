import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { fetchCafe24Admin, refreshCafe24Token } from "@/lib/cafe24";
import {
  tryGetStoredCafe24Token,
  trySaveCafe24Token
} from "@/lib/cafe24TokenStore";

export async function GET() {
  const cookieStore = await cookies();
  const cookieMallId = cookieStore.get("cafe24_mall_id")?.value;
  const cookieAccessToken = cookieStore.get("cafe24_access_token")?.value;
  const storedToken =
    cookieMallId && cookieAccessToken ? null : await tryGetStoredCafe24Token();
  const mallId = cookieMallId ?? storedToken?.mallId;
  let accessToken = cookieAccessToken ?? storedToken?.accessToken;
  const refreshToken =
    cookieStore.get("cafe24_refresh_token")?.value ?? storedToken?.refreshToken;

  if (!mallId || !accessToken) {
    return NextResponse.json(
      { error: "Cafe24 is not connected" },
      { status: 401 }
    );
  }

  let cafe24Response = await fetchCafe24Admin({
    mallId,
    accessToken,
    path: "shops"
  });

  let refreshedToken: Awaited<ReturnType<typeof refreshCafe24Token>> | null =
    null;

  if (cafe24Response.status === 401 && refreshToken) {
    refreshedToken = await refreshCafe24Token({ mallId, refreshToken });
    accessToken = refreshedToken.access_token;
    await trySaveCafe24Token({
      mallId,
      token: refreshedToken,
      previousRefreshToken: refreshToken
    });
    cafe24Response = await fetchCafe24Admin({
      mallId,
      accessToken,
      path: "shops"
    });
  }

  const payload = await cafe24Response.json();
  const response = NextResponse.json(payload, {
    status: cafe24Response.status
  });

  if (refreshedToken) {
    response.cookies.set("cafe24_access_token", refreshedToken.access_token, {
      httpOnly: true,
      sameSite: "lax",
      secure: true,
      path: "/",
      maxAge: 60 * 60 * 2
    });

    if (refreshedToken.refresh_token) {
      response.cookies.set("cafe24_refresh_token", refreshedToken.refresh_token, {
        httpOnly: true,
        sameSite: "lax",
        secure: true,
        path: "/",
        maxAge: 60 * 60 * 24 * 30
      });
    }
  }

  return response;
}

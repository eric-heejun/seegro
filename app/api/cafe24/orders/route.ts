import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { fetchCafe24Admin, refreshCafe24Token } from "@/lib/cafe24";

type Cafe24Shop = {
  shop_no: number;
  shop_name?: string;
  default?: "T" | "F";
  language_code?: string;
  currency_code?: string;
  primary_domain?: string;
};

function getDefaultDateRange() {
  const end = new Date();
  const start = new Date(end);
  start.setDate(start.getDate() - 7);

  return {
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10)
  };
}

export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  const mallId = cookieStore.get("cafe24_mall_id")?.value;
  let accessToken = cookieStore.get("cafe24_access_token")?.value;
  const refreshToken = cookieStore.get("cafe24_refresh_token")?.value;

  if (!mallId || !accessToken) {
    return NextResponse.json(
      { error: "Cafe24 is not connected" },
      { status: 401 }
    );
  }

  const connectedMallId = mallId;
  let currentAccessToken = accessToken;
  let refreshedToken: Awaited<ReturnType<typeof refreshCafe24Token>> | null =
    null;

  async function fetchAdmin(path: string, searchParams?: URLSearchParams) {
    let response = await fetchCafe24Admin({
      mallId: connectedMallId,
      accessToken: currentAccessToken,
      path,
      searchParams
    });

    if (response.status === 401 && refreshToken) {
      refreshedToken = await refreshCafe24Token({
        mallId: connectedMallId,
        refreshToken
      });
      currentAccessToken = refreshedToken.access_token;
      response = await fetchCafe24Admin({
        mallId: connectedMallId,
        accessToken: currentAccessToken,
        path,
        searchParams
      });
    }

    return response;
  }

  const defaults = getDefaultDateRange();
  const selectedShopNo = request.nextUrl.searchParams.get("shop_no") ?? "all";
  const baseParams = new URLSearchParams();
  baseParams.set(
    "start_date",
    request.nextUrl.searchParams.get("start_date") ?? defaults.startDate
  );
  baseParams.set(
    "end_date",
    request.nextUrl.searchParams.get("end_date") ?? defaults.endDate
  );
  baseParams.set("limit", request.nextUrl.searchParams.get("limit") ?? "100");
  baseParams.set(
    "embed",
    request.nextUrl.searchParams.get("embed") ?? "items"
  );

  let shops: Cafe24Shop[] = [];

  if (selectedShopNo === "all") {
    const shopsResponse = await fetchAdmin("shops");
    const shopsPayload = await shopsResponse.json();

    if (!shopsResponse.ok) {
      const response = NextResponse.json(shopsPayload, {
        status: shopsResponse.status
      });
      applyTokenCookies(response, refreshedToken);
      return response;
    }

    shops = Array.isArray(shopsPayload.shops)
      ? shopsPayload.shops
      : [{ shop_no: 1, shop_name: "Default" }];
  } else {
    shops = [{ shop_no: Number(selectedShopNo) }];
  }

  const shopResults = await Promise.all(
    shops.map(async (shop) => {
      const params = new URLSearchParams(baseParams);
      params.set("shop_no", String(shop.shop_no));
      const ordersResponse = await fetchAdmin("orders", params);
      const payload = await ordersResponse.json();

      return {
        shop,
        ok: ordersResponse.ok,
        status: ordersResponse.status,
        payload
      };
    })
  );

  const orders = shopResults.flatMap((result) => {
    if (!result.ok || !Array.isArray(result.payload.orders)) {
      return [];
    }

    return result.payload.orders.map((order: Record<string, unknown>) => ({
      ...order,
      shop_no: order.shop_no ?? result.shop.shop_no,
      shop_name: result.shop.shop_name
    }));
  });

  const response = NextResponse.json({
    mall_id: connectedMallId,
    shop_no: selectedShopNo,
    shops,
    orders,
    errors: shopResults
      .filter((result) => !result.ok)
      .map((result) => ({
        shop_no: result.shop.shop_no,
        status: result.status,
        payload: result.payload
      }))
  });
  applyTokenCookies(response, refreshedToken);

  return response;
}

function applyTokenCookies(
  response: NextResponse,
  refreshedToken: Awaited<ReturnType<typeof refreshCafe24Token>> | null
) {
  if (!refreshedToken) {
    return;
  }

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

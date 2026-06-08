import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import {
  Cafe24TokenResponse,
  fetchCafe24Admin,
  refreshCafe24Token
} from "@/lib/cafe24";
import {
  tryGetStoredCafe24Token,
  trySaveCafe24Token
} from "@/lib/cafe24TokenStore";

type Cafe24Shop = {
  shop_no: number;
  shop_name?: string;
  default?: "T" | "F";
  language_code?: string;
  currency_code?: string;
  primary_domain?: string;
};

const FALLBACK_SHOP_NOS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];

function getDefaultDateRange() {
  const end = new Date();
  const start = new Date(end);
  start.setDate(start.getDate() - 6);

  return {
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10)
  };
}

export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  const cookieMallId = cookieStore.get("cafe24_mall_id")?.value;
  const cookieAccessToken = cookieStore.get("cafe24_access_token")?.value;
  const storedToken =
    cookieMallId && cookieAccessToken ? null : await tryGetStoredCafe24Token();
  const mallId = cookieMallId ?? storedToken?.mallId;
  const accessToken = cookieAccessToken ?? storedToken?.accessToken;
  const refreshToken =
    cookieStore.get("cafe24_refresh_token")?.value ?? storedToken?.refreshToken;

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
  let refreshPromise: Promise<Cafe24TokenResponse> | null = null;

  async function refreshOnce() {
    if (!refreshToken) {
      return null;
    }

    refreshPromise ??= refreshCafe24Token({
      mallId: connectedMallId,
      refreshToken
    });

    return refreshPromise;
  }

  async function fetchAdmin(path: string, searchParams?: URLSearchParams) {
    let response = await fetchCafe24Admin({
      mallId: connectedMallId,
      accessToken: currentAccessToken,
      path,
      searchParams
    });

    if (response.status === 401 && refreshToken) {
      refreshedToken = await refreshOnce();
      if (!refreshedToken) {
        return response;
      }

      currentAccessToken = refreshedToken.access_token;
      await trySaveCafe24Token({
        mallId: connectedMallId,
        token: refreshedToken,
        previousRefreshToken: refreshToken
      });
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
  const pageLimit = Math.min(
    Math.max(Number(request.nextUrl.searchParams.get("limit") ?? "100"), 1),
    100
  );
  const maxPages = Math.min(
    Math.max(Number(request.nextUrl.searchParams.get("max_pages") ?? "10"), 1),
    20
  );
  const baseParams = new URLSearchParams();
  baseParams.set(
    "start_date",
    request.nextUrl.searchParams.get("start_date") ?? defaults.startDate
  );
  baseParams.set(
    "end_date",
    request.nextUrl.searchParams.get("end_date") ?? defaults.endDate
  );
  baseParams.set("limit", String(pageLimit));
  baseParams.set(
    "embed",
    request.nextUrl.searchParams.get("embed") ?? "items"
  );

  let shops: Cafe24Shop[] = [];

  if (selectedShopNo === "all") {
    const shopsResponse = await fetchAdmin("shops");
    const shopsPayload = await shopsResponse.json();

    shops = shopsResponse.ok && Array.isArray(shopsPayload.shops)
      ? shopsPayload.shops
      : FALLBACK_SHOP_NOS.map((shopNo) => ({
          shop_no: shopNo,
          shop_name: `Shop ${shopNo}`
        }));
  } else {
    shops = [{ shop_no: Number(selectedShopNo) }];
  }

  const shopResults = await Promise.all(shops.map(fetchOrdersForShop));

  const orders = shopResults
    .flatMap((result) => result.orders)
    .sort((a, b) =>
      String(b.order_date ?? "").localeCompare(String(a.order_date ?? ""))
    );

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

  async function fetchOrdersForShop(shop: Cafe24Shop) {
    const orders: Record<string, unknown>[] = [];

    for (let page = 0; page < maxPages; page += 1) {
      const params = new URLSearchParams(baseParams);
      params.set("shop_no", String(shop.shop_no));
      params.set("offset", String(page * pageLimit));

      const ordersResponse = await fetchAdmin("orders", params);
      const payload = await ordersResponse.json();

      if (!ordersResponse.ok || !Array.isArray(payload.orders)) {
        return {
          shop,
          ok: false,
          status: ordersResponse.status,
          payload,
          orders
        };
      }

      const pageOrders = payload.orders.map((order: Record<string, unknown>) => ({
        ...order,
        shop_no: order.shop_no ?? shop.shop_no,
        shop_name: shop.shop_name
      }));
      orders.push(...pageOrders);

      if (pageOrders.length < pageLimit) {
        break;
      }
    }

    return {
      shop,
      ok: true,
      status: 200,
      payload: null,
      orders
    };
  }
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

import { NextRequest, NextResponse } from "next/server";
import { fetchNaverCommerce, getNaverAccessToken } from "@/lib/naver";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type NaverRecord = Record<string, unknown>;

type NaverProductOrderContent = {
  productOrderId?: string;
  content?: {
    order?: NaverRecord;
    productOrder?: NaverRecord;
  };
  order?: NaverRecord;
  productOrder?: NaverRecord;
};

function toNumber(value: unknown) {
  const numberValue = Number(value ?? 0);
  return Number.isFinite(numberValue) ? numberValue : 0;
}

function toStringValue(value: unknown) {
  return typeof value === "string" ? value : value == null ? "" : String(value);
}

function toDateInput(date: Date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getDefaultDateRange() {
  const end = new Date();
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - 6);

  return {
    startDate: toDateInput(start),
    endDate: toDateInput(end)
  };
}

function formatKstDateTime(date: string, endOfDay = false) {
  return `${date}T${endOfDay ? "23:59:59.999" : "00:00:00.000"}+09:00`;
}

function getDateRangeDays(startDate: string, endDate: string) {
  const start = new Date(`${startDate}T00:00:00.000Z`);
  const end = new Date(`${endDate}T00:00:00.000Z`);
  const days: string[] = [];

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return days;
  }

  for (
    const current = new Date(start);
    current.getTime() <= end.getTime();
    current.setUTCDate(current.getUTCDate() + 1)
  ) {
    days.push(toDateInput(current));
  }

  return days;
}

function extractContents(payload: unknown): NaverProductOrderContent[] {
  if (!payload || typeof payload !== "object") {
    return [];
  }

  const data = (payload as { data?: unknown }).data;
  if (Array.isArray(data)) {
    return data as NaverProductOrderContent[];
  }

  if (data && typeof data === "object") {
    const contents = (data as { contents?: unknown }).contents;
    if (Array.isArray(contents)) {
      return contents as NaverProductOrderContent[];
    }
  }

  return [];
}

function getOrder(content: NaverProductOrderContent) {
  return content.content?.order ?? content.order ?? {};
}

function getProductOrder(content: NaverProductOrderContent) {
  return content.content?.productOrder ?? content.productOrder ?? {};
}

function getQuantity(productOrder: NaverRecord) {
  return (
    toNumber(productOrder.quantity) ||
    toNumber(productOrder.initialQuantity) ||
    toNumber(productOrder.remainQuantity) ||
    1
  );
}

function getPayment(productOrder: NaverRecord) {
  return (
    toNumber(productOrder.totalPaymentAmount) ||
    toNumber(productOrder.initialPaymentAmount) ||
    toNumber(productOrder.remainPaymentAmount) ||
    toNumber(productOrder.totalProductAmount) ||
    toNumber(productOrder.unitPrice) * getQuantity(productOrder)
  );
}

function getProductAmount(productOrder: NaverRecord) {
  return (
    toNumber(productOrder.totalProductAmount) ||
    toNumber(productOrder.initialProductAmount) ||
    toNumber(productOrder.remainProductAmount) ||
    toNumber(productOrder.unitPrice) * getQuantity(productOrder)
  );
}

function isCanceledStatus(status: string) {
  return status.includes("CANCELED") || status.includes("RETURNED");
}

function toDashboardOrders(contents: NaverProductOrderContent[]) {
  const orderMap = new Map<string, any>();

  contents.forEach((content) => {
    const order = getOrder(content);
    const productOrder = getProductOrder(content);
    const productOrderId =
      content.productOrderId || toStringValue(productOrder.productOrderId);
    const orderId =
      toStringValue(order.orderId) ||
      toStringValue(productOrder.orderId) ||
      productOrderId;
    const status = toStringValue(productOrder.productOrderStatus);
    const itemPayment = getPayment(productOrder);
    const itemProductAmount = getProductAmount(productOrder);

    if (!orderMap.has(orderId)) {
      orderMap.set(orderId, {
        shop_no: 0,
        shop_name: "네이버",
        order_id: orderId,
        order_date:
          toStringValue(order.paymentDate) ||
          toStringValue(order.orderDate) ||
          toStringValue(productOrder.paymentDate),
        payment_amount: "0",
        total_supply_price: "0",
        canceled: "F",
        order_place_id: "naver",
        order_place_name: toStringValue(order.payLocationType) || "Naver",
        items: []
      });
    }

    const dashboardOrder = orderMap.get(orderId);
    dashboardOrder.items.push({
      order_item_code: productOrderId,
      product_code:
        toStringValue(productOrder.productId) ||
        toStringValue(productOrder.originalProductId),
      custom_product_code: toStringValue(productOrder.sellerProductCode),
      product_name: toStringValue(productOrder.productName),
      supplier_name: "네이버",
      option_value: toStringValue(productOrder.productOption),
      actual_payment_amount: itemPayment,
      product_price: itemProductAmount || toNumber(productOrder.unitPrice),
      option_price: toNumber(productOrder.optionPrice),
      status_text: status,
      order_status: status,
      quantity: getQuantity(productOrder)
    });
    dashboardOrder.payment_amount = String(
      toNumber(dashboardOrder.payment_amount) + itemPayment
    );
    dashboardOrder.total_supply_price = String(
      toNumber(dashboardOrder.total_supply_price) + itemProductAmount
    );
  });

  return Array.from(orderMap.values())
    .map((order) => ({
      ...order,
      canceled:
        order.items.length > 0 &&
        order.items.every((item: { order_status?: string }) =>
          isCanceledStatus(item.order_status ?? "")
        )
          ? "T"
          : "F"
    }))
    .sort((a, b) => String(b.order_date ?? "").localeCompare(String(a.order_date ?? "")));
}

export async function GET(request: NextRequest) {
  const defaults = getDefaultDateRange();
  const startDate = request.nextUrl.searchParams.get("start_date") ?? defaults.startDate;
  const endDate = request.nextUrl.searchParams.get("end_date") ?? defaults.endDate;
  const rangeType = request.nextUrl.searchParams.get("range_type") ?? "PAYED_DATETIME";
  const days = getDateRangeDays(startDate, endDate);

  if (days.length === 0) {
    return NextResponse.json({ error: "Invalid date range" }, { status: 400 });
  }

  try {
    const token = await getNaverAccessToken();
    const contents: NaverProductOrderContent[] = [];

    for (const day of days) {
      const params = new URLSearchParams({
        from: formatKstDateTime(day),
        to: formatKstDateTime(day, true),
        rangeType
      });
      const naverResponse = await fetchNaverCommerce({
        accessToken: token.access_token,
        path: "pay-order/seller/product-orders",
        searchParams: params
      });
      const payload = await naverResponse.json();

      if (!naverResponse.ok) {
        return NextResponse.json(
          { error: "Naver orders request failed", payload },
          { status: naverResponse.status }
        );
      }

      contents.push(...extractContents(payload));
    }

    return NextResponse.json({
      source: "naver",
      shops: [{ shop_no: 0, shop_name: "네이버" }],
      orders: toDashboardOrders(contents),
      raw_count: contents.length
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

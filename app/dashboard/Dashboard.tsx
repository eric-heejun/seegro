"use client";

import { matchCostEntry } from "@/lib/costCatalog";
import { useEffect, useMemo, useState } from "react";

type Shop = {
  shop_no: number;
  shop_name?: string;
  default?: "T" | "F";
  language_code?: string;
  currency_code?: string;
  primary_domain?: string;
};

type Cafe24OrderItem = {
  order_item_code?: string;
  product_code?: string;
  custom_product_code?: string;
  product_name?: string;
  product_name_default?: string;
  supplier_product_name?: string;
  supplier_name?: string;
  option_value?: string;
  option_value_default?: string;
  additional_option_value?: string;
  actual_payment_amount?: string | number;
  product_price?: string | number;
  option_price?: string | number;
  status_text?: string;
  order_status?: string;
  quantity?: string | number;
};

type Cafe24Order = {
  shop_no: number;
  shop_name?: string;
  order_id: string;
  order_date?: string;
  payment_amount?: string;
  total_supply_price?: string;
  canceled?: "T" | "F";
  order_place_id?: string;
  order_place_name?: string;
  items?: Cafe24OrderItem[];
};

const DATE_PRESETS = [
  { id: "today", label: "오늘", days: 1 },
  { id: "7d", label: "최근 7일", days: 7 },
  { id: "14d", label: "최근 14일", days: 14 },
  { id: "30d", label: "최근 30일", days: 30 }
] as const;

type DatePresetId = (typeof DATE_PRESETS)[number]["id"] | "custom";

function toNumber(value: string | number | undefined) {
  const numberValue = Number(value ?? 0);
  return Number.isFinite(numberValue) ? numberValue : 0;
}

function money(value: string | number | undefined) {
  return new Intl.NumberFormat("ko-KR").format(toNumber(value));
}

function getQuantity(value: string | number | undefined) {
  const quantity = toNumber(value);
  return quantity > 0 ? quantity : 1;
}

function getItemName(item: Cafe24OrderItem) {
  return (
    item.product_name ??
    item.product_name_default ??
    item.supplier_product_name ??
    "상품명 없음"
  );
}

function getItemOption(item: Cafe24OrderItem) {
  const optionParts = [
    item.option_value,
    item.option_value_default,
    item.additional_option_value
  ].filter((value): value is string => Boolean(value?.trim()));

  return Array.from(new Set(optionParts)).join(", ");
}

function getItemCode(item: Cafe24OrderItem) {
  return item.custom_product_code ?? item.product_code ?? item.order_item_code ?? "";
}

function getOrderItemQuantity(order: Cafe24Order) {
  return (order.items ?? []).reduce(
    (total, item) => total + getQuantity(item.quantity),
    0
  );
}

function needsCostReview(order: Cafe24Order) {
  return toNumber(order.payment_amount) > toNumber(order.total_supply_price);
}

function getItemCostMatch(item: Cafe24OrderItem) {
  return matchCostEntry({
    productName: getItemName(item),
    optionName: getItemOption(item)
  });
}

function getItemCost(item: Cafe24OrderItem) {
  const match = getItemCostMatch(item);
  return match ? match.entry.unitCost * getQuantity(item.quantity) : 0;
}

function getItemPayment(item: Cafe24OrderItem) {
  if (item.actual_payment_amount !== undefined) {
    return toNumber(item.actual_payment_amount);
  }

  return 0;
}

function getOrderCost(order: Cafe24Order) {
  return (order.items ?? []).reduce(
    (total, item) => total + getItemCost(item),
    0
  );
}

function getMarginRate(payment: number, margin: number) {
  if (payment <= 0) {
    return null;
  }

  return margin / payment;
}

function percent(value: number | null) {
  if (value === null) {
    return "-";
  }

  return `${(value * 100).toFixed(1)}%`;
}

function getOrderUnmatchedItemCount(order: Cafe24Order) {
  return (order.items ?? []).filter((item) => !getItemCostMatch(item)).length;
}

function getErrorMessage(payload: unknown, fallback: string) {
  if (
    payload &&
    typeof payload === "object" &&
    "error" in payload &&
    typeof (payload as { error?: unknown }).error === "string"
  ) {
    return (payload as { error: string }).error;
  }

  if (
    payload &&
    typeof payload === "object" &&
    "error" in payload &&
    (payload as { error?: unknown }).error
  ) {
    return JSON.stringify((payload as { error: unknown }).error);
  }

  return fallback;
}

function formatDateInput(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getPresetRange(days: number) {
  const end = new Date();
  const start = new Date(end);
  start.setDate(end.getDate() - (days - 1));

  return {
    startDate: formatDateInput(start),
    endDate: formatDateInput(end)
  };
}

export default function Dashboard() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [orders, setOrders] = useState<Cafe24Order[]>([]);
  const [shopNo, setShopNo] = useState("all");
  const [datePreset, setDatePreset] = useState<DatePresetId>("7d");
  const [dateRange, setDateRange] = useState(() => getPresetRange(7));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadShops() {
      try {
        const response = await fetch("/api/cafe24/shops");
        const payload = await response.json();
        if (!response.ok) {
          throw new Error(getErrorMessage(payload, "Cafe24 shops request failed"));
        }
        setShops(Array.isArray(payload.shops) ? payload.shops : []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      }
    }

    loadShops();
  }, []);

  useEffect(() => {
    if (dateRange.startDate > dateRange.endDate) {
      setOrders([]);
      setLoading(false);
      setError("시작일은 종료일보다 늦을 수 없습니다.");
      return;
    }

    const controller = new AbortController();

    async function loadOrders() {
      setLoading(true);
      setError("");
      try {
        const params = new URLSearchParams({
          shop_no: shopNo,
          start_date: dateRange.startDate,
          end_date: dateRange.endDate,
          limit: "100",
          max_pages: "10"
        });
        const response = await fetch(`/api/cafe24/orders?${params}`, {
          signal: controller.signal
        });
        const payload = await response.json();
        if (controller.signal.aborted) {
          return;
        }
        if (!response.ok) {
          throw new Error(getErrorMessage(payload, "Cafe24 orders request failed"));
        }
        setOrders(Array.isArray(payload.orders) ? payload.orders : []);
        if (Array.isArray(payload.shops) && payload.shops.length > 0) {
          setShops(payload.shops);
        }
        if (
          Array.isArray(payload.errors) &&
          payload.errors.length > 0 &&
          (!Array.isArray(payload.orders) || payload.orders.length === 0)
        ) {
          setError(
            `주문 조회 오류: ${JSON.stringify(payload.errors.slice(0, 3))}`
          );
        }
      } catch (err) {
        if (controller.signal.aborted) {
          return;
        }
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadOrders();

    return () => controller.abort();
  }, [shopNo, dateRange.startDate, dateRange.endDate]);

  function applyPreset(days: number, presetId: DatePresetId) {
    setDatePreset(presetId);
    setDateRange(getPresetRange(days));
  }

  const shopNameByNo = useMemo(() => {
    const map = new Map<number, string>();
    shops.forEach((shop) =>
      map.set(shop.shop_no, shop.shop_name ?? `Shop ${shop.shop_no}`)
    );
    return map;
  }, [shops]);

  const summary = useMemo(() => {
    const activeOrders = orders.filter((order) => order.canceled !== "T");
    return {
      count: activeOrders.length,
      canceled: orders.length - activeOrders.length,
      items: activeOrders.reduce(
        (total, order) => total + getOrderItemQuantity(order),
        0
      ),
      payment: activeOrders.reduce(
        (total, order) => total + toNumber(order.payment_amount),
        0
      ),
      supply: activeOrders.reduce(
        (total, order) => total + toNumber(order.total_supply_price),
        0
      ),
      cost: activeOrders.reduce((total, order) => total + getOrderCost(order), 0),
      unmatchedItems: activeOrders.reduce(
        (total, order) => total + getOrderUnmatchedItemCount(order),
        0
      )
    };
  }, [orders]);
  const summaryMargin = summary.payment - summary.cost;

  return (
    <main className="dashboardShell">
      <section className="dashboardTop">
        <div>
          <p className="eyebrow">Seegro</p>
          <h1>Cafe24 주문 대시보드</h1>
        </div>
        <a className="linkButton" href="/">
          연결 화면
        </a>
      </section>

      <section className="dashboardControls">
        <div className="controlGroup">
          <label htmlFor="shop_no">쇼핑몰</label>
          <select
            id="shop_no"
            value={shopNo}
            onChange={(event) => setShopNo(event.target.value)}
          >
            <option value="all">전체 쇼핑몰</option>
            {shops.map((shop) => (
              <option key={shop.shop_no} value={shop.shop_no}>
                {shop.shop_name ?? `Shop ${shop.shop_no}`} ({shop.shop_no})
              </option>
            ))}
          </select>
        </div>

        <div className="controlGroup periodGroup">
          <span className="controlLabel">주문일</span>
          <div className="presetButtons" aria-label="주문일 기간 선택">
            {DATE_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                className={
                  datePreset === preset.id
                    ? "presetButton isActive"
                    : "presetButton"
                }
                onClick={() => applyPreset(preset.days, preset.id)}
              >
                {preset.label}
              </button>
            ))}
          </div>
          <div className="dateInputs">
            <label className="dateField">
              <span>시작</span>
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(event) => {
                  setDatePreset("custom");
                  setDateRange((current) => ({
                    ...current,
                    startDate: event.target.value
                  }));
                }}
              />
            </label>
            <label className="dateField">
              <span>종료</span>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(event) => {
                  setDatePreset("custom");
                  setDateRange((current) => ({
                    ...current,
                    endDate: event.target.value
                  }));
                }}
              />
            </label>
          </div>
        </div>
      </section>

      <section className="summaryGrid">
        <div className="metric">
          <span>주문</span>
          <strong>{summary.count}</strong>
        </div>
        <div className="metric">
          <span>구매 품목수</span>
          <strong>{summary.items}</strong>
        </div>
        <div className="metric">
          <span>결제금액</span>
          <strong>{money(summary.payment)}원</strong>
        </div>
        <div className="metric">
          <span>공급가</span>
          <strong>{money(summary.supply)}원</strong>
        </div>
        <div className="metric">
          <span>원가</span>
          <strong>{money(summary.cost)}원</strong>
        </div>
        <div className="metric">
          <span>예상마진</span>
          <strong>{money(summaryMargin)}원</strong>
        </div>
        <div className="metric">
          <span>원가 미매칭</span>
          <strong>{summary.unmatchedItems}</strong>
        </div>
        <div className="metric">
          <span>취소</span>
          <strong>{summary.canceled}</strong>
        </div>
      </section>

      {error ? <p className="errorBox">{error}</p> : null}

      <section className="tableWrap">
        <table>
          <thead>
            <tr>
              <th>쇼핑몰</th>
              <th>주문일</th>
              <th>주문번호</th>
              <th>구매 품목 전체</th>
              <th>주문경로</th>
              <th>결제금액</th>
              <th>공급가</th>
              <th>원가</th>
              <th>마진</th>
              <th>마진율</th>
              <th>상태</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={11}>불러오는 중...</td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={11}>조회된 주문이 없습니다.</td>
              </tr>
            ) : (
              orders.map((order) => {
                  const orderCost = getOrderCost(order);
                  const orderPayment = toNumber(order.payment_amount);
                  const orderMargin = orderPayment - orderCost;
                  const orderMarginRate = getMarginRate(
                    orderPayment,
                    orderMargin
                  );
                  const unmatchedItems = getOrderUnmatchedItemCount(order);

                  return (
                    <tr key={`${order.shop_no}-${order.order_id}`}>
                      <td>{order.shop_name ?? shopNameByNo.get(order.shop_no)}</td>
                      <td>{order.order_date?.slice(0, 10)}</td>
                      <td>{order.order_id}</td>
                      <td>
                        {order.items && order.items.length > 0 ? (
                          <div className="orderItems">
                            <div className="orderItemsSummary">
                              <span>{order.items.length}개 품목</span>
                              <span>총 {getOrderItemQuantity(order)}개</span>
                              <span>원가 {money(orderCost)}원</span>
                              {unmatchedItems > 0 ? (
                                <span className="unmatchedBadge">
                                  미매칭 {unmatchedItems}개
                                </span>
                              ) : null}
                              {needsCostReview(order) ? (
                                <span className="reviewBadge">원가 확인</span>
                              ) : null}
                            </div>
                            <ul>
                              {order.items.map((item, index) => {
                                const option = getItemOption(item);
                                const code = getItemCode(item);
                                const costMatch = getItemCostMatch(item);
                                const quantity = getQuantity(item.quantity);
                                const itemCost = costMatch
                                  ? costMatch.entry.unitCost * quantity
                                  : 0;
                                const itemPayment = getItemPayment(item);

                                return (
                                  <li
                                    key={
                                      item.order_item_code ??
                                      `${order.order_id}-${index}`
                                    }
                                  >
                                    <div className="itemName">
                                      {getItemName(item)}
                                    </div>
                                    {option ? (
                                      <div className="itemOption">{option}</div>
                                    ) : null}
                                    <div className="itemMeta">
                                      <span>수량 {quantity}개</span>
                                      {item.actual_payment_amount !== undefined ? (
                                        <span>
                                          품목결제 {money(item.actual_payment_amount)}원
                                        </span>
                                      ) : null}
                                      {costMatch ? (
                                        <>
                                          <span className="costBadge">
                                            원가 {money(costMatch.entry.unitCost)}원
                                          </span>
                                          <span className="costBadge">
                                            품목원가 {money(itemCost)}원
                                          </span>
                                          {itemPayment > 0 ? (
                                            <span className="marginBadge">
                                              품목마진 {money(itemPayment - itemCost)}원
                                            </span>
                                          ) : null}
                                          <span className="matchBadge">
                                            {costMatch.reason === "similar"
                                              ? `유사매칭 ${Math.round(
                                                  costMatch.confidence * 100
                                                )}%`
                                              : "원가매칭"}
                                          </span>
                                          {costMatch.entry.needsReview ? (
                                            <span className="reviewBadge">
                                              검수필요
                                            </span>
                                          ) : null}
                                        </>
                                      ) : (
                                        <span className="unmatchedBadge">
                                          원가 미등록
                                        </span>
                                      )}
                                      {item.product_price !== undefined ? (
                                        <span>
                                          상품가 {money(item.product_price)}원
                                        </span>
                                      ) : null}
                                      {item.option_price !== undefined &&
                                      toNumber(item.option_price) !== 0 ? (
                                        <span>
                                          옵션가 {money(item.option_price)}원
                                        </span>
                                      ) : null}
                                      {item.supplier_name ? (
                                        <span>{item.supplier_name}</span>
                                      ) : null}
                                      {code ? <span>{code}</span> : null}
                                      {item.status_text ?? item.order_status ? (
                                        <span>
                                          {item.status_text ?? item.order_status}
                                        </span>
                                      ) : null}
                                    </div>
                                  </li>
                                );
                              })}
                            </ul>
                          </div>
                        ) : (
                          <span className="mutedText">품목 정보 없음</span>
                        )}
                      </td>
                      <td>{order.order_place_id ?? order.order_place_name}</td>
                      <td>{money(order.payment_amount)}원</td>
                      <td>{money(order.total_supply_price)}원</td>
                      <td>
                        {orderCost > 0 ? (
                          <>
                            {money(orderCost)}원
                            {unmatchedItems > 0 ? (
                              <div className="cellNote">일부 미매칭</div>
                            ) : null}
                          </>
                        ) : (
                          <span className="mutedText">미등록</span>
                        )}
                      </td>
                      <td
                        className={
                          orderMargin < 0 ? "negativeValue" : "positiveValue"
                        }
                      >
                        {orderCost > 0 ? `${money(orderMargin)}원` : "-"}
                      </td>
                      <td>{orderCost > 0 ? percent(orderMarginRate) : "-"}</td>
                      <td>{order.canceled === "T" ? "취소" : "정상"}</td>
                    </tr>
                  );
                })
            )}
          </tbody>
        </table>
      </section>
    </main>
  );
}

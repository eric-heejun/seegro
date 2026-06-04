"use client";

import { matchCostEntry } from "@/lib/costCatalog";
import { useEffect, useMemo, useState } from "react";

type OrderItem = {
  order_item_code?: string;
  product_name?: string;
  supplier_name?: string;
  option_value?: string;
  actual_payment_amount?: number;
  product_price?: number;
  option_price?: number;
  status_text?: string;
  order_status?: string;
  quantity?: number;
};

type Order = {
  order_id: string;
  order_date?: string;
  payment_amount?: string;
  total_supply_price?: string;
  canceled?: "T" | "F";
  order_place_name?: string;
  items?: OrderItem[];
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

function getQuantity(item: OrderItem) {
  const quantity = toNumber(item.quantity);
  return quantity > 0 ? quantity : 1;
}

function getItemName(item: OrderItem) {
  return item.product_name ?? "상품명 없음";
}

function getItemOption(item: OrderItem) {
  return item.option_value ?? "";
}

function getItemPayment(item: OrderItem) {
  return toNumber(item.actual_payment_amount);
}

function getItemCost(item: OrderItem) {
  const match = matchCostEntry({
    productName: getItemName(item),
    optionName: getItemOption(item)
  });

  return match ? match.entry.unitCost * getQuantity(item) : 0;
}

function getOrderCost(order: Order) {
  return (order.items ?? []).reduce((total, item) => total + getItemCost(item), 0);
}

function getUnmatchedItemCount(order: Order) {
  return (order.items ?? []).filter((item) => {
    return !matchCostEntry({
      productName: getItemName(item),
      optionName: getItemOption(item)
    });
  }).length;
}

function percent(value: number | null) {
  if (value === null) {
    return "-";
  }

  return `${(value * 100).toFixed(1)}%`;
}

function marginRate(payment: number, margin: number) {
  return payment > 0 ? margin / payment : null;
}

export default function NaverDashboardPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [datePreset, setDatePreset] = useState<DatePresetId>("7d");
  const [dateRange, setDateRange] = useState(() => getPresetRange(7));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadOrders() {
      setLoading(true);
      setError("");
      try {
        const params = new URLSearchParams({
          start_date: dateRange.startDate,
          end_date: dateRange.endDate
        });
        const response = await fetch(`/api/naver/orders?${params}`, {
          signal: controller.signal
        });
        const payload = await response.json();

        if (controller.signal.aborted) {
          return;
        }
        if (!response.ok) {
          throw new Error(
            typeof payload.error === "string"
              ? payload.error
              : "Naver orders request failed"
          );
        }

        setOrders(Array.isArray(payload.orders) ? payload.orders : []);
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(err instanceof Error ? err.message : "Unknown error");
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadOrders();
    return () => controller.abort();
  }, [dateRange.startDate, dateRange.endDate]);

  function applyPreset(days: number, presetId: DatePresetId) {
    setDatePreset(presetId);
    setDateRange(getPresetRange(days));
  }

  const summary = useMemo(() => {
    const activeOrders = orders.filter((order) => order.canceled !== "T");
    const payment = activeOrders.reduce(
      (total, order) => total + toNumber(order.payment_amount),
      0
    );
    const cost = activeOrders.reduce((total, order) => total + getOrderCost(order), 0);
    const items = activeOrders.reduce(
      (total, order) => total + (order.items ?? []).reduce((sum, item) => sum + getQuantity(item), 0),
      0
    );
    const unmatchedItems = activeOrders.reduce(
      (total, order) => total + getUnmatchedItemCount(order),
      0
    );

    return {
      count: activeOrders.length,
      canceled: orders.length - activeOrders.length,
      items,
      payment,
      cost,
      margin: payment - cost,
      unmatchedItems
    };
  }, [orders]);

  return (
    <main className="dashboardShell">
      <section className="dashboardTop">
        <div>
          <p className="eyebrow">Seegro</p>
          <h1>네이버 주문 대시보드</h1>
        </div>
        <a className="linkButton" href="/dashboard">
          Cafe24 보기
        </a>
      </section>

      <section className="dashboardControls">
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
          <span>원가</span>
          <strong>{money(summary.cost)}원</strong>
        </div>
        <div className="metric">
          <span>마진</span>
          <strong>{money(summary.margin)}원</strong>
        </div>
        <div className="metric">
          <span>마진율</span>
          <strong>{percent(marginRate(summary.payment, summary.margin))}</strong>
        </div>
      </section>

      {error ? <div className="errorBox">{error}</div> : null}

      <section className="tableWrap">
        <table>
          <thead>
            <tr>
              <th>채널</th>
              <th>주문일</th>
              <th>주문번호</th>
              <th>구매 품목 전체</th>
              <th>주문경로</th>
              <th>결제금액</th>
              <th>원가</th>
              <th>마진</th>
              <th>마진율</th>
              <th>상태</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={10}>불러오는 중...</td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={10}>조회된 주문이 없습니다.</td>
              </tr>
            ) : (
              orders.map((order) => {
                const orderCost = getOrderCost(order);
                const payment = toNumber(order.payment_amount);
                const margin = payment - orderCost;
                const unmatchedItems = getUnmatchedItemCount(order);

                return (
                  <tr key={order.order_id}>
                    <td>네이버</td>
                    <td>{String(order.order_date ?? "").slice(0, 10)}</td>
                    <td>{order.order_id}</td>
                    <td>
                      <div className="orderItems">
                        <div className="orderItemsSummary">
                          <span>{(order.items ?? []).length}개 품목</span>
                          <span>총 {money(payment)}원</span>
                          {unmatchedItems > 0 ? (
                            <span className="unmatchedBadge">
                              미매칭 {unmatchedItems}개
                            </span>
                          ) : null}
                        </div>
                        <ul>
                          {(order.items ?? []).map((item, index) => {
                            const match = matchCostEntry({
                              productName: getItemName(item),
                              optionName: getItemOption(item)
                            });
                            const itemCost = getItemCost(item);
                            const itemPayment = getItemPayment(item);

                            return (
                              <li key={item.order_item_code ?? `${order.order_id}-${index}`}>
                                <div className="itemName">{getItemName(item)}</div>
                                {getItemOption(item) ? (
                                  <div className="itemOption">{getItemOption(item)}</div>
                                ) : null}
                                <div className="itemMeta">
                                  <span>수량 {getQuantity(item)}개</span>
                                  <span>상품가 {money(item.product_price)}원</span>
                                  <span className="costBadge">원가 {money(itemCost)}원</span>
                                  {match ? (
                                    <span className="matchBadge">원가매칭</span>
                                  ) : (
                                    <span className="unmatchedBadge">원가 미등록</span>
                                  )}
                                  <span>
                                    마진 {money(itemPayment - itemCost)}원
                                  </span>
                                </div>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    </td>
                    <td>{order.order_place_name ?? "Naver"}</td>
                    <td>{money(payment)}원</td>
                    <td>{money(orderCost)}원</td>
                    <td className={margin >= 0 ? "positiveValue" : "negativeValue"}>
                      {money(margin)}원
                    </td>
                    <td>{percent(marginRate(payment, margin))}</td>
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

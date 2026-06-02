"use client";

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
  product_name?: string;
  quantity?: number;
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

function toNumber(value: string | number | undefined) {
  const numberValue = Number(value ?? 0);
  return Number.isFinite(numberValue) ? numberValue : 0;
}

function money(value: string | number | undefined) {
  return new Intl.NumberFormat("ko-KR").format(toNumber(value));
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

export default function Dashboard() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [orders, setOrders] = useState<Cafe24Order[]>([]);
  const [shopNo, setShopNo] = useState("all");
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
    async function loadOrders() {
      setLoading(true);
      setError("");
      try {
        const params = new URLSearchParams({
          shop_no: shopNo,
          limit: "100"
        });
        const response = await fetch(`/api/cafe24/orders?${params}`);
        const payload = await response.json();
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
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }

    loadOrders();
  }, [shopNo]);

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
      payment: activeOrders.reduce(
        (total, order) => total + toNumber(order.payment_amount),
        0
      ),
      supply: activeOrders.reduce(
        (total, order) => total + toNumber(order.total_supply_price),
        0
      )
    };
  }, [orders]);

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
      </section>

      <section className="summaryGrid">
        <div className="metric">
          <span>주문</span>
          <strong>{summary.count}</strong>
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
              <th>상품</th>
              <th>주문경로</th>
              <th>결제금액</th>
              <th>공급가</th>
              <th>상태</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8}>불러오는 중...</td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={8}>조회된 주문이 없습니다.</td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr key={`${order.shop_no}-${order.order_id}`}>
                  <td>{order.shop_name ?? shopNameByNo.get(order.shop_no)}</td>
                  <td>{order.order_date?.slice(0, 10)}</td>
                  <td>{order.order_id}</td>
                  <td>
                    {(order.items ?? [])
                      .map((item) => item.product_name)
                      .filter(Boolean)
                      .join(", ")}
                  </td>
                  <td>{order.order_place_id ?? order.order_place_name}</td>
                  <td>{money(order.payment_amount)}원</td>
                  <td>{money(order.total_supply_price)}원</td>
                  <td>{order.canceled === "T" ? "취소" : "정상"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>
    </main>
  );
}

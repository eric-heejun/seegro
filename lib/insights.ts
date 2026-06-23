import { matchCostEntry } from "@/lib/costCatalog";

export type InsightOrderItem = {
  order_item_code?: string;
  product_code?: string;
  product_name?: string;
  product_name_default?: string;
  supplier_product_name?: string;
  option_value?: string;
  option_value_default?: string;
  additional_option_value?: string;
  actual_payment_amount?: string | number;
  product_price?: string | number;
  option_price?: string | number;
  quantity?: string | number;
};

export type InsightOrder = {
  order_id: string;
  order_date?: string;
  payment_amount?: string | number;
  canceled?: "T" | "F";
  items?: InsightOrderItem[];
};

export type ProductInsight = {
  key: string;
  productName: string;
  optionName: string;
  quantity: number;
  orderCount: number;
  revenue: number;
  cost: number;
  margin: number;
  marginRate: number | null;
};

export type ComboInsight = {
  productA: string;
  productB: string;
  orderCount: number;
  revenue: number;
};

export type DailyInsightReport = {
  reportDate: string;
  generatedAt: string;
  summary: {
    orderCount: number;
    productCount: number;
    totalQuantity: number;
    totalRevenue: number;
    totalCost: number;
    totalMargin: number;
    averageMarginRate: number | null;
    costMatchRate: number | null;
    unmatchedProductCount: number;
  };
  topByQuantity: ProductInsight[];
  topByRevenue: ProductInsight[];
  topByMargin: ProductInsight[];
  topByMarginRate: ProductInsight[];
  topCombos: ComboInsight[];
  unmatchedProducts: ProductInsight[];
};

type ProductAccumulator = ProductInsight & {
  orderIds: Set<string>;
  matchedQuantity: number;
  matchedRevenue: number;
};

type ComboAccumulator = ComboInsight & {
  orderIds: Set<string>;
};

const TOP_LIMIT = 10;

export function getYesterdayKstDate(now = new Date()) {
  const kstNow = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  kstNow.setUTCDate(kstNow.getUTCDate() - 1);
  return kstNow.toISOString().slice(0, 10);
}

export function toNumber(value: unknown) {
  const numberValue = Number(String(value ?? 0).replace(/,/g, ""));
  return Number.isFinite(numberValue) ? numberValue : 0;
}

export function getQuantity(value: string | number | undefined) {
  const quantity = toNumber(value);
  return quantity > 0 ? quantity : 1;
}

export function getItemName(item: InsightOrderItem) {
  return (
    item.product_name ??
    item.product_name_default ??
    item.supplier_product_name ??
    "상품명 없음"
  );
}

export function getItemOption(item: InsightOrderItem) {
  const optionParts = [
    item.option_value,
    item.option_value_default,
    item.additional_option_value
  ].filter((value): value is string => Boolean(value?.trim()));

  return Array.from(new Set(optionParts)).join(", ");
}

function getProductKey(productName: string, optionName: string) {
  return `${productName.trim()}__${optionName.trim()}`;
}

function getProductLabel(product: ProductInsight) {
  return product.optionName
    ? `${product.productName} / ${product.optionName}`
    : product.productName;
}

function getItemPriceWeight(item: InsightOrderItem) {
  const price = toNumber(item.product_price) + toNumber(item.option_price);
  return price > 0 ? price * getQuantity(item.quantity) : 0;
}

function allocateAmount(total: number, weights: number[]) {
  if (weights.length === 0) {
    return [];
  }

  const roundedTotal = Math.round(total);
  const weightTotal = weights.reduce((sum, weight) => sum + weight, 0);
  const safeWeights =
    weightTotal > 0 ? weights : weights.map(() => 1);
  const safeWeightTotal = safeWeights.reduce((sum, weight) => sum + weight, 0);
  let remaining = roundedTotal;

  return safeWeights.map((weight, index) => {
    if (index === safeWeights.length - 1) {
      return remaining;
    }

    const amount = Math.round((roundedTotal * weight) / safeWeightTotal);
    remaining -= amount;
    return amount;
  });
}

function getOrderItemRevenues(order: InsightOrder) {
  const items = order.items ?? [];
  const orderPayment = toNumber(order.payment_amount);
  const directRevenues = items.map((item) => toNumber(item.actual_payment_amount));
  const directRevenueTotal = directRevenues.reduce(
    (sum, revenue) => sum + revenue,
    0
  );

  if (directRevenueTotal > 0) {
    if (orderPayment > 0 && Math.round(directRevenueTotal) !== Math.round(orderPayment)) {
      return allocateAmount(orderPayment, directRevenues);
    }

    return directRevenues;
  }

  return allocateAmount(
    orderPayment,
    items.map((item) => getItemPriceWeight(item))
  );
}

function serializeProduct(product: ProductAccumulator): ProductInsight {
  return {
    key: product.key,
    productName: product.productName,
    optionName: product.optionName,
    quantity: product.quantity,
    orderCount: product.orderIds.size,
    revenue: product.revenue,
    cost: product.cost,
    margin: product.margin,
    marginRate: product.marginRate
  };
}

function sortByNumber<T>(items: T[], getValue: (item: T) => number) {
  return [...items].sort((a, b) => getValue(b) - getValue(a));
}

export function buildDailyInsightReport({
  reportDate,
  orders,
  generatedAt = new Date().toISOString()
}: {
  reportDate: string;
  orders: InsightOrder[];
  generatedAt?: string;
}): DailyInsightReport {
  const activeOrders = orders.filter((order) => order.canceled !== "T");
  const products = new Map<string, ProductAccumulator>();
  const combos = new Map<string, ComboAccumulator>();
  let totalQuantity = 0;
  let matchedQuantity = 0;
  let matchedRevenue = 0;

  for (const order of activeOrders) {
    const orderItems = order.items ?? [];
    const orderItemRevenues = getOrderItemRevenues(order);
    const orderProducts = new Map<string, ProductInsight>();

    for (const [index, item] of orderItems.entries()) {
      const productName = getItemName(item);
      const optionName = getItemOption(item);
      const key = getProductKey(productName, optionName);
      const quantity = getQuantity(item.quantity);
      const revenue = orderItemRevenues[index] ?? 0;
      const costMatch = matchCostEntry({ productName, optionName });
      const cost = costMatch ? costMatch.entry.unitCost * quantity : 0;
      let product = products.get(key);

      if (!product) {
        product = {
          key,
          productName,
          optionName,
          quantity: 0,
          orderCount: 0,
          revenue: 0,
          cost: 0,
          margin: 0,
          marginRate: null,
          orderIds: new Set<string>(),
          matchedQuantity: 0,
          matchedRevenue: 0
        };
        products.set(key, product);
      }

      totalQuantity += quantity;
      product.quantity += quantity;
      product.revenue += revenue;
      product.orderIds.add(order.order_id);

      if (costMatch) {
        matchedQuantity += quantity;
        matchedRevenue += revenue;
        product.matchedQuantity += quantity;
        product.matchedRevenue += revenue;
        product.cost += cost;
      }

      product.margin = product.revenue - product.cost;
      product.marginRate =
        product.revenue > 0 ? product.margin / product.revenue : null;
      orderProducts.set(key, serializeProduct(product));
    }

    const uniqueOrderProducts = Array.from(orderProducts.values()).sort((a, b) =>
      getProductLabel(a).localeCompare(getProductLabel(b), "ko")
    );

    for (let i = 0; i < uniqueOrderProducts.length; i += 1) {
      for (let j = i + 1; j < uniqueOrderProducts.length; j += 1) {
        const productA = getProductLabel(uniqueOrderProducts[i]);
        const productB = getProductLabel(uniqueOrderProducts[j]);
        const comboKey = `${uniqueOrderProducts[i].key}__PAIR__${uniqueOrderProducts[j].key}`;
        let combo = combos.get(comboKey);

        if (!combo) {
          combo = {
            productA,
            productB,
            orderCount: 0,
            revenue: 0,
            orderIds: new Set<string>()
          };
          combos.set(comboKey, combo);
        }

        if (!combo.orderIds.has(order.order_id)) {
          combo.orderIds.add(order.order_id);
          combo.orderCount += 1;
          combo.revenue += toNumber(order.payment_amount);
        }
      }
    }
  }

  const productList = Array.from(products.values()).map((product) => {
    product.orderCount = product.orderIds.size;
    product.margin = product.revenue - product.cost;
    product.marginRate =
      product.revenue > 0 ? product.margin / product.revenue : null;
    return serializeProduct(product);
  });
  const matchedProducts = productList.filter((product) => product.cost > 0);
  const unmatchedProducts = productList.filter((product) => product.cost === 0);
  const totalRevenue = productList.reduce(
    (total, product) => total + product.revenue,
    0
  );
  const totalCost = matchedProducts.reduce(
    (total, product) => total + product.cost,
    0
  );
  const totalMargin = matchedRevenue - totalCost;
  const comboList = Array.from(combos.values()).map((combo) => ({
    productA: combo.productA,
    productB: combo.productB,
    orderCount: combo.orderCount,
    revenue: combo.revenue
  }));

  return {
    reportDate,
    generatedAt,
    summary: {
      orderCount: activeOrders.length,
      productCount: productList.length,
      totalQuantity,
      totalRevenue,
      totalCost,
      totalMargin,
      averageMarginRate:
        matchedRevenue > 0 ? totalMargin / matchedRevenue : null,
      costMatchRate: totalQuantity > 0 ? matchedQuantity / totalQuantity : null,
      unmatchedProductCount: unmatchedProducts.length
    },
    topByQuantity: sortByNumber(productList, (product) => product.quantity).slice(
      0,
      TOP_LIMIT
    ),
    topByRevenue: sortByNumber(productList, (product) => product.revenue).slice(
      0,
      TOP_LIMIT
    ),
    topByMargin: sortByNumber(matchedProducts, (product) => product.margin).slice(
      0,
      TOP_LIMIT
    ),
    topByMarginRate: sortByNumber(matchedProducts, (product) =>
      product.marginRate ?? -Infinity
    ).slice(0, TOP_LIMIT),
    topCombos: sortByNumber(comboList, (combo) => combo.orderCount).slice(
      0,
      TOP_LIMIT
    ),
    unmatchedProducts: sortByNumber(
      unmatchedProducts,
      (product) => product.revenue
    ).slice(0, TOP_LIMIT)
  };
}

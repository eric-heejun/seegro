export type MetaInsight = {
  spend?: string;
  impressions?: string;
  reach?: string;
  clicks?: string;
  ctr?: string;
  cpc?: string;
  cpm?: string;
  date_start?: string;
  date_stop?: string;
  account_id?: string;
  account_name?: string;
  campaign_id?: string;
  campaign_name?: string;
  adset_id?: string;
  adset_name?: string;
  ad_id?: string;
  ad_name?: string;
};

type MetaPaging = {
  cursors?: {
    before?: string;
    after?: string;
  };
  next?: string;
};

type PublicMetaPaging = {
  cursors?: {
    before?: string;
    after?: string;
  };
};

export type MetaInsightsResponse = {
  data?: MetaInsight[];
  paging?: MetaPaging;
  error?: {
    message?: string;
    type?: string;
    code?: number;
    error_subcode?: number;
  };
};

export type MetaInsightsSummary = {
  spend: number;
  impressions: number;
  reach: number;
  clicks: number;
  ctr: number | null;
  cpc: number | null;
  cpm: number | null;
};

export type MetaInsightsPayload = {
  source: "meta";
  account_id: string;
  level: string;
  start_date: string;
  end_date: string;
  summary: MetaInsightsSummary;
  insights: MetaInsight[];
  paging?: PublicMetaPaging;
};

const DEFAULT_API_VERSION = "v25.0";
const DEFAULT_INSIGHT_FIELDS = [
  "account_id",
  "account_name",
  "campaign_id",
  "campaign_name",
  "adset_id",
  "adset_name",
  "ad_id",
  "ad_name",
  "impressions",
  "reach",
  "clicks",
  "spend",
  "ctr",
  "cpc",
  "cpm",
  "date_start",
  "date_stop"
].join(",");

function getRequiredEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} is not configured`);
  }

  return value;
}

function getMetaApiVersion() {
  const version = process.env.META_GRAPH_API_VERSION?.trim() || DEFAULT_API_VERSION;
  return version.startsWith("v") ? version : `v${version}`;
}

function getMetaAdAccountId(adAccountId?: string | null) {
  const value = (adAccountId || process.env.META_AD_ACCOUNT_ID || "").trim();
  if (!value) {
    throw new Error("META_AD_ACCOUNT_ID is not configured");
  }

  return value.startsWith("act_") ? value : `act_${value}`;
}

function getMetaErrorMessage(payload: MetaInsightsResponse, status: number) {
  if (payload.error?.message) {
    const details = [
      payload.error.type ? `type=${payload.error.type}` : "",
      payload.error.code ? `code=${payload.error.code}` : "",
      payload.error.error_subcode ? `subcode=${payload.error.error_subcode}` : ""
    ].filter(Boolean);
    return `Meta insights request failed (${status}): ${payload.error.message}${
      details.length ? ` ${details.join(" ")}` : ""
    }`;
  }

  return `Meta insights request failed (${status})`;
}

function toNumber(value: unknown) {
  const numberValue = Number(value ?? 0);
  return Number.isFinite(numberValue) ? numberValue : 0;
}

function summarizeInsights(insights: MetaInsight[]): MetaInsightsSummary {
  const spend = insights.reduce((total, row) => total + toNumber(row.spend), 0);
  const impressions = insights.reduce(
    (total, row) => total + toNumber(row.impressions),
    0
  );
  const reach = insights.reduce((total, row) => total + toNumber(row.reach), 0);
  const clicks = insights.reduce((total, row) => total + toNumber(row.clicks), 0);

  return {
    spend,
    impressions,
    reach,
    clicks,
    ctr: impressions > 0 ? clicks / impressions : null,
    cpc: clicks > 0 ? spend / clicks : null,
    cpm: impressions > 0 ? (spend / impressions) * 1000 : null
  };
}

function sanitizePaging(paging: MetaPaging | undefined): PublicMetaPaging | undefined {
  if (!paging?.cursors) {
    return undefined;
  }

  return {
    cursors: paging.cursors
  };
}

export async function fetchMetaAdsInsights({
  adAccountId,
  startDate,
  endDate,
  level = "campaign",
  limit = 500,
  maxPages = 10
}: {
  adAccountId?: string | null;
  startDate: string;
  endDate: string;
  level?: string;
  limit?: number;
  maxPages?: number;
}): Promise<MetaInsightsPayload> {
  const accessToken = getRequiredEnv("META_ACCESS_TOKEN");
  const accountId = getMetaAdAccountId(adAccountId);
  const firstUrl = new URL(
    `https://graph.facebook.com/${getMetaApiVersion()}/${accountId}/insights`
  );

  firstUrl.searchParams.set("access_token", accessToken);
  firstUrl.searchParams.set("fields", DEFAULT_INSIGHT_FIELDS);
  firstUrl.searchParams.set("level", level);
  firstUrl.searchParams.set(
    "time_range",
    JSON.stringify({ since: startDate, until: endDate })
  );
  firstUrl.searchParams.set("limit", String(Math.min(Math.max(limit, 1), 500)));

  const insights: MetaInsight[] = [];
  let paging: MetaPaging | undefined;
  let nextUrl: URL | null = firstUrl;

  for (let page = 0; page < maxPages && nextUrl; page += 1) {
    const response = await fetch(nextUrl, { cache: "no-store" });
    const payload = (await response.json()) as MetaInsightsResponse;

    if (!response.ok) {
      throw new Error(getMetaErrorMessage(payload, response.status));
    }

    insights.push(...(Array.isArray(payload.data) ? payload.data : []));
    paging = payload.paging;
    nextUrl = payload.paging?.next ? new URL(payload.paging.next) : null;
  }

  return {
    source: "meta",
    account_id: accountId,
    level,
    start_date: startDate,
    end_date: endDate,
    summary: summarizeInsights(insights),
    insights,
    paging: sanitizePaging(paging)
  };
}

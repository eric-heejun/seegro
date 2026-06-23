import bcrypt from "bcryptjs";

type NaverTokenType = "SELF" | "SELLER";

export type NaverTokenResponse = {
  access_token: string;
  expires_in?: number;
  token_type?: string;
};

export type NaverEnvironmentStatus = {
  clientIdConfigured: boolean;
  clientSecretConfigured: boolean;
  tokenType: NaverTokenType;
  accountIdConfigured: boolean;
  proxyUrlConfigured: boolean;
  proxySecretConfigured: boolean;
  readyForDirectCall: boolean;
  readyForProxyCall: boolean;
  issues: string[];
};

export type NaverProxyHealth = {
  configured: boolean;
  ok: boolean;
  status?: number;
  message: string;
};

function getRequiredNaverEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not configured`);
  }

  return value;
}

function getNaverTokenType(): NaverTokenType {
  return process.env.NAVER_COMMERCE_TOKEN_TYPE === "SELLER" ? "SELLER" : "SELF";
}

export function getNaverEnvironmentStatus(): NaverEnvironmentStatus {
  const tokenType = getNaverTokenType();
  const status: NaverEnvironmentStatus = {
    clientIdConfigured: Boolean(process.env.NAVER_COMMERCE_CLIENT_ID),
    clientSecretConfigured: Boolean(process.env.NAVER_COMMERCE_CLIENT_SECRET),
    tokenType,
    accountIdConfigured: Boolean(process.env.NAVER_COMMERCE_ACCOUNT_ID),
    proxyUrlConfigured: Boolean(process.env.NAVER_COMMERCE_PROXY_URL),
    proxySecretConfigured: Boolean(process.env.NAVER_COMMERCE_PROXY_SECRET),
    readyForDirectCall: false,
    readyForProxyCall: false,
    issues: []
  };

  if (!status.clientIdConfigured) {
    status.issues.push("NAVER_COMMERCE_CLIENT_ID is not configured");
  }

  if (!status.clientSecretConfigured) {
    status.issues.push("NAVER_COMMERCE_CLIENT_SECRET is not configured");
  }

  if (tokenType === "SELLER" && !status.accountIdConfigured) {
    status.issues.push("NAVER_COMMERCE_ACCOUNT_ID is required for SELLER type");
  }

  if (!status.proxyUrlConfigured) {
    status.issues.push("NAVER_COMMERCE_PROXY_URL is not configured");
  }

  status.readyForDirectCall =
    status.clientIdConfigured &&
    status.clientSecretConfigured &&
    (tokenType === "SELF" || status.accountIdConfigured);
  status.readyForProxyCall = status.readyForDirectCall && status.proxyUrlConfigured;

  return status;
}

export function getNaverPayloadMessage(payload: unknown): string {
  if (!payload || typeof payload !== "object") {
    return typeof payload === "string" ? payload : "";
  }

  const record = payload as Record<string, unknown>;
  const directParts = [
    record.code,
    record.error,
    record.errorCode,
    record.message,
    record.error_description
  ]
    .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
    .map((value) => value.trim());

  if (directParts.length > 0) {
    return Array.from(new Set(directParts)).join(" - ");
  }

  return getNaverPayloadMessage(record.data) || getNaverPayloadMessage(record.payload);
}

export function getNaverErrorMessage(error: unknown, fallback: string) {
  const message =
    error instanceof Error ? error.message : typeof error === "string" ? error : "";

  if (/fetch failed|ECONNREFUSED|ENOTFOUND|ETIMEDOUT|network/i.test(message)) {
    return "네이버 프록시 서버에 접속하지 못했습니다. 고정 IP 프록시 주소와 서버 실행 상태를 확인해주세요.";
  }

  if (/NAVER_COMMERCE_CLIENT_ID/i.test(message)) {
    return "네이버 커머스 API Client ID가 설정되지 않았습니다.";
  }

  if (/NAVER_COMMERCE_CLIENT_SECRET/i.test(message)) {
    return "네이버 커머스 API Client Secret이 설정되지 않았습니다.";
  }

  if (/NAVER_COMMERCE_ACCOUNT_ID/i.test(message)) {
    return "SELLER 방식에는 네이버 판매자 account_id 설정이 필요합니다. 내 스마트스토어라면 SELF 방식으로 설정해주세요.";
  }

  if (/GW\.IP_NOT_ALLOWED|IP_NOT_ALLOWED|ip.*allowed/i.test(message)) {
    return "네이버 커머스 API 센터에 고정 IP가 등록되지 않았습니다. 프록시 서버의 고정 IP를 등록해주세요.";
  }

  if (/invalid|unauthorized|401|403/i.test(message)) {
    return "네이버 커머스 API 키 또는 접근 권한을 확인해주세요.";
  }

  return message || fallback;
}

function createClientSecretSign({
  clientId,
  clientSecret,
  timestamp
}: {
  clientId: string;
  clientSecret: string;
  timestamp: number;
}) {
  const password = `${clientId}_${timestamp}`;
  return Buffer.from(bcrypt.hashSync(password, clientSecret), "utf8").toString(
    "base64"
  );
}

export async function getNaverAccessToken() {
  const clientId = getRequiredNaverEnv("NAVER_COMMERCE_CLIENT_ID");
  const clientSecret = getRequiredNaverEnv("NAVER_COMMERCE_CLIENT_SECRET");
  const type = getNaverTokenType();
  const accountId = process.env.NAVER_COMMERCE_ACCOUNT_ID;
  const timestamp = Date.now();

  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: clientId,
    timestamp: String(timestamp),
    client_secret_sign: createClientSecretSign({
      clientId,
      clientSecret,
      timestamp
    }),
    type
  });

  if (type === "SELLER") {
    if (!accountId) {
      throw new Error("NAVER_COMMERCE_ACCOUNT_ID is required for SELLER type");
    }

    body.set("account_id", accountId);
  }

  const response = await fetch(
    "https://api.commerce.naver.com/external/v1/oauth2/token",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body
    }
  );
  const payload = await response.json();

  if (!response.ok) {
    const payloadMessage = getNaverPayloadMessage(payload);
    throw new Error(
      getNaverErrorMessage(
        payloadMessage || JSON.stringify(payload),
        "Naver token request failed"
      )
    );
  }

  return payload as NaverTokenResponse;
}

export async function fetchNaverCommerce({
  accessToken,
  path,
  searchParams
}: {
  accessToken: string;
  path: string;
  searchParams?: URLSearchParams;
}) {
  const url = new URL(`https://api.commerce.naver.com/external/v1/${path}`);
  searchParams?.forEach((value, key) => url.searchParams.append(key, value));

  return fetch(url, {
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    }
  });
}

export async function fetchNaverCommerceProxy({
  path,
  searchParams
}: {
  path: string;
  searchParams?: URLSearchParams;
}) {
  const proxyBaseUrl = process.env.NAVER_COMMERCE_PROXY_URL;
  if (!proxyBaseUrl) {
    return null;
  }

  const url = new URL("/naver/product-orders", proxyBaseUrl);
  url.searchParams.set("path", path);
  searchParams?.forEach((value, key) => url.searchParams.append(key, value));

  const headers: HeadersInit = {
    "Content-Type": "application/json"
  };
  const proxySecret = process.env.NAVER_COMMERCE_PROXY_SECRET;
  if (proxySecret) {
    headers["x-seegro-proxy-secret"] = proxySecret;
  }

  return fetch(url, {
    cache: "no-store",
    headers
  });
}

export async function checkNaverProxyHealth(): Promise<NaverProxyHealth> {
  const proxyBaseUrl = process.env.NAVER_COMMERCE_PROXY_URL;
  if (!proxyBaseUrl) {
    return {
      configured: false,
      ok: false,
      message: "고정 IP 프록시 주소가 설정되지 않았습니다."
    };
  }

  try {
    const url = new URL("/health", proxyBaseUrl);
    const response = await fetch(url, {
      cache: "no-store",
      signal: AbortSignal.timeout(5000)
    });

    return {
      configured: true,
      ok: response.ok,
      status: response.status,
      message: response.ok
        ? "프록시 서버가 정상 응답했습니다."
        : `프록시 서버가 ${response.status} 상태를 반환했습니다.`
    };
  } catch (error) {
    return {
      configured: true,
      ok: false,
      message: getNaverErrorMessage(error, "프록시 서버 상태 확인에 실패했습니다.")
    };
  }
}

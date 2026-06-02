export type Cafe24TokenResponse = {
  access_token: string;
  refresh_token?: string;
  expires_at?: string;
  expires_in?: number;
  scope?: string;
  shop_no?: number;
  mall_id?: string;
};

export function getRequiredEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not configured`);
  }

  return value;
}

export function getAppUrl(requestUrl: string) {
  return process.env.APP_URL ?? new URL(requestUrl).origin;
}

export function getRedirectUri(requestUrl: string) {
  return (
    process.env.CAFE24_REDIRECT_URI ??
    `${getAppUrl(requestUrl)}/api/cafe24/callback`
  );
}

export function getCafe24Scopes() {
  return (
    process.env.CAFE24_SCOPES ??
    "mall.read_order,mall.read_product,mall.read_salesreport,mall.read_store"
  );
}

export function encodeState(payload: Record<string, unknown>) {
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
}

export function decodeState<T>(state: string): T {
  return JSON.parse(Buffer.from(state, "base64url").toString("utf8")) as T;
}

export async function exchangeCodeForToken({
  code,
  mallId,
  redirectUri
}: {
  code: string;
  mallId: string;
  redirectUri: string;
}) {
  return requestCafe24Token(mallId, {
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri
  });
}

export async function refreshCafe24Token({
  mallId,
  refreshToken
}: {
  mallId: string;
  refreshToken: string;
}) {
  return requestCafe24Token(mallId, {
    grant_type: "refresh_token",
    refresh_token: refreshToken
  });
}

async function requestCafe24Token(
  mallId: string,
  body: Record<string, string>
) {
  const clientId = getRequiredEnv("CAFE24_CLIENT_ID");
  const clientSecret = getRequiredEnv("CAFE24_CLIENT_SECRET");
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString(
    "base64"
  );

  const response = await fetch(
    `https://${mallId}.cafe24api.com/api/v2/oauth/token`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams(body)
    }
  );

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(
      `Cafe24 token request failed: ${JSON.stringify(payload)}`
    );
  }

  return payload as Cafe24TokenResponse;
}

export async function fetchCafe24Admin({
  mallId,
  accessToken,
  path,
  searchParams
}: {
  mallId: string;
  accessToken: string;
  path: string;
  searchParams?: URLSearchParams;
}) {
  const url = new URL(`https://${mallId}.cafe24api.com/api/v2/admin/${path}`);
  if (searchParams) {
    searchParams.forEach((value, key) => url.searchParams.set(key, value));
  }

  return fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "X-Cafe24-Api-Version": "2024-12-01"
    }
  });
}

import type { Cafe24TokenResponse } from "@/lib/cafe24";

export type StoredCafe24Token = {
  mallId: string;
  accessToken: string;
  refreshToken?: string;
  accessTokenExpiresAt?: string;
  refreshTokenExpiresAt?: string;
  scope?: string;
  shopNo?: number;
  updatedAt: string;
};

const DEFAULT_TOKEN_KEY = "seegro:cafe24:token";

type RedisResult<T> = {
  result?: T;
  error?: string;
};

function getTokenStoreConfig() {
  const url =
    process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
  const token =
    process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    return null;
  }

  return {
    url: url.replace(/\/+$/, ""),
    token,
    key: process.env.CAFE24_TOKEN_STORE_KEY ?? DEFAULT_TOKEN_KEY
  };
}

export function isCafe24TokenStoreConfigured() {
  return Boolean(getTokenStoreConfig());
}

async function redisCommand<T>(command: unknown[]) {
  const config = getTokenStoreConfig();
  if (!config) {
    return null;
  }

  const response = await fetch(config.url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(command),
    cache: "no-store"
  });

  const payload = (await response.json()) as RedisResult<T>;
  if (!response.ok || payload.error) {
    throw new Error(
      `Cafe24 token store request failed: ${JSON.stringify(payload)}`
    );
  }

  return payload.result ?? null;
}

export async function getStoredCafe24Token() {
  const config = getTokenStoreConfig();
  if (!config) {
    return null;
  }

  const value = await redisCommand<string | null>(["GET", config.key]);
  if (!value) {
    return null;
  }

  return JSON.parse(value) as StoredCafe24Token;
}

export async function tryGetStoredCafe24Token() {
  try {
    return await getStoredCafe24Token();
  } catch (error) {
    console.error("Failed to read Cafe24 token store", error);
    return null;
  }
}

export async function saveCafe24Token({
  mallId,
  token,
  previousRefreshToken
}: {
  mallId: string;
  token: Cafe24TokenResponse;
  previousRefreshToken?: string;
}) {
  const config = getTokenStoreConfig();
  if (!config) {
    return false;
  }

  const storedToken: StoredCafe24Token = {
    mallId,
    accessToken: token.access_token,
    refreshToken: token.refresh_token ?? previousRefreshToken,
    accessTokenExpiresAt: token.expires_at,
    refreshTokenExpiresAt: token.refresh_token_expires_at,
    scope: token.scope,
    shopNo: token.shop_no,
    updatedAt: new Date().toISOString()
  };

  await redisCommand<string>(["SET", config.key, JSON.stringify(storedToken)]);
  return true;
}

export async function trySaveCafe24Token(
  params: Parameters<typeof saveCafe24Token>[0]
) {
  try {
    return await saveCafe24Token(params);
  } catch (error) {
    console.error("Failed to store Cafe24 token", error);
    return false;
  }
}

import bcrypt from "bcryptjs";

type NaverTokenType = "SELF" | "SELLER";

export type NaverTokenResponse = {
  access_token: string;
  expires_in?: number;
  token_type?: string;
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
    throw new Error(`Naver token request failed: ${JSON.stringify(payload)}`);
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

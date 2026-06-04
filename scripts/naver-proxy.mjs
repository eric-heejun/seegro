import http from "node:http";
import { URL } from "node:url";
import bcrypt from "bcryptjs";

const PORT = Number(process.env.PORT ?? 8787);
const NAVER_API_BASE = "https://api.commerce.naver.com/external/v1";
const ALLOWED_PATH = "pay-order/seller/product-orders";

function sendJson(response, status, payload) {
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8"
  });
  response.end(JSON.stringify(payload));
}

function getRequiredEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not configured`);
  }

  return value;
}

function getTokenType() {
  return process.env.NAVER_COMMERCE_TOKEN_TYPE === "SELLER" ? "SELLER" : "SELF";
}

function createClientSecretSign({ clientId, clientSecret, timestamp }) {
  const password = `${clientId}_${timestamp}`;
  return Buffer.from(bcrypt.hashSync(password, clientSecret), "utf8").toString(
    "base64"
  );
}

async function getNaverAccessToken() {
  const clientId = getRequiredEnv("NAVER_COMMERCE_CLIENT_ID");
  const clientSecret = getRequiredEnv("NAVER_COMMERCE_CLIENT_SECRET");
  const type = getTokenType();
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

  const response = await fetch(`${NAVER_API_BASE}/oauth2/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body
  });
  const payload = await response.json();

  if (!response.ok) {
    throw new Error(`Naver token request failed: ${JSON.stringify(payload)}`);
  }

  return payload.access_token;
}

function assertProxySecret(request) {
  const expectedSecret = process.env.SEEGRO_PROXY_SECRET;
  if (!expectedSecret) {
    return true;
  }

  return request.headers["x-seegro-proxy-secret"] === expectedSecret;
}

async function handleProductOrders(request, response, requestUrl) {
  if (!assertProxySecret(request)) {
    sendJson(response, 401, { error: "Unauthorized proxy request" });
    return;
  }

  const path = requestUrl.searchParams.get("path") ?? ALLOWED_PATH;
  if (path !== ALLOWED_PATH) {
    sendJson(response, 400, { error: "Unsupported Naver proxy path" });
    return;
  }

  const accessToken = await getNaverAccessToken();
  const targetUrl = new URL(`${NAVER_API_BASE}/${path}`);
  requestUrl.searchParams.forEach((value, key) => {
    if (key !== "path") {
      targetUrl.searchParams.append(key, value);
    }
  });

  const naverResponse = await fetch(targetUrl, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    }
  });
  const body = await naverResponse.text();

  response.writeHead(naverResponse.status, {
    "Content-Type":
      naverResponse.headers.get("Content-Type") ??
      "application/json; charset=utf-8"
  });
  response.end(body);
}

const server = http.createServer(async (request, response) => {
  try {
    const requestUrl = new URL(request.url ?? "/", `http://${request.headers.host}`);

    if (request.method === "GET" && requestUrl.pathname === "/health") {
      sendJson(response, 200, { ok: true });
      return;
    }

    if (request.method === "GET" && requestUrl.pathname === "/naver/product-orders") {
      await handleProductOrders(request, response, requestUrl);
      return;
    }

    sendJson(response, 404, { error: "Not found" });
  } catch (error) {
    sendJson(response, 500, {
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

server.listen(PORT, () => {
  console.log(`Seegro Naver proxy listening on port ${PORT}`);
});

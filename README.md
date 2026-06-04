# Seegro

Cafe24 and Naver Commerce orders and sales margin dashboard.

## Vercel environment variables

Add these values in Vercel Project Settings > Environment Variables.

```text
CAFE24_CLIENT_ID
CAFE24_CLIENT_SECRET
CAFE24_MALL_ID
CAFE24_REDIRECT_URI
CAFE24_SCOPES
APP_URL
NAVER_COMMERCE_CLIENT_ID
NAVER_COMMERCE_CLIENT_SECRET
NAVER_COMMERCE_TOKEN_TYPE
NAVER_COMMERCE_PROXY_URL
NAVER_COMMERCE_PROXY_SECRET
```

For Naver Commerce API, use `NAVER_COMMERCE_TOKEN_TYPE=SELF` for the app owner's own store. In `SELF` mode, do not set `NAVER_COMMERCE_ACCOUNT_ID`. Use `SELLER` and set `NAVER_COMMERCE_ACCOUNT_ID` only when calling another seller store with the seller account ID/UID required by Naver.

If Naver blocks Vercel with `GW.IP_NOT_ALLOWED`, run the proxy on a server whose IP is registered in Naver Commerce API Center and set `NAVER_COMMERCE_PROXY_URL` in Vercel. Set the same secret in Vercel as `NAVER_COMMERCE_PROXY_SECRET` and on the proxy server as `SEEGRO_PROXY_SECRET`.

```bash
npm install --omit=dev
PORT=8787 \
NAVER_COMMERCE_CLIENT_ID=... \
NAVER_COMMERCE_CLIENT_SECRET=... \
NAVER_COMMERCE_TOKEN_TYPE=SELF \
SEEGRO_PROXY_SECRET=... \
node scripts/naver-proxy.mjs
```

Use this callback URL in Cafe24 Developers:

```text
https://seegro.vercel.app/api/cafe24/callback
```

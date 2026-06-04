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
```

For Naver Commerce API, use `NAVER_COMMERCE_TOKEN_TYPE=SELF` for the app owner's own store. In `SELF` mode, do not set `NAVER_COMMERCE_ACCOUNT_ID`. Use `SELLER` and set `NAVER_COMMERCE_ACCOUNT_ID` only when calling another seller store with the seller account ID/UID required by Naver.

Use this callback URL in Cafe24 Developers:

```text
https://seegro.vercel.app/api/cafe24/callback
```

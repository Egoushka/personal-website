# Payments: Paddle

Paddle is the merchant of record: it charges the buyer, handles EU VAT and sales tax, and pays
the owner out (SWIFT, monthly, $100 minimum; fee 5% + $0.50). Why this shape: [ADR 0012](adr/0012-paddle-checkout-on-a-static-site.md).

```
/mira/pack/  --click-->  Paddle.js overlay  --paid-->  Paddle
                                                         | transaction.completed (signed)
                                                         v
                       paddle-fulfil (pay.<domain>) --> Paddle API (buyer email) --> Resend --> buyer
                       buyer clicks /d/<token>  --> file from DATA_DIR/files
```

## Files

| Path | What |
|---|---|
| `payments/config.json` | environment, public client token, products (id, name, price id) |
| `lib/payments.ts`, `lib/mira.ts` | typed access; `checkoutReady` is false until token and price id are set |
| `components/PaddleCheckout.tsx` | the buy button and overlay |
| `personal/paddle-fulfil` (own repo) | webhook, signed links, download; its README has the env table; `products.json` maps price id to file |
| `deploy/Caddyfile` `@pack` | Paddle origins in the CSP of `/mira/pack/` only |
| `tests/payments.test.ts` | `checkoutReady`; the service's own tests cover signature, token, webhook to email to download, retries, forgeries |

## Go live (Mira): values only

1. In `payments/config.json` set `environment`, `clientToken` and the product's `priceId`
   (sandbox first: `test_...` token, sandbox price; then `live_...`, `"production"`). Merge: the page switches from "Checkout opens soon" to the button.
2. Put the same price id in `paddle-fulfil/products.json`. Run that service with these env vars (secrets from the stack's SOPS file, never in git):
   `PADDLE_WEBHOOK_SECRET` (the notification destination's secret), `PADDLE_API_KEY`
   (read-only: customers), `DOWNLOAD_SIGNING_KEY` (random, 32+ bytes), `RESEND_API_KEY`,
   plus plain `MAIL_FROM`, `PUBLIC_BASE_URL`, `DATA_DIR` (put the file in `$DATA_DIR/files/`), `PORT`.
   Build: `docker build .` in its repo. The homelab compose entry and the subdomain are a
   separate PR to `personal/homelab`.
3. In Paddle, add a notification destination `https://<pay-host>/paddle/webhook` for `transaction.completed`.
4. Check: a sandbox card (`4242 4242 4242 4242`) buys; the email arrives; the link downloads; replaying the event sends no second mail.

## Add the next product

1. Create the product and a one-time price in Paddle.
2. Site: add an entry to `payments/config.json` `products` (id, name, `priceId`).
3. Service: add the same price id with its `file` and `downloadName` to `paddle-fulfil/products.json`, put the file in `$DATA_DIR/files/`, then rebuild and redeploy the image (the file is baked into it). Skipping this is silent: the webhook logs "no known price, ignored", answers 200, and the buyer paid but gets no mail.
4. On its page render `<PaddleCheckout product={getProduct("<id>")} .../>` guarded by `checkoutReady`. Link to that page with a plain `<a>`, not `next/link`: the CSP belongs to the document, so a client-side navigation keeps the previous page's policy and Paddle.js is blocked. If the page is not `/mira/pack/`, give it the same `@pack` treatment in `deploy/Caddyfile` (CSP and Permissions-Policy).

Do not extract a library yet: Mira is the first consumer. Extract when a second works and a third validates it.

## Security notes

- The webhook is trusted only after the `Paddle-Signature` HMAC (5 min tolerance); an unknown price id is ignored; a mail failure returns 500 so Paddle retries; a delivered transaction id is never mailed twice.
- Download links are HMAC-signed, expire after 7 days and name only a configured file. Anyone holding the link can download: it is a bearer link sent to the buyer's own inbox.
- Duplicates: Paddle retries on a non-2xx or a response slower than 5 s, and replays on request. The service answers a retry with 'duplicate' while the first delivery is in flight, and the Paddle and mail calls time out at 4 s. If both calls succeed but the ledger write fails, a retry mails again; accepted.
- The CSP origins in `@pack` come from Paddle's published pages and other integrators' notes; verify them in a real sandbox checkout (console shows blocked requests) and adjust.

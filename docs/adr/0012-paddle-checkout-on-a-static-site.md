# Paddle checkout on a static site, fulfilment in its own service

Status: proposed (2026-11-22; the owner chose Paddle, the shape below is the author's)

[ADR 0011](./0011-the-site-may-be-an-app.md) lets the site be an application but keeps this repo a
static export, and says the CSP stays strict "except the payment provider's origin once payments
ship". Selling the Mira pack needs exactly that, plus a delivery. Paddle is the merchant of record
(the only one that takes a Ukrainian FOP) and Paddle Billing has no file delivery of its own: the
seller listens for `transaction.completed` and delivers
([Paddle for digital products](https://developer.paddle.com/get-started/how-paddle-works/digital-products)).

- **The page** stays static. `components/PaddleCheckout.tsx` loads Paddle.js on the first click and
  opens the overlay. Only `/mira/pack/` gets Paddle's origins in its CSP (`@pack` in
  `deploy/Caddyfile`); every other page keeps the old policy. No credential is on this origin: the
  client token and price id are public identifiers. Product config is data, `payments/config.json`.
- **Fulfilment** is a separate small service, `personal/paddle-fulfil`: its own container, its own
  subdomain, its own secrets. It verifies the webhook signature, looks up the buyer's email and
  emails a signed, expiring download link. Nothing of it is in this repo, so CLAUDE.md's
  no-server constraint holds. It may move into the app repo (`personal-website-app`) if the owner
  prefers one backend; it is Node and dependency-free, so that is a port, not a rewrite.

Not a library yet: Mira is the first consumer. Extract when a second product sells through it and a
third validates the shape (ADR 0008's rule).

Cost accepted: one more stateful service to keep running, and one page with a looser CSP.

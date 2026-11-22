import { test } from "node:test";
import assert from "node:assert/strict";
import { checkoutReady, getProduct, type PaymentsConfig } from "../lib/payments.ts";

test("checkoutReady needs both a token and a price id", () => {
  const p = getProduct("mira-pack");
  const cfg = (clientToken: string | null): PaymentsConfig => ({ environment: "sandbox", clientToken, products: [p] });
  assert.equal(checkoutReady({ ...p, priceId: null }, cfg("test_x")), false);
  assert.equal(checkoutReady({ ...p, priceId: "pri_1" }, cfg(null)), false);
  assert.equal(checkoutReady({ ...p, priceId: "pri_1" }, cfg("test_x")), true);
});

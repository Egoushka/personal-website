import { test } from "node:test";
import assert from "node:assert/strict";
import { yearFraction, yearFractionEnd } from "../lib/dates";

test("an inclusive end month runs to the start of the next one", () => {
  assert.equal(yearFractionEnd("2024-06"), yearFraction("2024-07"));
  assert.equal(yearFractionEnd("2024-12"), yearFraction("2025-01"));
  // A one-month role is one month long, not zero.
  assert.ok(Math.abs(yearFractionEnd("2024-09") - yearFraction("2024-09") - 1 / 12) < 1e-9);
});

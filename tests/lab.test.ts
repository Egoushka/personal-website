import { test } from "node:test";
import assert from "node:assert/strict";
import { parseStatus } from "../lib/status";
import { liveLab, LAB_METRICS } from "../lib/lab";

const NOW = Date.parse("2026-11-12T12:00:00Z");
const doc = (lab: unknown) =>
  parseStatus({ generated: "2026-11-12T11:50:00Z", uptimeDays: 3, containers: 139, unhealthy: 0, lab }, NOW);

test("the box's output today (homelab#439) lights only the nytka tile", () => {
  const s = doc({ nytka: { uptimePercent: 99.9, days: 13 } });
  assert.deepEqual(liveLab("nytka", s?.lab), { value: "99.90%", note: "last 13 days" });
  for (const k of ["chargehand", "rebuildDrill", "agentChecks"] as const) assert.equal(liveLab(k, s?.lab), undefined);
});

test("each tile formats its own block", () => {
  const s = doc({
    chargehand: { merged: 8, batches: 30, asOf: "2026-11-01T00:00:00Z" },
    rebuildDrill: { minutes: 42, asOf: "2026-11-02" },
    nytka: { uptimePercent: 100, days: 1 },
    agentChecks: { findings: 0, asOf: "2026-11-12T06:00:00Z" },
  });
  assert.deepEqual(liveLab("chargehand", s?.lab), { value: "8/30", note: "0.27 on 2026-11-01" });
  assert.deepEqual(liveLab("rebuildDrill", s?.lab), { value: "42 min", note: "last drill 2026-11-02" });
  assert.deepEqual(liveLab("nytka", s?.lab), { value: "100.00%", note: "last day" });
  assert.deepEqual(liveLab("agentChecks", s?.lab), { value: "0", note: "as of 2026-11-12" });
});

test("no status, or no lab block, lights nothing", () => {
  for (const lab of [undefined, null, doc(undefined)?.lab])
    for (const m of LAB_METRICS) assert.equal(liveLab(m.key, lab), undefined);
});

test("every tile has a dated fallback or says it is not published", () => {
  for (const m of LAB_METRICS) {
    if (m.fallback) assert.match(m.fallback.read, /^\d{4}-\d{2}-\d{2}$/);
  }
  assert.deepEqual(
    LAB_METRICS.map((m) => m.key),
    ["chargehand", "rebuildDrill", "nytka", "agentChecks"],
  );
});

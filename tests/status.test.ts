import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { parseStatus } from "../lib/status";

const NOW = Date.parse("2026-09-27T12:00:00Z");
const fixture = () => ({
  ...JSON.parse(fs.readFileSync("tests/fixtures/status.json", "utf8")),
  generated: new Date(NOW - 36e5).toISOString(),
});

test("a complete, fresh document passes whole", () => {
  const s = parseStatus(fixture(), NOW);
  assert.ok(s);
  assert.equal(s.containers, 58);
  assert.equal(s.coding?.languages?.length, 6);
  assert.equal(s.package?.downloads, 1873);
});

test("a stale or undatable document is null", () => {
  const at = (hoursAgo: number) => ({ ...fixture(), generated: new Date(NOW - hoursAgo * 36e5).toISOString() });
  assert.ok(parseStatus(at(47), NOW));
  assert.equal(parseStatus(at(49), NOW), null);
  assert.equal(parseStatus({ ...fixture(), generated: "not a date" }, NOW), null);
  assert.equal(parseStatus({ ...fixture(), generated: undefined }, NOW), null);
});

test("a required field of the wrong type rejects the document", () => {
  assert.equal(parseStatus({ ...fixture(), containers: "58" }, NOW), null);
  assert.equal(parseStatus({ ...fixture(), uptimeDays: null }, NOW), null);
  assert.equal(parseStatus({ ...fixture(), unhealthy: Number.NaN }, NOW), null);
});

test("an optional block that fails is dropped on its own", () => {
  const f = fixture();
  const noLangs = parseStatus({ ...f, coding: { ...f.coding, languages: "C#" } }, NOW);
  assert.ok(noLangs?.coding);
  assert.equal(noLangs.coding.languages, undefined);

  const badItem = parseStatus({ ...f, coding: { ...f.coding, languages: [{ name: "C#", percent: "54" }] } }, NOW);
  assert.equal(badItem?.coding?.languages, undefined);

  const badCoding = parseStatus({ ...f, coding: { ...f.coding, hours: "112" } }, NOW);
  assert.ok(badCoding);
  assert.equal(badCoding.coding, null);

  const badPkg = parseStatus({ ...f, package: { ...f.package, downloads: "1873" } }, NOW);
  assert.ok(badPkg);
  assert.equal(badPkg.package, null);
});

test("anything that is not a document is null, never a throw", () => {
  for (const d of [null, undefined, 0, "", "{}", [], [fixture()], true]) {
    assert.equal(parseStatus(d, NOW), null);
  }
});

test("the lab block passes whole, and is absent from a document without one", () => {
  const s = parseStatus(fixture(), NOW);
  assert.deepEqual(s?.lab?.chargehand, { merged: 8, batches: 30, asOf: "2026-11-01T00:00:00Z" });
  assert.equal(s?.lab?.nytka?.uptimePercent, 99.95);
  const { lab: _, ...without } = fixture();
  assert.equal(parseStatus(without, NOW)?.lab, null);
});

test("a lab sub-block that fails is dropped on its own", () => {
  const f = fixture();
  const lab = (patch: object) => parseStatus({ ...f, lab: { ...f.lab, ...patch } }, NOW)?.lab;

  const moreMergedThanRun = lab({ chargehand: { merged: 31, batches: 30, asOf: "2026-11-01T00:00:00Z" } });
  assert.equal(moreMergedThanRun?.chargehand, undefined);
  assert.equal(moreMergedThanRun?.nytka?.days, 30);

  assert.equal(lab({ chargehand: { merged: 0, batches: 0, asOf: "2026-11-01T00:00:00Z" } })?.chargehand, undefined);
  assert.equal(lab({ rebuildDrill: { minutes: "42", asOf: "2026-11-01T00:00:00Z" } })?.rebuildDrill, undefined);
  assert.equal(lab({ nytka: { uptimePercent: 101, days: 30 } })?.nytka, undefined);
  assert.equal(lab({ agentChecks: { findings: 3, asOf: "yesterday" } })?.agentChecks, undefined);

  const at = "2026-11-01T00:00:00Z";
  const bad: [string, object][] = [
    ["chargehand", { merged: -1, batches: 30, asOf: at }],
    ["chargehand", { merged: 7.5, batches: 30, asOf: at }],
    ["chargehand", { merged: 8, batches: 30, asOf: "1" }],
    ["chargehand", { merged: 8, batches: 30, asOf: "Sun Nov 01 2026" }],
    ["rebuildDrill", { minutes: 0, asOf: at }],
    ["rebuildDrill", { minutes: 42, asOf: 20261101 }],
    ["nytka", { uptimePercent: -0.1, days: 30 }],
    ["nytka", { uptimePercent: 99.9, days: 0 }],
    ["nytka", { uptimePercent: 99.9, days: 0.5 }],
    ["nytka", { uptimePercent: 99.9, days: "13" }],
    ["agentChecks", { findings: -1, asOf: at }],
    ["agentChecks", { findings: null, asOf: at }],
    ["agentChecks", { findings: 2.5, asOf: at }],
  ];
  for (const [key, block] of bad) {
    const l = lab({ [key]: block }) as Record<string, unknown> | null | undefined;
    assert.equal(l?.[key], undefined, `${key} ${JSON.stringify(block)} should be dropped`);
    assert.ok(l && Object.keys(l).length === 3, `${key}: the other three stay`);
  }

  const allBad = parseStatus(
    { ...f, lab: { chargehand: { merged: "8" }, rebuildDrill: null, nytka: {}, agentChecks: [] } },
    NOW,
  );
  assert.ok(allBad);
  assert.equal(allBad.lab, null, "a lab block with nothing valid is null, not {}");

  const doc = parseStatus({ ...f, lab: "everything is fine" }, NOW);
  assert.ok(doc, "a malformed lab block never rejects the document");
  assert.equal(doc.lab, null);
});

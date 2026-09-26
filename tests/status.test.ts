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

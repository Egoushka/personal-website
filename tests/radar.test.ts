import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { checkAgainstSchema, loadRadarSchema } from "../lib/radar-schema.mjs";
import { parseRadar, getRadar, byRing } from "../lib/radar";

const entry = {
  name: "X",
  quadrant: "infra",
  ring: "adopt",
  since: "2026-11-19",
  reason: "why",
  repoKind: "personal",
};

test("content/radar.json validates against its schema", () => {
  const doc = JSON.parse(fs.readFileSync("content/radar.json", "utf8"));
  assert.deepEqual(checkAgainstSchema(doc, loadRadarSchema()), []);
});

test("the five hand-test cards are on the radar in the rings the trials gave", () => {
  const rings = byRing(getRadar());
  assert.deepEqual(rings.adopt.map((e) => e.name), ["Postgres 18.7 patch"]);
  assert.deepEqual(rings.trial.map((e) => e.name), ["MCP tool description trimming"]);
  assert.equal(rings.hold.length, 3);
  assert.equal(rings.assess.length, 0);
});

test("the schema rejects a bad ring, a work repo, an extra field and a missing reason", () => {
  const schema = loadRadarSchema();
  for (const bad of [
    { ...entry, ring: "maybe" },
    { ...entry, repoKind: "work" },
    { ...entry, extra: 1 },
    { ...entry, reason: undefined },
    { ...entry, since: "19 Nov" },
  ]) {
    assert.notDeepEqual(checkAgainstSchema({ entries: [JSON.parse(JSON.stringify(bad))] }, schema), []);
  }
  assert.deepEqual(checkAgainstSchema({ entries: [entry] }, schema), []);
});

test("parseRadar throws on a document that breaks the schema", () => {
  assert.throws(() => parseRadar({ entries: [{ ...entry, quadrant: "ops" }] }), /quadrant/);
});

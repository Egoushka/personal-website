import { test } from "node:test";
import assert from "node:assert/strict";
import { FLYING_LOADER, FLYING_CLICKS, FLYING_WINDOW_MS } from "../lib/flying";

/** Runs the inline loader against a fake document; `clicks` are [gap ms, matches .theme-toggle]. */
function run(clicks: Array<[number, boolean]>) {
  let handler: (e: unknown) => void = () => {};
  const imported: string[] = [];
  let now = 1_000_000;
  const doc = { addEventListener: (_: string, h: typeof handler) => (handler = h) };
  const D = { now: () => now };
  new Function("document", "Date", "import_", FLYING_LOADER.replace("import(", "import_("))(doc, D, (u: string) => {
    imported.push(u);
    return { then: () => {} };
  });
  for (const [gap, toggle] of clicks) {
    now += gap;
    handler({ target: { closest: (s: string) => (toggle && s === ".theme-toggle" ? {} : null) } });
  }
  return imported;
}

test("five quick theme clicks load the module", () => {
  assert.deepEqual(run(Array(FLYING_CLICKS).fill([200, true])), ["/flying.js"]);
});

test("four clicks do not", () => {
  assert.deepEqual(run(Array(FLYING_CLICKS - 1).fill([200, true])), []);
});

test("a slow gap restarts the count", () => {
  const slow: Array<[number, boolean]> = [[200, true], [200, true], [FLYING_WINDOW_MS + 1, true], [200, true], [200, true]];
  assert.deepEqual(run(slow), []);
});

test("clicks elsewhere are ignored", () => {
  assert.deepEqual(run(Array(10).fill([100, false])), []);
});

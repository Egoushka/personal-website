import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";

// deploy/prelive-guard.sh reads `rsync --dry-run --itemize-changes` and exits 1
// if the prelive sync would reach anything production owns.
const guard = (plan: string[]) =>
  spawnSync("bash", ["deploy/prelive-guard.sh"], { input: plan.join("\n") + "\n" }).status;

test("the prelive guard passes a sync that stays in the prelive root", () => {
  // The root's own line appears on every run: the build makes out/ fresh.
  assert.equal(guard([".d..t...... ./", ">f.st...... index.html", "*deleting   writing/old/"]), 0);
  assert.equal(guard(["cd+++++++++ ./", ">f+++++++++ writing/index.html"]), 0);
});

test("the prelive guard stops a sync whose root is wrong", () => {
  assert.equal(guard(["*deleting   site/index.html"]), 1);
  assert.equal(guard(["*deleting   Caddyfile"]), 1);
  assert.equal(guard(["*deleting   website/Caddyfile"]), 1);
  assert.equal(guard(["*deleting   status.json"]), 1);
  assert.equal(guard(["*deleting   .ssh/authorized_keys", "*deleting   .ssh/"]), 1);
});

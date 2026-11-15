import { test } from "node:test";
import assert from "node:assert/strict";
import { parseLabRows, reportSql, humanSessionsSql } from "../scripts/weekly-report.mjs";

test("lab's text table becomes one object per row", () => {
  const out = "sec       wk          a        n1\nsessions  2026-11-09  -        127\nchannels  2026-11-09  direct   45\n(2 rows)\n";
  assert.deepEqual(parseLabRows(out), [
    { sec: "sessions", wk: "2026-11-09", a: "-", n1: "127" },
    { sec: "channels", wk: "2026-11-09", a: "direct", n1: "45" },
  ]);
});

test("the report is one read statement lab will accept: no comments, no semicolons", () => {
  const sql = reportSql(4);
  assert.ok(/^with /.test(sql.trim()));
  assert.ok(!sql.includes("--") && !sql.includes(";"));
  assert.ok(sql.includes("interval '21 days'"), "4 weeks reach back to the Monday 3 weeks before this one");
});

test("the human rule keeps the documented thresholds", () => {
  const sql = humanSessionsSql(0);
  assert.ok(sql.includes("'800x600'"));
  assert.ok(sql.includes("pv >= 2 or late_events > 0"));
  assert.ok(sql.includes("interval '1 second'"));
});

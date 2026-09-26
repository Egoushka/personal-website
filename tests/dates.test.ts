import { test } from "node:test";
import assert from "node:assert/strict";
import { formatSpan, yearFraction } from "../lib/dates";
import { experience } from "../lib/site";

test("text form", () => {
  assert.equal(formatSpan({ start: "2025-08", end: null }), "Aug 2025 — present");
  assert.equal(formatSpan({ start: "2024-12", end: "2025-06" }), "Dec 2024 — Jun 2025");
  assert.equal(formatSpan({ start: "2021-01", end: "2021-12" }), "Jan 2021 — Dec 2021");
});

test("numeric form, the CV's", () => {
  assert.equal(formatSpan({ start: "2025-08", end: null }, "numeric"), "2025-08 — present");
  assert.equal(formatSpan({ start: "2024-12", end: "2025-06" }, "numeric"), "2024-12 — 2025-06");
});

test("anything that is not a real month throws, in either form", () => {
  for (const bad of ["2025-13", "2025-00", "2025-8", "Aug 2025", "2025-08-01", ""]) {
    assert.throws(() => formatSpan({ start: bad, end: null }), /YYYY-MM/, bad);
    assert.throws(() => formatSpan({ start: "2025-01", end: bad }, "numeric"), /YYYY-MM/, bad);
    assert.throws(() => yearFraction(bad), /YYYY-MM/, bad);
  }
});

test("yearFraction is the start of the month", () => {
  assert.equal(yearFraction("2025-01"), 2025);
  assert.equal(yearFraction("2025-07"), 2025.5);
  assert.equal(yearFraction("2024-12"), 2024 + 11 / 12);
});

test("every job on the record has real months, and ends no earlier than it starts", () => {
  for (const job of experience) {
    assert.doesNotThrow(() => formatSpan(job), job.company);
    if (job.end !== null) assert.ok(job.end >= job.start, `${job.company}: ${job.start} → ${job.end}`);
  }
});

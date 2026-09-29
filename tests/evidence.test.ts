import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { checkPack, figures, initPack, normalize, parsePack, statedFigures } from "../lib/evidence.mjs";

const values = (text: string) => figures(text).map((f) => f.value);

test("evidence: figures as prose writes them, one spelling each", () => {
  assert.deepEqual(values("It lost 48.2% to 62.8% on 37 questions."), ["48.2", "62.8", "37"]);
  assert.deepEqual(values("1,217 trades, $0.237 a night, 13.4× smaller, 2–4 nodes"), ["1217", "0.237", "13.4", "2", "4"]);
  assert.deepEqual(values("version 0.2.0 on 100.64.0.2"), ["0.2.0", "100.64.0.2"]);
  assert.equal(normalize("0.20"), normalize("0.2"));
  assert.equal(normalize("1,217"), normalize("1217"));
});

test("evidence: an identifier is not a figure", () => {
  assert.deepEqual(values("H4, cx53, UTF-16, gpt-4o, p@1, #5, v0.3.0, BGE-M3, ES2022"), []);
});

test("evidence: the claims are the title, the description and the prose — not code", () => {
  const stated = statedFigures({
    title: "Nothing had deployed for 51 days",
    description: "Three bugs over 2 months.",
    body: "The image was `pg16`, the flag `--budget 3`.\n\n```\nexit 128\n```\n\nIt took **48.2**% of the time.",
  });
  assert.deepEqual(stated.map((f) => [f.where, f.value]), [["title", "51"], ["description", "2"], ["body", "48.2"]]);
});

const PACK = [
  "# Evidence: a",
  "",
  "Thesis: Semantic search lost to grep before it tied.",
  "",
  "| Claim | Value | Source |",
  "|---|---|---|",
  "| first run, on 37 questions | 48.2% vs 62.8% | chronicle-archive@89b4e20 |",
  "| a figure the post dropped | 11× | TODO |",
].join("\n");

test("evidence: a pack covers the post's figures, and every row names a source", () => {
  const post = { title: "It lost 48.2% to 62.8%", description: "", body: "On 37 questions, written from memory." };
  const r = checkPack(post, parsePack(PACK));
  assert.equal(r.thesis, null);
  assert.deepEqual(r.missing, []);
  assert.deepEqual(r.unsourced.map((row) => row.line), [8]);
  assert.deepEqual(r.unused, ["11"]);

  const more = checkPack({ ...post, body: `${post.body} It finds 63.5% now.` }, parsePack(PACK));
  assert.deepEqual(more.missing.map((f) => f.raw), ["63.5"]);
  assert.match(checkPack(post, parsePack(PACK.replace(/^Thesis:.*$/m, ""))).thesis ?? "", /no Thesis/);
});

test("evidence: --init writes a row per distinct figure, with the thesis and every source to fill in", () => {
  const post = { title: "", description: "", body: "It was 51 days. Then 51 again, and 3." };
  const pack = parsePack(initPack("a", post));
  assert.deepEqual(pack.rows.map((r) => r.value), ["51", "3"]);
  const r = checkPack(post, pack);
  assert.deepEqual(r.missing, []);
  assert.equal(r.unsourced.length, 2);
  assert.match(r.thesis ?? "", /no Thesis/);
});

test("evidence: the command starts a pack once, and passes when it is filled in", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "evidence-"));
  const run = (...args: string[]) =>
    spawnSync(process.execPath, [path.resolve("scripts/evidence.mjs"), ...args], { cwd: dir, encoding: "utf8" });
  try {
    fs.mkdirSync(path.join(dir, "content", "drafts"), { recursive: true });
    fs.writeFileSync(
      path.join(dir, "content", "drafts", "a.md"),
      '---\ntitle: "It lost 48.2% to 62.8%"\ndescription: "x"\n---\n\nOn 37 questions.\n',
    );
    assert.match(run("a").stderr, /start one: npm run evidence -- a --init/);
    assert.equal(run("a", "--init").status, 0);
    assert.equal(run("a", "--init").status, 1);
    assert.equal(run("a").status, 1);
    fs.writeFileSync(path.join(dir, "content", "drafts", "a.evidence.md"), PACK.replace("| 11× | TODO |", "| 11× | a note |"));
    const done = run("a");
    assert.equal(done.status, 0, done.stdout + done.stderr);
    assert.match(done.stderr, /11 is in the pack but not in the post/);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync, spawnSync } from "node:child_process";
import {
  checkPack, derivedProblem, figures, followLines, initPack, missingNumber, normalize, numbersIn, parsePack, refProblem,
  refsIn, sourceChecker, statedFigures,
} from "../lib/evidence.mjs";

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

test("evidence: a chart's values and a diagram's labels are claims; its wiring is not", () => {
  const chart = JSON.stringify({
    type: "bar", title: "Recall", y: { unit: "%" }, caption: "On 71 questions.",
    series: [{ name: "grep", points: [["lookups", 41.8]] }], source: "a/b@1234567:c.md#L9",
  });
  const diagram = JSON.stringify({
    title: "Path", direction: "right", caption: "Three hops.",
    nodes: [{ id: "n1", label: "Edge", kind: "service" }], edges: [{ from: "n1", to: "n1", label: "TLS 1.3" }],
  });
  const stated = statedFigures({ title: "t", description: "d", body: `\`\`\`chart\n${chart}\n\`\`\`\n\n\`\`\`diagram\n${diagram}\n\`\`\`` });
  assert.deepEqual(stated.map((f) => f.value), ["71", "41.8", "1.3"]);
  assert.ok(stated.every((f) => f.where === "body"));
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

// ── --verify: opening a source ──────────────────────────────────────────────

test("evidence: a ref is a file at a commit, with an optional line range", () => {
  const [a, b, c, d] = refsIn(
    "B = Egoushka/chargehand@b566890:docs/benchmarks.md#L104-130, and " +
      "`x/y.js@0123456789abcdef0123456789abcdef01234567:src/a-b.ts#L7`; see o/r@abcdef1:README.md. " +
      "Or github.com/o/r@abcdef1:x.md#L12-L40.",
  );
  assert.deepEqual([a.repo, a.sha, a.path, a.from, a.to], ["Egoushka/chargehand", "b566890", "docs/benchmarks.md", 104, 130]);
  assert.deepEqual([b.repo, b.path, b.from, b.to], ["x/y.js", "src/a-b.ts", 7, 7]);
  assert.deepEqual([c.path, c.from], ["README.md", undefined], "the full stop is the sentence's");
  assert.deepEqual([d.repo, d.from, d.to], ["o/r", 12, 40], "GitHub's spelling of a range");
  // No owner; a sha under seven characters; a commit with no file.
  assert.deepEqual(refsIn("chargehand@b566890:docs/x.md, o/r@abc12:x.md, commit c84ed91"), []);

  assert.equal(refProblem("Egoushka/chronicle@741dbb1:README.md#L150-152"), null);
  assert.match(refProblem("chronicle's README") ?? "", /is not owner\/repo@<sha>:path/);
  assert.match(refProblem("o/r@abcdef1:x.md, and a note") ?? "", /is not owner\/repo@<sha>:path/);
  assert.match(refProblem("o/r@abcdef1:x.md#L9-3") ?? "", /a line range starts at line 1 or later and runs forward/);
  assert.match(refProblem("o/r@abcdef1:x.md#L0") ?? "", /a line range/);
});

test("evidence: a Value's numbers, one spelling each, units and signs as a reader means them", () => {
  const nums = (text: string) => numbersIn(text).map((n) => n.value);
  assert.deepEqual(
    nums("681,331 messages · 13, 11, 11 · $0.199 · 28% · 1.53× · 3x · 351k · 0.950 · #19"),
    ["681331", "13", "11", "11", "0.199", "28", "1.53", "3", "351", "0.95", "19"],
  );
  assert.deepEqual(nums("−0.021 and -0.43, (−2), UTF-16, a-5, 2026-09-27, 5–8, v0.3.0"), [
    "-0.021", "-0.43", "-2", "16", "5", "2026", "9", "27", "5", "8", "0.3.0",
  ]);
  assert.deepEqual(numbersIn("lost −0.021").map((n) => n.raw), ["−0.021"], "raw is as written");
});

test("evidence: every number in the Value must be in the file, as a whole number", () => {
  const file = "| blind score | 0.333 | 0.667 |\ncost $0.205, 681,331 rows, Sharpe −0.021, version 0.3.0, 0.5";
  assert.equal(missingNumber("0.333 vs 0.667", file), null);
  assert.equal(missingNumber("681331 messages at $0.205", file), null);
  assert.equal(missingNumber("0.333 vs 0.668", file), "0.668");
  assert.equal(missingNumber("5", file), "5", "0.5 does not state 5");
  assert.equal(missingNumber("3", file), "3", "nor does 0.333, or 0.3.0");
  assert.equal(missingNumber("0.3", file), "0.3", "0.3.0 is a version, not 0.3");
  assert.equal(missingNumber("−0.021", file), null);
  assert.equal(missingNumber("lost 0.021", file), null, "a negative number states its size too");
  assert.equal(missingNumber("−0.667", file), "−0.667", "but a sign in the Value has to be in the file");
  assert.equal(missingNumber("none, deliberately", file), null);
});

test("evidence: a derived row is arithmetic over literal numbers, rounded as the Value writes it", () => {
  assert.equal(derivedProblem("0.257 / 0.201", "1.28×"), null);
  assert.equal(derivedProblem(" (0.257 / 0.201 - 1) * 100 ", "28% more"), null);
  assert.equal(derivedProblem("63.5 - 62.8", "0.7 points"), null);
  assert.equal(derivedProblem("1 - -2", "3"), null);
  assert.equal(derivedProblem("0.257 / 0.201", "1.29×"), "= 0.257 / 0.201 gives 1.28");
  assert.equal(derivedProblem("1 / 0", "1"), "= 1 / 0 gives Infinity");
  for (const formula of ["0.257 / x", "1,217 / 2", "2 ** 3", "(1 + 2", "0.1.2", ""]) {
    assert.match(derivedProblem(formula, "1") ?? "", /is not arithmetic over literal numbers/, formula);
  }
  assert.match(derivedProblem("1 / 3", "one third") ?? "", /the value has no number to compare/);
});

test("evidence: the checker opens each file once, and skips what only a reader can check", async () => {
  const files: Record<string, string> = {
    "o/r@abcdef1:bench.md": "intro\n| cost | $0.199 | $0.205 |\n| score | 0.333 | 0.667 |\n",
    "o/r@HEAD:bench.md": "| score | 0.333 | 0.7 |\n",
  };
  const opened: string[] = [];
  const check = sourceChecker(async (repo, rev, file) => {
    opened.push(`${repo}@${rev}:${file}`);
    const text = files[`${repo}@${rev}:${file}`];
    if (text === undefined) throw new Error("answered 404");
    return text;
  });
  const says = async (source: string, value: string, latest = false) => {
    const v = await check(source, value, { latest });
    return `${v.status}${v.detail && ` ${v.detail}`}${v.where}`;
  };

  assert.equal(await says("o/r@abcdef1:bench.md#L3", "0.333 vs 0.667"), "ok in o/r@abcdef1:bench.md#L3");
  assert.equal(await says("B, o/r@abcdef1:bench.md#L3, the score row", "0.199"), "MISSING 0.199 in o/r@abcdef1:bench.md#L3");
  assert.equal(await says("o/r@abcdef1:bench.md", "$0.199 vs $0.205"), "ok in o/r@abcdef1:bench.md");
  assert.equal(await says("o/r@abcdef1:bench.md#L2-9", "0.199"), "FETCH FAILED bench.md ends at line 3, before #L9 in o/r@abcdef1:bench.md#L2-9");
  assert.equal(await says("o/r@abcdef1:gone.md", "1"), "FETCH FAILED answered 404 in o/r@abcdef1:gone.md");
  assert.equal(await says("= 0.257 / 0.201", "1.28×"), "ok = 0.257 / 0.201");
  assert.equal(await says("= 0.257 / 0.201", "1.29×"), "DERIVED MISMATCH = 0.257 / 0.201 gives 1.28");
  assert.equal(await says("the gateway's spend log, 2026-09-27", "$0.199"), "skipped (not machine-checkable)");
  // --latest reads the default branch too, where the score row is now line 1.
  assert.equal(await says("o/r@abcdef1:bench.md#L3", "0.333 vs 0.667", true), "DRIFT 0.667 in o/r@HEAD:bench.md#L1");
  assert.deepEqual(opened, ["o/r@abcdef1:bench.md", "o/r@abcdef1:gone.md", "o/r@HEAD:bench.md"]);
});

test("evidence: --latest follows the lines a ref names to the default branch", async () => {
  const files: Record<string, string> = {
    "o/r@abcdef1:README.md": ["# Skills", "", "| a | ≈1.2k |", "", "All 26 skills cost ≈3.3k tokens.", ""].join("\n"),
    "o/r@HEAD:README.md": [
      "# Skills", "", "| a | ≈1.2k |", "| b | ≈26 |", "| c | ≈3.3k |", "", "All 36 skills cost ≈3.7k tokens.", "",
    ].join("\n"),
  };
  const check = sourceChecker(async (repo, rev, file) => files[`${repo}@${rev}:${file}`]);
  // The sentence was rewritten; a 26 and a 3.3k in rows added since do not stand in for it.
  const sentence = await check("o/r@abcdef1:README.md#L5", "26", { latest: true });
  assert.deepEqual([sentence.status, sentence.detail, sentence.where], ["DRIFT", "26", " in o/r@HEAD:README.md#L7"]);
  const row = await check("o/r@abcdef1:README.md#L3", "≈1.2k tokens", { latest: true });
  assert.deepEqual([row.status, row.where], ["ok", " in o/r@HEAD:README.md#L3"]);
  // A ref that names no lines is read whole, where another row's 26 still stands.
  assert.equal((await check("o/r@abcdef1:README.md", "26", { latest: true })).status, "ok");

  assert.deepEqual(followLines(["x", "gone", "y"], ["x", "y"], 2, 2), [], "deleted lines map to none");
  assert.deepEqual(followLines(["x", "y"], ["x", "new", "y"], 1, 2), [0, 1, 2], "a range keeps what was added inside it");
  assert.deepEqual(followLines(["a"], ["b", "c"], 1, 1), [0, 1], "nothing left in common: the whole file");
});

/**
 * A git repository with a commit per snapshot of its files, each the parent of the
 * next, and `origin/main` on the last. Plumbing, so no hook, signing or identity
 * setting of the machine running the tests applies.
 */
function repository(...snapshots: Record<string, string>[]) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "evidence-repo-"));
  const env = { ...process.env, GIT_AUTHOR_NAME: "t", GIT_AUTHOR_EMAIL: "t@example.com", GIT_COMMITTER_NAME: "t", GIT_COMMITTER_EMAIL: "t@example.com" };
  const git = (args: string[], input?: string) =>
    execFileSync("git", ["-C", dir, ...args], { input, env, encoding: "utf8", stdio: ["pipe", "pipe", "ignore"] }).trim();
  git(["-c", "init.defaultBranch=main", "init", "-q"]);
  const shas: string[] = [];
  for (const files of snapshots) {
    const entries = Object.entries(files).map(([name, text]) => `100644 blob ${git(["hash-object", "-w", "--stdin"], text)}\t${name}\n`);
    const parent = shas.length > 0 ? ["-p", shas[shas.length - 1]] : [];
    shas.push(git(["commit-tree", "--no-gpg-sign", git(["mktree"], entries.join("")), ...parent, "-m", "x"]));
  }
  git(["update-ref", "refs/remotes/origin/main", shas[shas.length - 1]]);
  return { dir, shas: shas.map((sha) => sha.slice(0, 7)) };
}

test("evidence: --verify opens a ref in the clone .evidence-repos.json names, with no network", () => {
  const clone = repository({ "bench.md": "| score | 0.333 | 0.667 |\n| cost | $0.257 | $0.201 |\n" });
  const [sha] = clone.shas;
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "evidence-"));
  const run = (...args: string[]) =>
    spawnSync(process.execPath, [path.resolve("scripts/evidence.mjs"), ...args], { cwd: dir, encoding: "utf8" });
  const pack = (score: string, ratio: string, at = sha) =>
    [
      "Thesis: It lost the blind test, and cost more.",
      "",
      "| Claim | Value | Source |",
      "|---|---|---|",
      `| blind score | ${score} | o/r@${at}:bench.md#L1, the score row |`,
      `| cost ratio | ${ratio} | = 0.257 / 0.201 |`,
      "| cost per run | $0.257 vs $0.201 | the gateway's spend log |",
    ].join("\n");
  const drafts = path.join(dir, "content", "drafts");
  try {
    fs.mkdirSync(drafts, { recursive: true });
    fs.writeFileSync(
      path.join(drafts, "a.md"),
      '---\ntitle: "It lost 0.333 to 0.667"\ndescription: "x"\n---\n\nAt $0.257 against $0.201, 1.28× the cost.\n',
    );
    fs.writeFileSync(path.join(drafts, ".evidence-repos.json"), JSON.stringify({ "o/r": clone.dir }));
    fs.writeFileSync(path.join(drafts, "a.evidence.md"), pack("0.333 vs 0.667", "1.28×"));

    const offline = run("a");
    assert.equal(offline.status, 0, offline.stdout + offline.stderr);
    assert.doesNotMatch(offline.stdout, /opened/, "without --verify no source is opened");

    const ok = run("a", "--verify");
    assert.equal(ok.status, 0, ok.stdout + ok.stderr);
    assert.match(ok.stdout, new RegExp(`a\\.evidence\\.md:5: ok — "0\\.333 vs 0\\.667" in o/r@${sha}:bench\\.md#L1\\n`));
    assert.match(ok.stdout, /a\.evidence\.md:6: ok — "1\.28×" = 0\.257 \/ 0\.201\n/);
    assert.match(ok.stdout, /a\.evidence\.md:7: skipped \(not machine-checkable\) — "\$0\.257 vs \$0\.201"\n/);
    assert.match(ok.stdout, /3 row\(s\) opened: 2 ok, 0 MISSING, 0 DERIVED MISMATCH, 0 FETCH FAILED, 1 skipped/);

    fs.writeFileSync(path.join(drafts, "a.evidence.md"), pack("0.333 vs 0.668", "1.29×"));
    const wrong = run("a", "--verify");
    assert.equal(wrong.status, 1, wrong.stdout + wrong.stderr);
    assert.match(wrong.stderr, /ERROR content\/drafts\/a\.evidence\.md:5: MISSING 0\.668 — "0\.333 vs 0\.668" in o\/r@/);
    assert.match(wrong.stderr, /ERROR content\/drafts\/a\.evidence\.md:6: DERIVED MISMATCH = 0\.257 \/ 0\.201 gives 1\.28 — "1\.29×"/);

    fs.writeFileSync(path.join(drafts, "a.evidence.md"), pack("0.333 vs 0.667", "1.28×", "0000000"));
    const gone = run("a", "--verify");
    assert.equal(gone.status, 1, gone.stdout + gone.stderr);
    assert.match(gone.stderr, /ERROR content\/drafts\/a\.evidence\.md:5: FETCH FAILED .+ in o\/r@0000000:bench\.md#L1/);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
    fs.rmSync(clone.dir, { recursive: true, force: true });
  }
});

test("readings: a reading's ref is opened at its commit, and --latest warns where the default branch moved on", () => {
  const clone = repository({ "README.md": "87 countries, 197 defects fixed.\n" }, { "README.md": "87 countries, 204 defects fixed.\n" });
  const [old] = clone.shas;
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "readings-"));
  const run = (...args: string[]) =>
    spawnSync(process.execPath, [path.resolve("scripts/readings.mjs"), ...args], { cwd: dir, encoding: "utf8" });
  const site = (ref: string) =>
    [
      "export const projects: Project[] = [",
      "  {",
      '    slug: "attest",',
      "    readings: [",
      `      { label: "Countries", value: "87", source: "the package description", ref: "o/r@${old}:README.md#L1" },`,
      `      { label: "Defects fixed", value: "197", source: "the package description", ref: "${ref}" },`,
      '      { label: "Users", value: "1 — me", source: "counted" },',
      "    ],",
      "  },",
      "];",
      "",
    ].join("\n");
  try {
    fs.mkdirSync(path.join(dir, "lib"));
    fs.mkdirSync(path.join(dir, "content", "drafts"), { recursive: true });
    fs.writeFileSync(path.join(dir, "content", "drafts", ".evidence-repos.json"), JSON.stringify({ "o/r": clone.dir }));
    fs.writeFileSync(path.join(dir, "lib", "site.ts"), site(`o/r@${old}:README.md`));

    const pinned = run();
    assert.equal(pinned.status, 0, pinned.stdout + pinned.stderr);
    assert.match(pinned.stdout, new RegExp(`lib/site\\.ts:5: ok — attest "Countries": "87" in o/r@${old}:README\\.md#L1\\n`));
    assert.match(pinned.stdout, /\n2 reading\(s\) with a ref — 0 error\(s\), 0 warning\(s\)/);

    const latest = run("--latest");
    assert.equal(latest.status, 0, "drift warns: the reading still holds at its commit");
    assert.match(latest.stderr, /warn {2}lib\/site\.ts:6: DRIFT 197 — attest "Defects fixed": "197" in o\/r@HEAD:README\.md/);
    assert.doesNotMatch(latest.stderr, /site\.ts:5/, "87 is still on the default branch");
    assert.match(latest.stdout, /2 reading\(s\) with a ref, each also read on its default branch — 0 error\(s\), 1 warning\(s\)/);

    fs.writeFileSync(path.join(dir, "lib", "site.ts"), site(`o/r@${old}:README.md#L2`));
    const past = run();
    assert.equal(past.status, 1, past.stdout + past.stderr);
    assert.match(past.stderr, /ERROR lib\/site\.ts:6: FETCH FAILED README\.md ends at line 1, before #L2/);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
    fs.rmSync(clone.dir, { recursive: true, force: true });
  }
});

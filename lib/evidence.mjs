// The evidence pack: every figure a post states, next to where it came from
// (docs/writing/README.md), and the sources a machine can open to check one.
// Pure functions, so the tests can run them on strings, but for `sourceReader`,
// which reaches git and the network: the checker takes the reader as an argument,
// so the tests pass their own. The scripts read the files. Plain JavaScript so
// scripts/evidence.mjs and scripts/readings.mjs run under bare `node`, like the
// validator.
import { spawnSync } from "node:child_process";
import { parseMarkdown } from "./markdown.mjs";

/**
 * A figure as prose writes it: `37`, `1,217`, `48.2`, `$0.237`, and a dotted run
 * like `0.2.0` or `100.64.0.2` as one figure rather than three.
 *
 * Digits glued to a letter, or after a dot, slash, `@` or `#`, are an identifier,
 * not a claim: `H4`, `cx53`, `UTF-16`, `gpt-4o`, `p@1`, `#5`. A number written as
 * a word ("fifty-one") is a claim too, and invisible here; the review reads those.
 */
const FIGURE =
  /(?<![\p{L}\p{N}_./@#]|\p{L}-)[$€£]?(\d+(?:\.\d+){2,}|\d{1,3}(?:,\d{3})+(?:\.\d+)?|\d+(?:\.\d+)?)/gu;
const DOTTED = /^\d+(?:\.\d+){2,}$/;

/**
 * One spelling per figure, so the post and the pack can write it differently:
 * `1,217` and `1217` match, `0.20` and `0.2` match, a dotted run matches exactly.
 * @param {string} raw
 */
export function normalize(raw) {
  const f = raw.replace(/^[$€£]/, "").replaceAll(",", "");
  return DOTTED.test(f) ? f : String(Number(f));
}

/**
 * Every figure in a string, in order.
 * @param {string} text
 * @returns {{ raw: string, value: string, index: number }[]}
 */
export function figures(text) {
  return [...text.matchAll(FIGURE)].map((m) => ({ raw: m[0], value: normalize(m[1]), index: m.index }));
}

// Nodes whose children are inline, as in lib/markdown.mjs: they join without a
// space, so `**48.2**%` stays one figure with its sign.
const INLINE_PARENTS = new Set([
  "paragraph", "heading", "tableCell", "emphasis", "strong", "delete", "link", "linkReference",
]);

// What a figure block says that is not wiring: its own source, its type and its ids.
const FIGURE_WIRING = new Set(["source", "type", "kind", "direction", "id", "from", "to", "unit"]);

/**
 * The words and numbers a chart or diagram states, in reading order: its title,
 * caption, labels and every value are claims like the prose's (ADR 0010).
 * @param {string} json
 */
function figureText(json) {
  /** @param {any} v @returns {string[]} */
  const leaves = (v) =>
    Array.isArray(v)
      ? v.flatMap(leaves)
      : v && typeof v === "object"
        ? Object.entries(v).flatMap(([k, x]) => (FIGURE_WIRING.has(k) ? [] : leaves(x)))
        : v === undefined || v === null ? [] : [String(v)];
  try {
    return ` ${leaves(JSON.parse(json)).join(" · ")} `;
  } catch {
    return " ";
  }
}

/**
 * The prose a reader reads as claims: text, not code. Unlike the word count,
 * inline code is left out — `pg16` and `--budget 3` are names, not figures.
 * @param {any} node
 * @returns {string}
 */
function claimText(node) {
  if (node.type === "text") return node.value;
  if (node.type === "code" && (node.lang === "chart" || node.lang === "diagram")) return figureText(node.value);
  if (node.type === "inlineCode" || !node.children) return " ";
  const sep = INLINE_PARENTS.has(node.type) ? "" : " ";
  return sep + node.children.map(claimText).join(sep) + sep;
}

/** About forty characters either side of a figure, on one line, in whole words. */
function around(text, index, length) {
  let from = Math.max(0, index - 40);
  let to = Math.min(text.length, index + length + 40);
  if (from > 0) from = text.indexOf(" ", from) + 1 || from;
  if (to < text.length) to = Math.max(text.lastIndexOf(" ", to), index + length);
  return text.slice(from, to).replace(/\s+/g, " ").trim();
}

/**
 * Every figure a post states — in the title, the description and the prose —
 * with a line of context, in reading order.
 * @param {{ title: string, description: string, body: string }} post
 */
export function statedFigures(post) {
  const parts = [
    ["title", post.title],
    ["description", post.description],
    ["body", claimText(parseMarkdown(post.body))],
  ];
  return parts.flatMap(([where, text]) =>
    figures(text).map((f) => ({ ...f, where, context: around(text, f.index, f.raw.length) })),
  );
}

/**
 * A pack: the `Thesis:` line and the rows of its Claim | Value | Source table.
 * @param {string} markdown
 */
export function parsePack(markdown) {
  const thesis = markdown.match(/^Thesis:[ \t]*(.*)$/m)?.[1].trim() ?? "";
  /** @type {{ claim: string, value: string, source: string, line: number }[]} */
  const rows = [];
  markdown.split("\n").forEach((line, i) => {
    if (!line.trimStart().startsWith("|")) return;
    const cells = line.trim().replace(/^\||\|$/g, "").split(/(?<!\\)\|/).map((c) => c.trim());
    if (cells.every((c) => /^:?-{3,}:?$/.test(c))) return; // the separator row
    if (cells[0].toLowerCase() === "claim") return; // the header row
    const [claim = "", value = "", source = ""] = cells;
    rows.push({ claim, value, source, line: i + 1 });
  });
  return { thesis, rows };
}

/** A source that is still a promise. */
const UNSOURCED = /^(|todo\b.*|tbd\b.*|\?+)$/i;

/**
 * What the pack does not cover. A figure is covered when it appears in any row's
 * Claim or Value; a row is sourced when its Source says something other than a
 * placeholder. `unused` are Value figures the post no longer states.
 * @param {{ title: string, description: string, body: string }} post
 * @param {ReturnType<typeof parsePack>} pack
 */
export function checkPack(post, pack) {
  const covered = new Set(pack.rows.flatMap((r) => figures(`${r.claim} ${r.value}`).map((f) => f.value)));
  const stated = statedFigures(post);
  const statedValues = new Set(stated.map((f) => f.value));

  const missing = [];
  const reported = new Set();
  for (const f of stated) {
    if (covered.has(f.value) || reported.has(f.value)) continue;
    reported.add(f.value);
    missing.push(f);
  }

  const values = new Set(pack.rows.flatMap((r) => figures(r.value).map((f) => f.value)));
  return {
    thesis: !pack.thesis || /^todo\b/i.test(pack.thesis)
      ? "no Thesis: line — the post in one sentence, before the prose"
      : null,
    missing,
    unsourced: pack.rows.filter((r) => UNSOURCED.test(r.source)),
    unused: [...values].filter((v) => !statedValues.has(v)),
    stated: stated.length,
    rows: pack.rows.length,
  };
}

const cell = (/** @type {string} */ s) => s.replaceAll("|", "\\|");

/**
 * A new pack. With the post, one row per distinct figure it states, the Claim
 * cell holding the figure's context and every Source a TODO for the writer.
 * @param {string} slug
 * @param {{ title: string, description: string, body: string }} [post]
 */
export function initPack(slug, post) {
  const rows = [];
  const seen = new Set();
  for (const f of post ? statedFigures(post) : []) {
    if (seen.has(f.value)) continue;
    seen.add(f.value);
    rows.push(`| ${cell(f.context)} | ${cell(f.raw)} | TODO |`);
  }
  return [
    `# Evidence: ${slug}`,
    "",
    "Thesis: TODO — the post in one sentence. If it takes two, it is two posts.",
    "",
    "Every figure the post states, and where it came from: a commit, a file at a",
    `commit, a URL, or a command and its output. \`npm run evidence -- ${slug}\` fails`,
    "on a figure in the post that is not in this table, and on a row without a source.",
    "This file stays local (content/drafts/ is gitignored): a source may name a private repo.",
    "",
    "| Claim | Value | Source |",
    "|---|---|---|",
    ...rows,
    "",
  ].join("\n");
}

// ── Opening a source: --verify, and the readings on the project pages ───────

/**
 * A source a machine can open: `owner/repo@<sha>:path`, a file at a commit of a
 * repository on GitHub, with an optional line range, `#L12` or `#L12-40` (or
 * GitHub's `#L12-L40`). In a pack it sits anywhere in the Source cell, among the
 * words a reader needs; a reading's `ref` is one and nothing else. A path ends on
 * a letter, digit, `_` or `-`, so the full stop after one is the sentence's.
 */
const REF = /(?<![\w.-])([\w.-]+\/[\w.-]+)@([0-9a-f]{7,40}):([\w./-]*[\w-])(?:#L(\d+)(?:-L?(\d+))?)?/g;

/**
 * Every ref in a string, in order.
 * @param {string} text
 * @returns {{ text: string, repo: string, sha: string, path: string, from?: number, to?: number }[]}
 */
export function refsIn(text) {
  return [...text.matchAll(REF)].map((m) => ({
    text: m[0],
    repo: m[1],
    sha: m[2],
    path: m[3],
    ...(m[4] ? { from: Number(m[4]), to: Number(m[5] ?? m[4]) } : {}),
  }));
}

/** @param {{ text: string, from?: number, to?: number }} ref */
function rangeProblem(ref) {
  if (ref.from === undefined || ref.to === undefined || (ref.from >= 1 && ref.to >= ref.from)) return null;
  return `"${ref.text}": a line range starts at line 1 or later and runs forward`;
}

/**
 * What is wrong with a string that has to be one ref and nothing else, as a
 * reading's `ref` is, or null.
 * @param {string} text
 */
export function refProblem(text) {
  const [ref] = refsIn(text);
  if (!ref || ref.text !== text) {
    return `"${text}" is not owner/repo@<sha>:path — a 7 to 40 character sha, then an optional #L12 or #L12-40`;
  }
  return rangeProblem(ref);
}

/**
 * A number as a file or a Value writes it. Unlike `FIGURE`, one glued to a letter
 * counts — `v0.3.0`, `351k`, `3x`, `#19` — and the `$`, `%`, `×` or unit beside it
 * is not part of it. A dotted run like `0.3.0` is one number, and a number never
 * starts inside another: there is no `5` in `0.5`.
 */
const NUMBER = /(?<![\d.])(?:\d+(?:\.\d+){2,}|\d{1,3}(?:,\d{3})+(?!\d)(?:\.\d+)?|\d+(?:\.\d+)?)/g;

/**
 * Every number in a string, spelled as `normalize` spells a figure — `681,331` is
 * `681331`, `0.950` is `0.95` — and signed by a `-` or `−` right before it that
 * does not follow a letter, a digit or a closing bracket: `−0.021` is `-0.021`,
 * while `2026-09-27` is three numbers and `UTF-16` holds a 16. `raw` is the number
 * as written.
 * @param {string} text
 * @returns {{ raw: string, value: string }[]}
 */
export function numbersIn(text) {
  const plain = text.replaceAll("\u2212", "-"); // one UTF-16 unit for another, so indices hold
  return [...plain.matchAll(NUMBER)].map((m) => {
    const minus = plain[m.index - 1] === "-" && !/[\p{L}\p{N}_)\]]/u.test(plain[m.index - 2] ?? "");
    return {
      raw: text.slice(minus ? m.index - 1 : m.index, m.index + m[0].length),
      value: (minus ? "-" : "") + normalize(m[0]),
    };
  });
}

/**
 * The numbers a text states. A negative one states its size too, so "lost 0.021"
 * is backed by a `−0.021`; a `−0.021` needs its sign.
 * @param {string} text
 */
function stated(text) {
  return new Set(numbersIn(text).flatMap(({ value: v }) => (v.startsWith("-") ? [v, v.slice(1)] : [v])));
}

/**
 * The first number of a Value that a text does not state, as the Value writes it,
 * or null when the text states them all.
 * @param {string} value
 * @param {string} text
 */
export function missingNumber(value, text) {
  const has = stated(text);
  return numbersIn(value).find((n) => !has.has(n.value))?.raw ?? null;
}

/**
 * A derived row's formula, worked out: arithmetic over literal numbers — digits,
 * `.`, `+ - * /`, parentheses and spaces — so no name, unit or comma can carry a
 * claim into it. Throws what is wrong with it.
 * @param {string} formula
 * @returns {number}
 */
export function arithmetic(formula) {
  if (!/^[\d.+\-*/() ]*$/.test(formula)) throw new Error("only digits, . + - * / ( ) and spaces");
  const tokens = formula.match(/\d+(?:\.\d+)?|\.\d+|\S/g) ?? [];
  let i = 0;
  const sum = () => {
    let v = product();
    while (tokens[i] === "+" || tokens[i] === "-") v = tokens[i++] === "+" ? v + product() : v - product();
    return v;
  };
  const product = () => {
    let v = operand();
    while (tokens[i] === "*" || tokens[i] === "/") v = tokens[i++] === "*" ? v * operand() : v / operand();
    return v;
  };
  /** @returns {number} */
  const operand = () => {
    const t = tokens[i++];
    if (t === "-") return -operand();
    if (t === "(") {
      const v = sum();
      if (tokens[i++] !== ")") throw new Error("a ( that is never closed");
      return v;
    }
    if (t !== undefined && /\d/.test(t)) return Number(t);
    throw new Error(t === undefined ? "it ends where a number belongs" : `"${t}" where a number belongs`);
  };
  const result = sum();
  if (i < tokens.length) throw new Error(`"${tokens[i]}" where the formula should end`);
  return result;
}

/**
 * What is wrong with a derived row, or null: its formula has to give the Value's
 * first number, to the decimal places the Value writes. `= 0.257 / 0.201` backs
 * `1.28×`; `28%` wants `= (0.257 / 0.201 - 1) * 100`.
 * @param {string} formula the Source after its `=`
 * @param {string} value
 */
export function derivedProblem(formula, value) {
  const f = formula.trim();
  const shown = f ? `= ${f}` : "=";
  let result;
  try {
    result = arithmetic(f);
  } catch (e) {
    return `${shown} is not arithmetic over literal numbers: ${e instanceof Error ? e.message : e}`;
  }
  const [first] = numbersIn(value);
  if (!first) return `${shown}, but the value has no number to compare`;
  const places = first.raw.split(".")[1]?.length ?? 0;
  // Within half a unit of the last place the Value writes is what rounding to it means.
  if (Math.abs(result - Number(first.value)) <= 0.5 * 10 ** -places + 1e-9) return null;
  return `${shown} gives ${Number.isFinite(result) ? result.toFixed(places) : result}`;
}

/**
 * How the scripts open a ref: `git show` in the local clone `.evidence-repos.json`
 * names for the repository, else raw.githubusercontent.com, which serves a public
 * repository's files by commit without a token; a private one needs its clone.
 * `HEAD` as the revision is the default branch — raw.githubusercontent.com reads
 * it so, and a clone's is `origin/HEAD`, or `origin/main` where that is unset.
 * @param {Record<string, string>} clones "owner/repo" → an absolute path to its clone
 * @returns {(repo: string, rev: string, file: string) => Promise<string>}
 */
export function sourceReader(clones) {
  return async (repo, rev, file) => {
    const clone = clones[repo];
    if (!clone) {
      const res = await fetch(`https://raw.githubusercontent.com/${repo}/${rev}/${file}`, {
        signal: AbortSignal.timeout(30_000),
      });
      if (res.status === 404) {
        throw new Error("raw.githubusercontent.com answered 404: no such file at that commit, or a private repository without a clone in .evidence-repos.json");
      }
      if (!res.ok) throw new Error(`raw.githubusercontent.com answered ${res.status}`);
      return res.text();
    }
    let problem = "";
    for (const at of rev === "HEAD" ? ["origin/HEAD", "origin/main"] : [rev]) {
      const git = spawnSync("git", ["-C", clone, "show", `${at}:${file}`], { encoding: "utf8", maxBuffer: 64 << 20 });
      if (git.status === 0) return git.stdout;
      problem = git.error?.message ?? git.stderr.trim().split("\n")[0];
    }
    throw new Error(problem);
  };
}

/** Why a file could not be opened, in one line: fetch keeps the network's reason in `cause`. */
function reason(/** @type {any} */ e) {
  return String(e?.cause?.message ?? e?.message ?? e).split("\n")[0];
}

/** A file's lines, without the empty one after its last newline. */
function linesOf(/** @type {string} */ text) {
  const lines = text.split("\n");
  if (lines.at(-1) === "") lines.pop();
  return lines;
}

/**
 * The lines a ref names, or the whole file when it names none.
 * @param {string} text
 * @param {{ text: string, path: string, from?: number, to?: number }} ref
 */
function cut(text, ref) {
  if (ref.from === undefined || ref.to === undefined) return text;
  const bad = rangeProblem(ref);
  if (bad) throw new Error(bad);
  const lines = linesOf(text);
  if (ref.to > lines.length) throw new Error(`${ref.path} ends at line ${lines.length}, before #L${ref.to}`);
  return lines.slice(ref.from - 1, ref.to).join("\n");
}

/**
 * Where lines `from` to `to` of a file went in a later version of it: the span from
 * the first to the last line of `now` that a longest-common-subsequence diff matches
 * to them or puts in place of them. Line numbers move, and a number can outlive its
 * sentence elsewhere in the file, so following the lines is how a reading's
 * statement is found on the default branch. Empty when the lines were deleted.
 * Past four million line pairs the middle of the two files goes unmatched, and a
 * range there maps to all of that middle.
 * @param {string[]} old
 * @param {string[]} now
 * @param {number} from 1-based, inclusive
 * @param {number} to
 * @returns {number[]} indices into `now`, in order
 */
export function followLines(old, now, from, to) {
  let head = 0;
  while (head < old.length && head < now.length && old[head] === now[head]) head++;
  let tail = 0;
  while (tail < old.length - head && tail < now.length - head && old.at(-1 - tail) === now.at(-1 - tail)) tail++;
  /** @type {number[]} the index in `now` of each line of `old`, or -1 */
  const match = old.map((_, i) => (i < head ? i : i >= old.length - tail ? i - old.length + now.length : -1));
  const a = old.slice(head, old.length - tail);
  const b = now.slice(head, now.length - tail);
  if (a.length * b.length <= 4_000_000) {
    const lcs = Array.from({ length: a.length + 1 }, () => new Uint32Array(b.length + 1));
    for (let i = a.length - 1; i >= 0; i--) {
      for (let j = b.length - 1; j >= 0; j--) {
        lcs[i][j] = a[i] === b[j] ? lcs[i + 1][j + 1] + 1 : Math.max(lcs[i + 1][j], lcs[i][j + 1]);
      }
    }
    for (let i = 0, j = 0; i < a.length && j < b.length; ) {
      if (a[i] === b[j]) match[head + i++] = head + j++;
      else if (lcs[i + 1][j] >= lcs[i][j + 1]) i++;
      else j++;
    }
  }
  let lo = Infinity;
  let hi = -1;
  for (let i = from - 1; i < to; i++) {
    let [first, last] = [match[i], match[i]];
    if (match[i] < 0) {
      // Unmatched: whatever sits between the matches either side of it.
      let before = i - 1;
      while (before >= 0 && match[before] < 0) before--;
      let after = i + 1;
      while (after < old.length && match[after] < 0) after++;
      first = before >= 0 ? match[before] + 1 : 0;
      last = (after < old.length ? match[after] : now.length) - 1;
    }
    if (first <= last) [lo, hi] = [Math.min(lo, first), Math.max(hi, last)];
  }
  return hi < lo ? [] : Array.from({ length: hi - lo + 1 }, (_, k) => lo + k);
}

/**
 * Checks a Value against its Source, for `--verify` and `npm run readings`. The refs
 * in a Source are opened with `read` — each file once, however many rows cite it —
 * and every number in the Value has to be in them, or in the lines they name. A
 * Source that starts with `=` is a derived row, checked by `derivedProblem`. Any
 * other Source is skipped: only a reader can check it. With `latest`, each file is
 * also read on the default branch, and the lines a ref names are followed there
 * (`followLines`): a number no longer in them, or in the file for a ref that names
 * none, is DRIFT. `detail` follows the status, `where` names the source.
 * @param {(repo: string, rev: string, file: string) => Promise<string>} read throws what went wrong
 */
export function sourceChecker(read) {
  /** @type {Map<string, Promise<string>>} */
  const files = new Map();
  const open = (/** @type {string} */ repo, /** @type {string} */ rev, /** @type {string} */ file) => {
    const key = `${repo}@${rev}:${file}`;
    if (!files.has(key)) files.set(key, Promise.resolve().then(() => read(repo, rev, file)));
    return /** @type {Promise<string>} */ (files.get(key));
  };

  /**
   * @param {string} source
   * @param {string} value
   * @param {{ latest?: boolean }} [options]
   * @returns {Promise<{ status: "ok" | "MISSING" | "DRIFT" | "FETCH FAILED" | "DERIVED MISMATCH" | "skipped", detail: string, where: string }>}
   */
  const check = async (source, value, { latest = false } = {}) => {
    const src = source.trim();
    if (src.startsWith("=")) {
      const problem = derivedProblem(src.slice(1), value);
      return problem ? { status: "DERIVED MISMATCH", detail: problem, where: "" } : { status: "ok", detail: "", where: ` ${src}` };
    }
    const refs = refsIn(src);
    if (refs.length === 0) return { status: "skipped", detail: "(not machine-checkable)", where: "" };
    const cited = refs.map((r) => (latest ? `${r.repo}@HEAD:${r.path}` : r.text));
    const texts = [];
    for (const [i, ref] of refs.entries()) {
      try {
        const text = await open(ref.repo, ref.sha, ref.path);
        const at = cut(text, ref); // throws on lines the file does not have
        if (!latest) texts.push(at);
        else if (ref.from === undefined || ref.to === undefined) texts.push(await open(ref.repo, "HEAD", ref.path));
        else {
          const now = linesOf(await open(ref.repo, "HEAD", ref.path));
          const moved = followLines(linesOf(text), now, ref.from, ref.to);
          texts.push(moved.map((j) => now[j]).join("\n"));
          if (moved.length === 1) cited[i] += `#L${moved[0] + 1}`;
          if (moved.length > 1) cited[i] += `#L${moved[0] + 1}-${moved[moved.length - 1] + 1}`;
        }
      } catch (e) {
        return { status: "FETCH FAILED", detail: reason(e), where: ` in ${cited[i]}` };
      }
    }
    const where = ` in ${cited.join(", ")}`;
    const missing = missingNumber(value, texts.join("\n"));
    if (missing) return { status: latest ? "DRIFT" : "MISSING", detail: missing, where };
    return { status: "ok", detail: "", where };
  };
  return check;
}

/**
 * The readings in lib/site.ts that carry a `ref`, read out of its text the way the
 * validator reads the projects, so a bare `node` script can: inside the `projects`
 * literal, each under the last `slug:` above it, its label and value taken from
 * the ref's own line. One it cannot find there comes back empty, for the
 * validator to fail.
 * @param {string} siteTs
 * @returns {{ line: number, project: string, label: string, value: string, ref: string }[]}
 */
export function readingRefs(siteTs) {
  const start = siteTs.indexOf("export const projects");
  if (start < 0) return [];
  const first = siteTs.slice(0, start).split("\n").length;
  let project = "";
  return siteTs.slice(start, siteTs.indexOf("\n];", start)).split("\n").flatMap((line, i) => {
    project = line.match(/^ {4}slug: "([^"]+)"/)?.[1] ?? project;
    const ref = field(line, "ref");
    if (ref === undefined) return [];
    return [{ line: first + i, project, label: field(line, "label") ?? "", value: field(line, "value") ?? "", ref }];
  });
}

/**
 * A `key: "…"` field of an object literal on one line, unescaped.
 * @param {string} line
 * @param {string} key
 */
function field(line, key) {
  return line.match(new RegExp(`(?<=(?:^|[{,])\\s*)${key}: "((?:[^"\\\\]|\\\\.)*)"`))?.[1].replace(/\\(.)/g, "$1");
}

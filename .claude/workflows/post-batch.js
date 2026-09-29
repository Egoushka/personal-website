export const meta = {
  name: "post-batch",
  description:
    "Draft several agreed posts from their briefs, review each with a fresh agent, apply the must-fix findings, and report per post. Spawns 3 agents per post: author, reviewer, and a fixer that runs only when the review has a must-fix finding.",
  whenToUse:
    "Posts whose thesis, kind, project and topics Yehor already agreed, each with a brief in content/drafts/prompts/, run from a session in the main checkout. A post still being agreed starts with /post.",
  phases: [
    { title: "Draft", detail: "an author per post: worktree, evidence pack, draft, checks" },
    { title: "Review", detail: "a fresh agent per draft applies review-post and edits nothing" },
    { title: "Fix", detail: "applies only the must-fix findings, then runs the checks again" },
  ],
};

// Steps 1 to 5 of docs/writing/README.md, "From draft to live", for several posts at
// once; its "Several posts at once" says when. `args` holds one object per post:
// { brief, slug, kind, project, topics, thesis }. `brief` is a file in the main
// checkout's content/drafts/prompts/; the rest is what Yehor already agreed, so no
// agent may change it. Per post, in a pipeline so each review starts when its own
// draft is done: an author, a reviewer that did not write the draft and edits
// nothing, and a fixer for the must-fix findings, skipped when there are none. No
// agent commits, pushes, opens a pull request or moves a draft to content/posts/.

// lib/post-kinds.mjs is the list of kinds; a kind added there is added here.
const KINDS = ["finding", "incident", "build", "note"];
const KEBAB = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const USAGE =
  'Workflow({ name: "post-batch", args: [{ brief: "07-my-finding.md", slug: "my-finding", kind: "finding", ' +
  'project: "chronicle", topics: ["postgres"], thesis: "The one sentence already agreed." }] }), ' +
  "with project: null for a post about no project";

// What each field must be. The script cannot read the repository, so whether a
// project or topic exists is left to the validator the author runs.
const RULES = {
  brief: [
    (v) => typeof v === "string" && /^\w[\w.-]*\.md$/.test(v),
    'a file name in content/drafts/prompts/, such as "07-my-finding.md"',
  ],
  slug: [(v) => typeof v === "string" && KEBAB.test(v), "lowercase kebab-case (it becomes the URL)"],
  kind: [(v) => KINDS.includes(v), `one of ${KINDS.join(", ")}`],
  project: [
    (v) => v === null || (typeof v === "string" && KEBAB.test(v) && v !== "none"),
    "a project slug from lib/site.ts, or null for none",
  ],
  topics: [
    (v) =>
      Array.isArray(v) &&
      v.length > 0 &&
      v.every((t) => typeof t === "string" && KEBAB.test(t)) &&
      new Set(v).size === v.length,
    "a non-empty list of distinct topic ids from lib/topics.ts",
  ],
  thesis: [
    (v) => typeof v === "string" && v.trim() !== "" && !/[\r\n]/.test(v),
    "the agreed sentence, on one line (it becomes the pack's Thesis: line)",
  ],
};
const FIELDS = Object.keys(RULES);

function fail(problems) {
  throw new Error(`post-batch: bad args, no agent started.\n- ${problems.join("\n- ")}\nUsage: ${USAGE}`);
}

let posts = args;
if (typeof posts === "string") {
  try {
    posts = JSON.parse(posts);
  } catch {
    fail(["args is a string that is not JSON: pass the array itself"]);
  }
}
if (!Array.isArray(posts) || posts.length === 0) fail(["args must be a non-empty array, one object per post"]);

const problems = [];
for (const [i, post] of posts.entries()) {
  if (!post || typeof post !== "object" || Array.isArray(post)) {
    problems.push(`args[${i}] must be an object`);
    continue;
  }
  for (const key of Object.keys(post)) {
    if (!FIELDS.includes(key)) problems.push(`args[${i}].${key} is not a field (the fields are ${FIELDS.join(", ")})`);
  }
  for (const [key, [ok, want]] of Object.entries(RULES)) {
    if (post[key] === undefined) problems.push(`args[${i}].${key} is missing: ${want}`);
    else if (!ok(post[key])) problems.push(`args[${i}].${key} must be ${want}, got ${JSON.stringify(post[key])}`);
  }
}
for (const key of ["slug", "brief"]) {
  const seen = new Set();
  for (const post of posts) {
    const value = post?.[key];
    if (typeof value !== "string") continue;
    if (seen.has(value)) problems.push(`two posts have ${key} "${value}"`);
    seen.add(value);
  }
}
if (problems.length > 0) fail(problems);

// ── What each agent returns ────────────────────────────────────────────────────

/** A JSON Schema object whose every property is required. */
const object = (properties) => ({ type: "object", properties, required: Object.keys(properties) });
const TEXT = { type: "string" };
const TEXTS = { type: "array", items: TEXT };
const CHECK = object({
  command: TEXT,
  ran: { type: "boolean" },
  exitCode: { type: "integer", description: "-1 when it did not run" },
  pass: { type: "boolean" },
  output: { type: "string", description: "Every ERROR and warn line and the summary line, verbatim; or why it did not run" },
});
const CHECKS = object({ evidence: CHECK, verify: CHECK, validate: CHECK, denylist: CHECK });
const CLAIM = object({
  sentence: { type: "string", description: "Verbatim from the draft" },
  why: { type: "string", description: "What it rests on, and how Yehor can check it" },
});
const DRAFT_SCHEMA = object({
  status: { type: "string", enum: ["drafted", "blocked"] },
  blockedReason: TEXT,
  worktree: TEXT,
  briefPath: TEXT,
  draftPath: TEXT,
  packPath: TEXT,
  title: TEXT,
  wordCount: { type: "integer" },
  todos: TEXTS,
  inferredClaims: { type: "array", items: CLAIM },
  questionsForYehor: TEXTS,
  checks: CHECKS,
  sha256: TEXT,
  trackedChanges: TEXTS,
});
const FINDING = object({
  severity: { type: "string", enum: ["must-fix", "should-fix", "nit"] },
  area: {
    type: "string",
    enum: ["figure", "derived", "claim", "privacy", "agreement", "kind", "voice", "structure", "accessibility", "check"],
  },
  quote: { type: "string", description: "The exact text: a sentence of the draft, a pack row, or frontmatter: <field>" },
  problem: TEXT,
  fix: TEXT,
});
const REVIEW_SCHEMA = object({
  findings: { type: "array", items: FINDING },
  publishAsIs: { type: "boolean" },
  reason: TEXT,
  checks: CHECKS,
  sha256: TEXT,
});
const FIX_SCHEMA = object({
  sha256Before: TEXT,
  applied: {
    type: "array",
    items: object({ id: TEXT, how: { type: "string", enum: ["rewritten", "todo", "cut", "pack"] }, before: TEXT, after: TEXT }),
  },
  notApplied: { type: "array", items: object({ id: TEXT, reason: TEXT }) },
  todos: TEXTS,
  claimsToConfirm: { type: "array", items: CLAIM },
  wordCount: { type: "integer" },
  checks: CHECKS,
  sha256After: TEXT,
  trackedChanges: TEXTS,
});

// ── Prompts ────────────────────────────────────────────────────────────────────

// The session may run in the main checkout or in any worktree of it, and the
// repository is public: the main checkout is found from git, never from a path here.
const FIND_MAIN =
  "MAIN is this repository's main checkout: the parent directory of " +
  "`git rev-parse --path-format=absolute --git-common-dir`, run anywhere inside the repository.";

// The site's own word count (lib/markdown.mjs), run in the post's worktree.
const COUNT_WORDS =
  "node --input-type=module -e \"import fs from 'node:fs'; import matter from 'gray-matter'; " +
  "import { parseMarkdown, countWords } from './lib/markdown.mjs'; " +
  "console.log(countWords(parseMarkdown(matter(fs.readFileSync(process.argv[1], 'utf8')).content)));\"";

function agreement(post) {
  return [
    `- slug: ${post.slug}`,
    `- kind: ${post.kind}`,
    `- project: ${post.project ?? "none (the frontmatter has no project line)"}`,
    `- topics: ${JSON.stringify(post.topics)}`,
    `- thesis: ${post.thesis}`,
  ].join("\n");
}

// evidence.mjs and validate-content.mjs ignore a flag they do not know and exit 0,
// so whether --verify or --draft exists is read from the script, never inferred
// from a clean exit.
function checksHowTo(slug, draft = "<draft>") {
  return [
    "Run each check in the post's worktree (W), which has the scripts and node_modules.",
    `- evidence: \`npm run evidence -- ${slug}\`.`,
    `- verify: \`npm run evidence -- ${slug} --verify\`, only if W/scripts/evidence.mjs handles \`--verify\` (read it: the script ignores a flag it does not know and exits 0, so a clean exit proves nothing). If it does not, ran is false and the output says "not supported".`,
    `- validate: \`npm run validate -- --draft ${slug}\` if W/scripts/validate-content.mjs reads \`--draft <slug>\` (read it, for the same reason), otherwise \`npm run validate -- --drafts\`. It passes only if it exits 0 and its summary line counts at least one draft.`,
    `- denylist: \`grep -n -i -E -f <(grep -vE '^[[:space:]]*(#|$)' .private-terms) ${draft}\`, the commit hooks' own patterns. Exit 1 (no match) passes; exit 0 is a leak, and the matching lines are its output; any other exit is an error. With no W/.private-terms, ran is false.`,
    "For each: the command, whether it ran, its exit code (-1 if it did not run), pass, and every ERROR and warn line and the summary line, verbatim.",
  ].join("\n");
}

function draftPrompt(post) {
  const { slug, kind, brief } = post;
  return `You are the author of ONE post for Yehor's public site, in the personal-website repository: one of several authors working in parallel, one per post. Work alone: start no subagents or workflows. Your result is data for a report, not a message to Yehor.

The agreement. Yehor approved it before this run: use it verbatim, never change or reinterpret it.
${agreement(post)}
- brief: MAIN/content/drafts/prompts/${brief}

1. Find the repository. ${FIND_MAIN} Check that MAIN/package.json has "name": "personal-website" and that the brief exists. If not, stop: status "blocked", with the reason.

2. Read the brief: a shared header, then this post's section (its evidence, scope, traps and suggested shape). Do what it says, with these exceptions:
- Skip "agree three things with Yehor": the agreement above is that step, done. Where the brief proposes another slug, kind, project, topic or thesis, the agreement wins; note the difference in questionsForYehor.
- You cannot ask Yehor anything. Where the brief or a skill says to ask him (a title, a contradiction to show him, which language a Cyrillic word is), put the question in questionsForYehor, and write any sentence that depends on the answer as a \`TODO:\`.
- Skip its \`/review-post\` and \`stop-slop\` steps and its "When you finish" reply: another agent reviews the draft, and your result replaces the reply.
- Never commit, push, open a pull request, merge, or move a draft to content/posts/. Change no tracked file: the draft and its pack are gitignored, and they are all you write.

3. Set up the post's worktree, W = MAIN/.claude/worktrees/post-${slug}, on branch post-${slug}.
- Stop, status "blocked", touching nothing, if content/posts/${slug}.md exists on origin/main, or if ${slug}.md or ${slug}.evidence.md already exists in MAIN/content/drafts/ or W/content/drafts/. Never overwrite, move or delete someone's work.
- An existing W or branch post-${slug} may be reused only if it has no commits beyond origin/main and no uncommitted changes; otherwise stop the same way.
- If \`command -v ws\` finds a \`ws\` whose usage (\`ws --help\`) lists a \`post\` subcommand, run \`ws post ${slug}\` in MAIN and use the worktree it reports. Otherwise run the brief's "Set up (once)" block with SLUG=${slug}.
- Other authors run the same setup at the same time. If \`git fetch\`, \`git worktree add\` or \`git config\` fails on a lock ("cannot lock ref", "could not lock config file"), wait a few seconds and retry, up to three times. \`git config\` is shared by every worktree: skip a setting that already has the value.
- The shell's directory may reset between commands: start each one with \`cd <W> &&\`, or use absolute paths.

4. In W, run \`npm run new -- ${kind} ${slug}\`. Take the draft and pack paths from what it prints, made absolute (a relative path is relative to W): depending on the repository's version they are in W's or in MAIN's content/drafts/.

5. The evidence pack comes before any prose: W/docs/writing/README.md ("The evidence pack") and W/.claude/skills/post/SKILL.md, step 3.
- The \`Thesis:\` line is the agreed thesis, verbatim.
- One row per figure the draft will state, each with a source a stranger could check with access. Open every source yourself: the brief's figures were checked once, and repositories move.
- A derived figure (a ratio, percentage, difference, multiple or per-unit figure) gets a row whose source gives the formula and both operands, and both operands come from the same run.
- Non-digit claims get rows too: every quoted string, every claim about a person (the author included), every claim with every, never, always, all or none.
- What only Yehor knows has no source you can open: it stays a \`TODO:\` in the draft and goes in questionsForYehor.
- The interview (W/.claude/skills/post/SKILL.md): you cannot ask it, so leave the opening moment as a \`TODO:\`, never an invented scene, and list in questionsForYehor: what did you expect; what did you do when you saw the result; what surprised you; what would you do differently. The verdict stays not-yet until he answers.

6. Write the draft: W/.claude/skills/post/SKILL.md, step 4, the brief's suggested shape and its voice references. The frontmatter carries the agreed kind, project (no project line when it is none) and topics, exactly. If a topic is not in lib/topics.ts, or the project not in lib/site.ts, keep it, let validate report it, and say so in questionsForYehor: adding one is his decision. Choose the title by the README's rules, from the brief's working titles where one fits, and put it in questionsForYehor for his approval.

7. Check it.
${checksHowTo(slug)}
Fix what they report, in the draft or the pack, and run them again until they pass or what is left needs Yehor. Never make a check pass by weakening the pack: a row's source must say what the row says.

8. Return:
- wordCount: \`${COUNT_WORDS} <draft>\` in W, the site's own count (the target is 700 to 1,100, receipts included).
- todos: every line of the draft that contains TODO, verbatim.
- inferredClaims: every claim in the draft that rests on your inference rather than a source you opened, with what it rests on and how Yehor can check it.
- sha256: the hex digest from \`shasum -a 256 <draft>\`.
- trackedChanges: what \`git -C <W> status --porcelain\` lists (nothing, if you changed no tracked file).
- briefPath, worktree, draftPath and packPath as absolute paths.
When blocked: the reason in blockedReason, empty strings and lists and 0 for the rest, and every check with ran false.`;
}

function reviewPrompt(post, draft) {
  return `You review ONE draft post for Yehor's public site. You did not write it and you have not seen the author's notes: judge the files. Review adversarially: the goal is what is wrong, not praise. Edit nothing: not the draft, not the pack, no file anywhere. Work alone: start no subagents or workflows. Your result is data for a report.

- draft: ${draft.draftPath}
- evidence pack: ${draft.packPath}
- the post's worktree (W): ${draft.worktree}
- brief: ${draft.briefPath}
The agreement Yehor approved, which the draft must carry unchanged:
${agreement(post)}

1. Read W/.claude/skills/review-post/SKILL.md and W/docs/writing/README.md, and apply that skill to the draft (a project skill may not load in a subagent, so read the file). Where it says to offer the user something, make it a finding instead. Read the brief's section for this post and check the draft against its scope and every trap it names; check figures against their sources, never against the brief.

2. Also check these; each failure is must-fix:
- Every figure: open its pack row's source yourself and confirm the value.
- Derived figures: every ratio, percentage, difference, multiple or per-unit figure has a pack row whose source states the formula with both operands, and both operands come from the same run. Recompute each.
- Non-digit claims: every quoted string (an error, a log line, a message, a sentence from a document), every claim about a person (the author included) and every claim with every, never, always, all or none has a pack row whose source says it.
- Nothing private: no IP address, no tailnet or other internal hostname, no local path, nothing naming or describing the current employer or its internals (the brief's non-negotiables say which), no personal data, nothing from a private repository beyond its public docs.
- The agreement: the frontmatter's kind, project and topics and the pack's Thesis: line equal it exactly.

3. Severity. must-fix: could put a false, unsourced or private statement on the site, departs from the agreement, breaks a rule the README enforces, or fails a check. should-fix: voice, structure, SEO or accessibility, with nothing false or private at stake. nit: wording. Each finding quotes the exact text it is about, verbatim so a search finds it (a sentence of the draft, a pack row, or \`frontmatter: <field>\`), says what is wrong, and gives the fix. A fix never cites a source you have not opened: "cut it" and "make it a TODO" are fixes.

4. Checks.
${checksHowTo(post.slug, draft.draftPath)}

5. Return publishAsIs, whether you would publish it as it stands, with the reason in one or two sentences; and sha256, the hex digest from \`shasum -a 256 ${draft.draftPath}\` when you are done.`;
}

function fixPrompt(post, draft, mustFix) {
  const findings = mustFix.map((f) => `${f.id} (${f.area}) "${f.quote}": ${f.problem} Suggested fix: ${f.fix}`).join("\n");
  const inferred = draft.inferredClaims.map((c) => `- "${c.sentence}": ${c.why}`).join("\n") || "(none)";
  return `You apply an independent review's must-fix findings to ONE draft post for Yehor's public site. Work alone: start no subagents or workflows. Your result is data for a report.

- draft: ${draft.draftPath}
- evidence pack: ${draft.packPath}
- the post's worktree (W): ${draft.worktree}
- brief: ${draft.briefPath}
The agreement, which no fix may change:
${agreement(post)}

1. Before you touch anything: sha256Before, the hex digest from \`shasum -a 256 ${draft.draftPath}\`.

2. Apply these findings and nothing else. Everything else in the draft stays as it is, even what you would write differently: the review's other findings are Yehor's call.
${findings}
- Never invent a source. Use one only if you open it and it says what the row says. A claim you cannot source becomes \`TODO: <what is missing>\` where it stands, or is cut.
- Keep the pack in step: a figure you cut leaves the pack, and a figure or claim you add needs a row whose source you opened.
- Account for every finding by id: in applied (how, and the text before and after; after is empty for a cut) or in notApplied with the reason.
- Never commit, push, open a pull request, or move the draft to content/posts/. Change no tracked file.

3. Checks, after your changes.
${checksHowTo(post.slug, draft.draftPath)}

4. Return, as the draft now stands:
- todos: every line that contains TODO, verbatim.
- claimsToConfirm: every claim that rests on inference rather than a source; start from the author's list below, drop what is gone, add what your fixes introduced.
- wordCount: \`${COUNT_WORDS} ${draft.draftPath}\` in W.
- sha256After, the hex digest from \`shasum -a 256\`; and trackedChanges, what \`git -C ${draft.worktree} status --porcelain\` lists.

The author's inferred claims:
${inferred}`;
}

// ── Draft → Review → Fix, per post ─────────────────────────────────────────────

const results = await pipeline(
  posts,
  (post) => agent(draftPrompt(post), { label: `draft ${post.slug}`, phase: "Draft", schema: DRAFT_SCHEMA }),
  async (draft, post) => {
    if (!draft) {
      log(`${post.slug}: the author returned nothing`);
      return { draft: null, review: null };
    }
    if (draft.status !== "drafted") {
      log(`${post.slug}: blocked, ${draft.blockedReason}`);
      return { draft, review: null };
    }
    log(`${post.slug}: drafted, ${draft.wordCount} words, ${draft.todos.length} TODO(s)`);
    const review = await agent(reviewPrompt(post, draft), { label: `review ${post.slug}`, phase: "Review", schema: REVIEW_SCHEMA });
    return { draft, review };
  },
  async ({ draft, review }, post) => {
    const mustFix = (review?.findings ?? [])
      .filter((f) => f.severity === "must-fix")
      .map((f, i) => ({ id: `M${i + 1}`, ...f }));
    if (!review) return { draft, review, mustFix, fix: null };
    if (mustFix.length === 0) {
      log(`${post.slug}: no must-fix finding, so no fixer`);
      return { draft, review, mustFix, fix: null };
    }
    log(`${post.slug}: ${mustFix.length} must-fix finding(s) to apply`);
    const fix = await agent(fixPrompt(post, draft, mustFix), { label: `fix ${post.slug}`, phase: "Fix", schema: FIX_SCHEMA });
    return { draft, review, mustFix, fix };
  },
);

// ── One report per post ────────────────────────────────────────────────────────

// A sha-256 digest as an agent gives it, possibly with the file name after it.
const digest = (text) => (String(text ?? "").match(/[0-9a-f]{64}/i)?.[0] ?? "").toLowerCase();

function reportFor(post, result) {
  const base = {
    slug: post.slug,
    brief: post.brief,
    verdict: "not-yet",
    reason: "",
    paths: null,
    title: "",
    wordCount: 0,
    checks: null,
    todos: [],
    claimsToConfirm: [],
    questionsForYehor: [],
    review: null,
    fixed: [],
    notFixed: [],
    leftForYehor: [],
    notes: [],
  };
  if (!result) return { ...base, reason: "a stage of this post failed: read the run's journal, then run this post again" };
  const { draft, review, mustFix = [], fix = null } = result;
  if (!draft) return { ...base, reason: "the author returned nothing (skipped or failed): run this post again" };
  const paths = { worktree: draft.worktree, draft: draft.draftPath, pack: draft.packPath };
  if (draft.status !== "drafted") return { ...base, paths, reason: `blocked before drafting: ${draft.blockedReason}` };

  const checks = fix?.checks ?? review?.checks ?? draft.checks;
  const applied = new Set((fix?.applied ?? []).map((a) => a.id));
  const open = mustFix.filter((f) => !applied.has(f.id));
  const todos = fix ? fix.todos : draft.todos;
  const claims = fix ? fix.claimsToConfirm : draft.inferredClaims;
  const tracked = [...new Set([...draft.trackedChanges, ...(fix?.trackedChanges ?? [])])];
  const handedOver = digest(draft.sha256);
  const changedSinceAuthor = (text) => Boolean(handedOver && digest(text) && digest(text) !== handedOver);
  const others = review ? review.findings.filter((f) => f.severity !== "must-fix") : [];

  const reasons = [];
  if (!review) reasons.push("no review: the reviewer returned nothing");
  if (review && mustFix.length > 0 && !fix) reasons.push("the fixer returned nothing, so the draft may be half-edited: run the checks again");
  for (const [name, check] of Object.entries(checks)) {
    // verify is optional: the repository may not have the flag yet, and says so in its output.
    if (name === "verify" && !check.ran) continue;
    const cleanExit = name === "denylist" ? check.exitCode === 1 : check.exitCode === 0;
    if (!check.ran) reasons.push(`${name} did not run`);
    else if (!check.pass || !cleanExit) reasons.push(`${name} failed`);
  }
  if (todos.length > 0) reasons.push(`${todos.length} TODO(s) left`);
  if (open.length > 0) reasons.push(`${open.length} must-fix finding(s) not applied`);
  if (claims.length > 0) reasons.push(`${claims.length} claim(s) for Yehor to confirm`);
  if (tracked.length > 0) reasons.push(`tracked files changed: ${tracked.join(", ")}`);
  if (review && changedSinceAuthor(review.sha256)) reasons.push("the draft changed during the review, which edits nothing");
  if (fix && changedSinceAuthor(fix.sha256Before)) reasons.push("the draft changed between the author and the fixer");

  const notes = [];
  if (draft.draftPath.startsWith(`${draft.worktree.replace(/\/+$/, "")}/`)) {
    notes.push(
      "The draft and its pack are inside the worktree, and removing the worktree deletes them: copy both to the main checkout's content/drafts/ first.",
    );
  }
  if (fix) notes.push("The fixer's changes were not reviewed again: read fixed before trusting them.");

  const questions = draft.questionsForYehor;
  return {
    ...base,
    verdict: reasons.length === 0 ? "publish" : "not-yet",
    reason:
      reasons.length > 0
        ? reasons.join("; ")
        : `checks pass, no TODO, every must-fix applied, nothing to confirm; ${others.length} other finding(s) and ${questions.length} question(s) for Yehor`,
    paths,
    title: draft.title,
    wordCount: fix?.wordCount ?? draft.wordCount,
    checks: { runBy: fix ? "fixer" : review ? "reviewer" : "author", ...checks },
    todos,
    claimsToConfirm: claims,
    questionsForYehor: questions,
    review: review && { publishAsIsBeforeFixes: review.publishAsIs, reason: review.reason, mustFix },
    fixed: fix?.applied ?? [],
    notFixed: open.map((f) => ({ ...f, reason: fix?.notApplied.find((n) => n.id === f.id)?.reason ?? "no fixer result" })),
    leftForYehor: others,
    notes,
  };
}

const reports = posts.map((post, i) => reportFor(post, results[i]));
const ready = reports.filter((r) => r.verdict === "publish").length;
log(`${reports.length} post(s): ${ready} ready to publish, ${reports.length - ready} not yet`);

return {
  summary: reports.map((r) => `${r.slug}: ${r.verdict}, ${r.reason}`),
  next: "Nothing was committed, pushed or moved. For each post you accept: the stop-slop voice pass, then docs/writing/README.md, From draft to live, steps 6 to 9.",
  posts: reports,
};

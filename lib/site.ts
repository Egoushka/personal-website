import { getSpanDays, inWords } from "./posts";
import type { TopicSlug } from "./topics";
import type { CyrillicLang } from "./lang";

/**
 * How long the deploy shipped nothing, read from that post's `spanDays`. The prose
 * below names the stretch in several places; none of them types the number.
 */
const silentDays = getSpanDays("silent-deploys");

/**
 * The live origin. Everything absolute on this site is built from it —
 * canonicals, JSON-LD `@id`s, the sitemap, both feeds, the OG cards, and the
 * URL each post's comment thread is keyed by.
 */
const PRODUCTION_URL = "https://hrabovskyi.online";

/**
 * Overridden at BUILD time by prelive, never at runtime — a static export has
 * no runtime env, and `SITE_URL` is read here exactly once so a second copy of
 * the site cannot claim production's addresses.
 *
 * It is not cosmetic. Remark42 keys a thread by the page's URL, so a prelive
 * build carrying the production URL would post test comments straight into the
 * live thread for that post.
 */
const siteUrl = process.env.SITE_URL ?? PRODUCTION_URL;

/** True on any build that is not aimed at the live origin. */
export const isPrelive = siteUrl !== PRODUCTION_URL;

export const site = {
  name: "Yehor Hrabovskyi",
  /** The greeting. First thing on the page, and the register everything else matches. */
  greeting: "Hey — I'm Yehor.",
  domain: "hrabovskyi.online",
  url: siteUrl,
  role: "Backend-first .NET developer",
  /**
   * One line under the greeting, and the home page's h1. The proof row under it
   * carries the specifics, and they are checkable, which a paragraph is not.
   */
  intro: "I write .NET backends and fix the ones that fail quietly.",
  description:
    "Backend services in .NET and ASP.NET Core, a homelab on one box in Nuremberg, and writing about the parts that went wrong.",
  locale: "en_US",
  location: "Kyiv, Ukraine",
  /** Kyiv's offset, winter and summer. Printed beside the location on /about/. */
  timezone: "UTC+2/+3",
  /**
   * Prints next to the location. The reader this site is written for is buying
   * a week of work, not filling a role.
   */
  availability: "available for contract work",
  /**
   * What I can be hired for, in one line: scope, never rates or capacity.
   * Empty renders nothing. Only I write this; it is never inferred.
   */
  engagement: "",
  email: "egorgrabovskij@gmail.com",
  github: "https://github.com/Egoushka",
  githubHandle: "Egoushka",
  linkedin: "https://www.linkedin.com/in/yehor-hrabovskyi",
  linkedinHandle: "yehor-hrabovskyi",
};

/**
 * Feed autodiscovery links. Next.js replaces the whole `alternates` object when a
 * page defines one, so `pageMetadata()` (lib/metadata.ts) puts these back beside
 * every page's canonical. Build page metadata through it and they cannot go
 * missing.
 */
export const feedTypes = {
  "application/rss+xml": [{ url: "/feed.xml", title: `${site.name} — RSS` }],
  "application/atom+xml": [{ url: "/atom.xml", title: `${site.name} — Atom` }],
  "application/feed+json": [{ url: "/feed.json", title: `${site.name} — JSON Feed` }],
};

/**
 * Everywhere else I am, listed under "Working with me" on /about/.
 *
 * Only accounts that exist and that I actually post to. A row for a dormant
 * Twitter account is worse than no row: it sends someone to a dead profile with
 * my name on it. Add one when there is something behind it.
 */
export const links: { label: string; href: string; handle: string; note: string }[] = [
  {
    label: "GitHub",
    href: site.github,
    handle: `@${site.githubHandle}`,
    note: "Where most of what I build lives now: chargehand, Attest, Chronicle and the MCP servers. The homelab repo stays private.",
  },
  {
    label: "LinkedIn",
    href: site.linkedin,
    handle: `in/${site.linkedinHandle}`,
    note: "The work history, and where recruiters usually find me.",
  },
  {
    label: "Email",
    href: `mailto:${site.email}`,
    handle: site.email,
    note: "The fastest way to reach me. I do read it.",
  },
  {
    label: "Instagram",
    href: "https://www.instagram.com/everlasting_sunshrine/",
    handle: "@everlasting_sunshrine",
    note: "The half of my life that is not a terminal.",
  },
  {
    label: "NuGet",
    href: "https://www.nuget.org/profiles/red_tar",
    handle: "red_tar",
    note: "Where Attest is published. The one thing here that fails in public when I get it wrong.",
  },
  {
    label: "RSS",
    href: "/feed.xml",
    handle: "/feed.xml",
    note: "Atom and JSON Feed are there too, if you prefer them.",
  },
];

/**
 * The proof row: what sits directly under the hero.
 *
 * The only test each entry has to pass is that a stranger can check it in
 * under a minute. That is why Attest links to somewhere that is not this site —
 * a claim I host myself is not evidence — and why the day job carries no link:
 * it is the one thing here nobody can verify from outside, so it is stated
 * plainly and not dressed up.
 *
 * Where the figures come from, since the page cannot compute them: **87
 * countries** is one validator per country in github.com/Egoushka/attest, and
 * **197 defects** is the count in the package description on NuGet. Both are on
 * the other end of the links in this row.
 *
 * An entry with `post` has no label of its own: the home page prints that
 * post's `spanDays`, read from its frontmatter at build, and links to it. The
 * figure and the sentence beside it are about the same post by construction,
 * and the build fails if that post or its span is missing.
 */
export const proof: {
  label?: string;
  text: string;
  links: { label: string; href: string }[];
  /** Slug of a published post whose `spanDays` is this entry's figure. */
  post?: string;
}[] = [
  {
    label: "Attest",
    text:
      "Validates national ID, tax ID, VAT and postal codes for 87 countries, against the rule each country publishes. A fork of CountryValidator with 197 of its defects fixed, published on NuGet.",
    links: [
      { label: "the repo", href: "https://github.com/Egoushka/attest" },
      { label: "on NuGet", href: "https://www.nuget.org/packages/Attest" },
    ],
  },
  {
    label: "Day job",
    text:
      ".NET on a European crypto brokerage platform: trade and payment flows, reconciliation, third-party integrations.",
    links: [],
  },
  {
    post: "silent-deploys",
    text: "A deployment that reported success while shipping nothing. Found, explained, fixed.",
    links: [],
  },
];

/** One measured fact about a project. `source` says where it came from — always. */
export type Reading = { label: string; value: string; source: string };

export type Project = {
  /** The URL segment. Lowercase kebab-case, and it never changes once published. */
  slug: string;
  name: string;
  /** Where it stands today, in one word. Nothing here is called "finished". */
  status: "running" | "paused" | "building";
  /**
   * What it is written in, and what shape it is. Two fields rather than one
   * string with a separator baked into it: the separator is a rendering
   * decision, and it changed once already.
   */
  lang: string;
  shape: string;
  /**
   * Must be a PUBLIC URL. `*.lab.hrabovskyi.online` is a tailnet-only namespace
   * (100.64/10), so a Forgejo link there is a dead link for every visitor. Leave
   * this empty rather than emit one — the templates omit the link when it is.
   */
  href: string;
  /**
   * Public or private. Its own field rather than inferred from an empty `href`:
   * "no link" and "private" are different states, and a reader who finds a
   * project with nothing to click should be told which one it is.
   */
  visibility: "public" | "private";
  /**
   * What it is actually built with, read out of the repository rather than
   * remembered. Free strings on purpose: this is not the closed topic
   * vocabulary, because "Dapper" and "Testcontainers" are facts about one
   * project and will never be a hub page.
   */
  tech: string[];
  /**
   * Where it has got to, when the project has declared stages. One line, and
   * it must name what does NOT exist yet — that is the half a reader cannot
   * check and the half that makes the rest believable.
   */
  phase?: string;
  /** One line. This is what the homepage and the index show. */
  summary: string;
  /** The full account, on the project's own page. */
  description: string;
  /**
   * The language of each Cyrillic term in `description`, which the project page
   * marks with `lang` (components/Lang.tsx). Per term, because one sentence can
   * name a Ukrainian identifier beside two Russian ones. `npm run check` fails on
   * a Cyrillic word that renders unmarked.
   */
  cyrillic?: Readonly<Record<string, CyrillicLang>>;
  /** One line, for the CV. A four-line bullet on paper does not get read. */
  resumeLine?: string;
  /**
   * Prints on the CV: the one anyone can install, and the one with the best
   * measurement behind it. The rest are one click away and would cost a second
   * sheet of A4 — this is the last lever in the one-page cut order, and it is
   * spent.
   */
  print?: boolean;
  /**
   * True for a project built for one user — me. The home page groups these
   * under their own label, because "a library 400 other people installed" and
   * "an app on my own phone" are not the same kind of evidence and putting
   * them in one list quietly averages the first down to the second.
   */
  side?: boolean;
  /** Slug of the published post in content/posts/ that is this project's write-up. */
  writeup?: string;
  /**
   * Listed on the home page, beside the installable projects, while `status` is
   * "running". The home list is headed "still running", so a featured project
   * that pauses drops off it rather than making the heading false.
   */
  featured?: boolean;
  topics: TopicSlug[];
  readings: Reading[];
};

/**
 * Attest is first because it is the only one that other people run; chargehand
 * is second because it is built for them to, and says in its readings that one
 * person does so far. The rest carry `side: true` and are grouped under their own
 * label rather than listed as their equals.
 *
 * Every number below was read out of the repo it describes, not estimated, and
 * every reading names where it came from. If a claim here can't be checked
 * against a source, it doesn't belong: unverified project copy has already had
 * to be corrected on this site three times.
 */
export const projects: Project[] = [
  {
    slug: "attest",
    writeup: "attest",
    print: true,
    name: "Attest",
    status: "running",
    lang: "C#", shape: "library",
    href: "https://github.com/Egoushka/attest",
    visibility: "public",
    tech: ["C#", ".NET Standard", "xUnit", "GitHub Actions", "NuGet"],
    summary:
      "Validates national ID, tax ID, VAT and postal codes for 87 countries, against the rule each country publishes rather than a regex someone guessed.",
    description:
      "A .NET library that validates national identification numbers, tax numbers, VAT codes and postal codes for 87 countries. It started as a fork of CountryValidator and the fork is the point: the original had the right shape and the wrong answers, and 197 defects in it are fixed here — checksums that accepted invalid numbers, formats that rejected valid ones, countries whose rule had changed since the code was written. Every country has its own test file, so a claim about Poland is a test about Poland rather than a line in a README. It is on NuGet, which makes it the only thing I have built that fails in public when I get it wrong.",
    resumeLine:
      "Published .NET validation library covering national ID, tax, VAT and postal codes for 87 countries; a fork of CountryValidator with 197 of its defects fixed.",
    topics: ["dotnet"],
    readings: [
      { label: "Countries", value: "87", source: "one validator per country in the repo, each with its own test file" },
      { label: "Defects fixed", value: "197", source: "counted against the upstream project; stated on the NuGet package page" },
      { label: "Published", value: "nuget.org/packages/Attest", source: "public package, Apache-2.0" },
    ],
  },
  {
    slug: "chargehand",
    visibility: "public",
    tech: ["C#", ".NET 10", "ASP.NET Core", "MCP", "Claude Code", "OpenCode", "OpenTelemetry", "Langfuse", "xUnit", "Docker"],
    phase:
      "0.3.0, before 1.0. It runs from the CLI, over HTTP and over MCP; workers only read, the package is not on nuget.org yet, and the writing nodes that would let it change code do not exist.",
    status: "running",
    name: "chargehand",
    lang: "C#", shape: "orchestrator",
    href: "https://github.com/Egoushka/chargehand",
    summary:
      "Runs a question about a codebase on coding agents and returns an answer whose every citation is checked against a pinned commit.",
    description:
      "An orchestrator for coding agents. A program that calls an agent gets prose back and has nothing to check it against; chargehand turns the request into a typed task, runs it on Claude Code or OpenCode sessions reading the repository at a pinned commit, and returns a result contract in which every claim carries its evidence — a file at that commit, a diff, a session message or an input the caller sent. A resolver checks that each citation resolves at that commit, and a claim whose evidence does not resolve is moved to open questions instead of being reported. Whether a cited line actually supports its claim is not checked yet; that is on the roadmap for 0.8. Budgets, retries and the task graph live in code rather than in a prompt. It is measured before it is believed, and the measurements are not flattering: the first version lost a blind comparison to a plain agent session, 0.333 to 0.667, and won it only after a prompt fix, at 28% more cost. Splitting a question across parallel agents cost 1.53× for a score of 0.967 against 0.950, so it now splits only when one session cannot cover the parts. Prompt CI, which gates every prompt change on paired evals, let both deliberately planted regressions through; once its score learned to count missing claims it caught one of them, and the other still passes.",
    resumeLine:
      "Orchestrator for coding agents in .NET 10: typed tasks run on Claude Code or OpenCode at a pinned commit, every citation checked against the commit before it is returned; CLI, HTTP and MCP; benchmarked blind against a plain agent session.",
    topics: ["dotnet", "architecture", "mcp"],
    readings: [
      { label: "Releases", value: "5 tagged, 0.1.0 → 0.3.0", source: "git tags and CHANGELOG.md, 2026-09-27 and 09-28" },
      { label: "Against a plain session", value: "0.333 → 0.556 blind", source: "phase 3 exit and its rerun, model-judged blind; docs/benchmarks.md" },
      { label: "Splitting", value: "1.53× the cost for 0.967 vs 0.950", source: "phase 4 exit; ADR 0017 limits splits because of it" },
      { label: "Decisions", value: "31 ADRs", source: "docs/adr, 0001 to 0031" },
      { label: "Users", value: "1 — me", source: "counted" },
    ],
  },
  {
    slug: "chronicle",
    writeup: "chronicle",
    featured: true,
    print: true,
    side: true,
    visibility: "public",
    tech: ["Python", "FastAPI", "Postgres", "pgvector", "MCP", "BGE-M3", "ONNX Runtime", "pymorphy3", "Docker"],
    name: "Chronicle",
    status: "running",
    lang: "Python", shape: "event store",
    href: "https://github.com/Egoushka/chronicle",
    summary:
      "Makes seven years of chat history searchable by an assistant, by refusing to index the 65% of it that says “ok”.",
    description:
      "A personal event store that makes seven years of chat history searchable by an assistant. I measured the archive before touching it rather than guessing at it, and the measurement is the whole story: 681,331 messages across 487 chats, of which 65% are under twenty characters. My previous setup embedded every one of them, so roughly 442,000 vectors stood for “ок”, “+1” and “да” — crowding out the 1.5% that carry an actual proposition. Chronicle groups events into segments using a time gap fitted per conversation, which turns 685,401 events into 51,044 segments and improves retrieval at the same time. It serves the result over MCP, so the assistant queries it directly — and the first version of that query path was 45× slower than it had to be, because a CTE hid the full-text index from the planner. It is scored against the obvious alternative, grep, on questions written from memory: the first run lost, 48.2% to 62.8%, and after the recall fixes it finds 63.5% — level with grep, not yet ahead of it.",
    cyrillic: { "ок": "ru", "да": "ru" },
    resumeLine:
      "Event store over a 681k-message archive. Aggregates events into segments before indexing — 13.4× fewer units, better retrieval, level with grep on a blind eval — served over MCP.",
    topics: ["python", "retrieval", "mcp"],
    readings: [
      { label: "Archive", value: "681,331 messages · 487 chats", source: "counted, not sampled, before any embedding ran" },
      { label: "Noise", value: "65% under 20 characters", source: "same pass over the same archive" },
      { label: "Index", value: "13.4× fewer units", source: "685,401 events into 51,044 segments, measured on the reference deployment" },
      { label: "Against grep", value: "63.5% vs 62.8%", source: "make eval, 37 labelled questions, 2026-09-26; the first run lost 48.2% to 62.8%" },
      { label: "Retrieval", value: "45× faster", source: "hybrid_search, measured before and after the CTE that hid the FTS index" },
      { label: "Users", value: "1 — me", source: "counted" },
    ],
  },
  {
    slug: "synapse",
    writeup: "synapse",
    featured: true,
    side: true,
    visibility: "private",
    tech: ["Python", "FastAPI", "Postgres", "Hindsight", "LiteLLM", "Docker"],
    phase:
      "Reading, classification, grounding and the nightly sweep run on the box. apply is deliberately not scheduled and every scope ships closed, so nothing is retired without me saying so.",
    status: "running",
    name: "Synapse",
    lang: "Python", shape: "control plane",
    href: "",
    summary:
      "Decides what my assistant’s memory should stop believing — 5,369 stored claims, not one of which had ever been marked wrong.",
    description:
      "A memory control plane. It stores no knowledge of its own: it governs claims held in other systems — Hindsight first — deciding which are still true, which have been superseded and which should stop being recalled, so dropping its database loses decisions rather than knowledge. The census that started it is the argument for it: 5,369 claims, every one marked valid, 97% asserted exactly once and never corroborated, 99.8% older than thirty days, in a backend that has the columns to mark a memory wrong and had never written to one. Five rules are database CHECK constraints rather than application code, because the failure this exists to fix is policy written as prose that the engine quietly ignores — identity claims are never auto-superseded, a closed scope cannot be opened by editing policy, anything a model judged waits for a human, a flagged finding never reaches a backend, and nothing is ever destroyed. One claim has been retired so far, then reversed through the UI, then re-applied, with all four events in the ledger.",
    resumeLine:
      "Memory control plane in Python over 5.4k agent-memory claims: nightly classification and grounding, five invariants enforced as database constraints, every model-judged change human-gated.",
    topics: ["python", "architecture", "retrieval", "postgres"],
    readings: [
      { label: "Claims governed", value: "5,369", source: "first census of the live backend, 2026-09-22" },
      { label: "Ever marked wrong", value: "0, before this", source: "the backend’s own state column: valid=5,369" },
      { label: "Classifier bill", value: "$0.237 → $0.092 a night", source: "a cheap model with a Claude Haiku second opinion, for 1.3 macro-F1 points; ADR 0004" },
      { label: "Applied automatically", value: "0", source: "every scope ships closed; findings wait as proposals" },
    ],
  },
  {
    slug: "baseline",
    side: true,
    visibility: "private",
    tech: ["Flutter", "Dart", "Drift", "SQLite", "SQLCipher", "AES-GCM", "ASP.NET Core"],
    phase:
      "Encryption at rest, multi-device sync over an op-log the relay cannot read, and an Android home-screen widget all ship. Nothing has been committed since 28 July: it is in use, not in development.",
    name: "Baseline",
    status: "running",
    lang: "Flutter", shape: "instrument",
    href: "",
    summary:
      "Tracks how you've changed since last time, and breaks the line rather than pretend a week-old comparison still holds.",
    description:
      "A self-observation app that records perceived change — where you are compared to the mark before — and never an absolute mood, score or emoji. The first mark is the baseline; every later one is placed relative to its predecessor. What makes it worth building is what it refuses to do: after a seven-day gap the line visibly breaks rather than pretending the comparison still holds, an uncertain placement is stored as a fuzzy point instead of being laundered into false precision, and there is no global scale at all, because a chain of subjective deltas is a random walk. It measures shape and rhythm, and it says so on screen, in the place where a product would have put a number.",
    resumeLine:
      "Flutter app tracking perceived change rather than absolute mood; breaks the line after a 7-day gap rather than implying precision the data lacks.",
    topics: ["flutter"],
    readings: [
      { label: "Break", value: "7-day gap", source: "the threshold in the app's source" },
      { label: "Scale", value: "none, deliberately", source: "there is no global score to read" },
      { label: "Tests", value: "194 passing", source: "the suite in the repo; dart analyze clean" },
      { label: "Users", value: "1 — me", source: "counted" },
    ],
  },
  {
    slug: "oura-platform",
    writeup: "oura-platform",
    side: true,
    visibility: "public",
    tech: ["C#", ".NET", "Postgres", "TimescaleDB", "Dapper", "DbUp", "Serilog", "Grafana", "OAuth", "xUnit", "Testcontainers"],
    phase:
      "Stages 1, 2 and 4 of 8. Ingestion, three Grafana dashboards, the calendar and tag importers and an MCP server over the warehouse all run. Stage 3’s webhooks are skipped deliberately; the bedroom sensors, the chest strap and the glucose curve (5–8) do not exist.",
    status: "building",
    name: "Oura Platform",
    lang: "C#", shape: "health warehouse",
    href: "https://github.com/Egoushka/oura-platform",
    summary:
      "Pulls Oura Ring data into a database I own, so it can be joined against everything Oura will never see.",
    description:
      "A self-hosted health warehouse. Oura's own app will show you last night's sleep; it will never show you last night's sleep against the meetings in the calendar, the training load, the CO₂ in the bedroom or the glucose curve, because it does not have any of those. This pulls the ring's data out over OAuth into Postgres with TimescaleDB, on the same box as everything else, where SQL and Grafana can ask questions across all of it. Two processes, one database, no Kubernetes. Stages 1, 2 and 4 of 8 are done — ingestion, three dashboards the Oura app cannot draw, the calendar and tag importers that put meetings beside sleep, and an MCP server so the assistant reads the warehouse directly. Stage 3’s webhooks are skipped on purpose rather than pending: they are a latency optimisation on a pipeline that already works, and the night’s data lands mid-morning either way. What is missing is the other half of every question — the room, the chest strap, the glucose curve.",
    resumeLine:
      "Self-hosted health warehouse in .NET: OAuth ingestion of wearable data into Postgres/TimescaleDB on a single VPS, joined against calendar and environment data.",
    topics: ["dotnet", "postgres", "self-hosting", "mcp"],
    readings: [
      { label: "Stage", value: "1, 2 and 4 of 8", source: "the staged plan in the repo; 3 is skipped deliberately, 5–8 are unbuilt" },
      { label: "Storage", value: "Postgres + TimescaleDB", source: "hypertables, on the same box as the rest of the lab" },
      { label: "Read path", value: "Grafana + MCP", source: "three provisioned dashboards and an MCP server over the same database" },
      { label: "Users", value: "1 — me", source: "counted" },
    ],
  },
  {
    slug: "oura-mcp-app",
    side: true,
    visibility: "public",
    tech: ["TypeScript", "MCP Apps", "Express", "Vite", "Postgres"],
    phase:
      "One tool and one chart. It runs on the box beside the warehouse, reachable only over the tailnet, and Claude Desktop on my laptop is its one client.",
    status: "building",
    name: "Oura MCP App",
    lang: "TypeScript", shape: "MCP app",
    href: "https://github.com/Egoushka/oura-mcp-app",
    summary:
      "Answers a question about my sleep with a chart rather than a paragraph, rendered inside whichever assistant asked.",
    description:
      "An MCP App over the Oura Platform warehouse. One tool, oura_trend, reads eight columns of the daily table — sleep, readiness and activity scores, HRV, resting heart rate, temperature deviation, SpO₂ and steps — and returns the series and an interactive chart together. Hosts that implement MCP Apps render the chart inline and let you change metric and range without another model turn, because the app calls the tool itself over the host bridge rather than asking the model to; hosts that do not still get a useful text summary out of the same call. The database user is read-only and the column names come from a fixed map rather than from tool input, because a tool the model can aim is a tool an injected instruction can aim. Version 0.2.0 dropped CORS and answers 403 to any Host header it was not told about, which is the guard against DNS rebinding: a server with no login of its own should not answer a page that merely resolves to it.",
    topics: ["typescript", "postgres", "mcp"],
    readings: [
      { label: "Surface", value: "1 tool, 8 metrics", source: "the server’s registration; three ranges, one chart resource" },
      { label: "UI", value: "one inlined HTML file", source: "Vite single-file build — the host fetches exactly one resource" },
      { label: "Database access", value: "read-only, fixed column map", source: "db.ts; no tool input reaches the SQL" },
      { label: "Foreign Host header", value: "403", source: "0.2.0; ALLOWED_HOSTS names the exceptions" },
      { label: "Users", value: "1 — me", source: "counted" },
    ],
  },
  {
    slug: "homelab-gitops",
    writeup: "homelab",
    featured: true,
    side: true,
    visibility: "private",
    tech: ["Docker Compose", "Traefik", "SOPS", "age", "Tailscale", "Headscale", "Caddy", "Grafana", "Python", "Shell"],
    status: "running",
    name: "Homelab GitOps",
    lang: "Compose", shape: "infrastructure",
    href: "",
    summary:
      "Every stack on the box, one directory each, with the secrets encrypted in the repository rather than living on the machine.",
    description:
      `The whole homelab as a git repository: one directory per Docker Compose stack, secrets committed as SOPS+age encrypted files with the plaintext gitignored, and Traefik at the edge deciding what the internet is allowed to reach. The point of doing it this way is falsifiable — if the box disappeared, this repository is what would rebuild it, and the only way to know that is that it has had to. It is also the reason the writing on this site exists: the deploy that shipped nothing for ${inWords(silentDays)} days was found because the state of the machine is supposed to be reconstructable from here, and for ${inWords(silentDays)} days it was not.`,
    resumeLine:
      "Single-VPS homelab defined entirely in git: Compose stacks per service, SOPS+age encrypted secrets, Traefik edge, rebuildable from the repository.",
    topics: ["self-hosting", "infrastructure", "docker", "sops"],
    readings: [
      { label: "Host", value: "one cx53, 32 GB", source: "the repo's own README; tailnet address, not a public one" },
      { label: "Secrets", value: "encrypted in git", source: "*.enc committed, plaintext gitignored — checkable in the tree" },
      { label: "Stacks", value: "61, one directory each", source: "FACTS.md, regenerated by CI so the count cannot drift from the tree" },
    ],
  },
  {
    slug: "trader",
    side: true,
    visibility: "private",
    tech: ["Python", "nautilus_trader", "ccxt", "polars", "DuckDB", "Parquet"],
    phase:
      "Phase 4 of 7, closed on 2026-09-22. Six hypotheses registered and none survived: the cross-asset book passed its in-sample gate, failed its pre-registered criterion, and added −0.021 Sharpe over holding its components. Forward paper trading ran one session before it was stopped; no live order has ever been placed.",
    status: "paused",
    name: "Trader",
    lang: "Python", shape: "backtesting",
    href: "",
    summary:
      "A systematic crypto trading system whose result is six pre-registered hypotheses, none of which survived, and no order ever placed.",
    description:
      "Trend following and funding-carry capture on crypto perpetuals, built in the order that makes the answer trustworthy rather than the order that gets to a chart fastest: hypotheses pre-registered before the data was touched, a conservative cost model every strategy has to route through, a second-source reconciliation against another exchange, and Deflated Sharpe and PBO reporting on top of walk-forward selection. The gate is that at least one candidate survives all of it. Across six hypotheses none has — the known-bad control is correctly rejected at Sharpe −0.43 and PBO 0.82, trend on an 87-symbol point-in-time basket returned +0.045, and the cross-asset book passed its in-sample gate, failed its pre-registered criterion, and added −0.021 Sharpe over holding its components. What ended the search is a measurement rather than a mood: 87 crypto perpetuals carry 1.90 independent bets between them, eighteen cross-asset ETFs carry 5.02, so a crypto-only book cannot diversify its way to an edge no matter how many symbols it holds. The search is closed, the collectors keep running, and the reopening conditions are written down. A backtest that finds an edge on the first try has usually found a bug, and the expensive version of that lesson is paid for with real money.",
    resumeLine:
      "Systematic trading research in Python: pre-registered hypotheses, conservative cost model, cross-exchange reconciliation, walk-forward with Deflated Sharpe/PBO. Six hypotheses tested, none survived, no capital ever at risk.",
    topics: ["python", "architecture"],
    readings: [
      { label: "Phase", value: "4 of 7, closed", source: "the phase gates in the repo's plan, which are not skippable" },
      { label: "Hypotheses", value: "6 registered, 0 survived", source: "the research log, which records the failures too" },
      { label: "Effective bets", value: "1.90 of 87", source: "mean pairwise correlation across the crypto basket; 18 cross-asset ETFs give 5.02" },
      { label: "Capital at risk", value: "none", source: "testnet only; there are no live orders" },
    ],
  },
  {
    slug: "switchboard",
    side: true,
    visibility: "public",
    tech: ["Python", "MCP", "agentgateway", "JMESPath", "Prometheus", "Telegram Bot API", "Docker"],
    status: "running",
    name: "switchboard",
    lang: "Python", shape: "MCP front door",
    href: "https://github.com/Egoushka/switchboard",
    summary:
      "Shows an agent five tools instead of hundreds, and makes every one that writes wait for a tap on my phone.",
    description:
      "One MCP front door to every tool behind my gateway. An agent connected to all of them reads hundreds of tool definitions before it reads the task; through switchboard it sees five — search, describe, read, write and more — and looks up the one it needs. Whether a tool reads or writes is decided by config, never by the tool's own description of itself: a server with no entry is all write, and a destructive hint always forces write. Every write waits for Approve or Deny from a Telegram bot that shows every argument, with zero-width and bidi characters printed as visible escapes, because an approval prompt that can hide text is not an approval. Approvals are single-use, bound to exactly the arguments shown, denied on timeout and refused when Telegram cannot be reached. Results are trimmed before the model sees them: nulls dropped, an optional JMESPath query applied, the first page capped at 6k characters.",
    topics: ["python", "mcp", "self-hosting"],
    readings: [
      { label: "Tools an agent sees", value: "5, instead of hundreds", source: "one MCP app per scope; the README" },
      { label: "Writes", value: "approved per call, single-use", source: "Telegram, 50 s default, denied on timeout or outage" },
      { label: "First page", value: "6k characters at most", source: "the result trimmer" },
      { label: "Users", value: "1 — me", source: "counted" },
    ],
  },
  {
    slug: "devbox-mcp",
    side: true,
    visibility: "public",
    tech: ["JavaScript", "Node.js", "MCP", "Express", "zod", "Docker", "docker-socket-proxy", "SonarQube"],
    status: "running",
    name: "devbox-mcp",
    lang: "JavaScript", shape: "MCP server",
    href: "https://github.com/Egoushka/devbox-mcp",
    summary:
      "Lets an assistant run a project's real test suite and a SonarQube scan without handing it a shell or the Docker socket.",
    description:
      "An MCP server that runs a project's own test suite — dotnet, npm or pytest — in a throwaway container with the repository mounted read-only, and a SonarQube scan against the same checkout. The design is mostly about what it is not given. A mounted Docker socket is root on the host, so it talks to a docker-socket-proxy that allows creating and starting containers and pulling images, with exec, networks and volumes switched off. It accepts only a project name its own listing returned, which is the whole defence against a prompt-injected path. Its README says in as many words that this narrows the damage a compromised instance can do and is not a sandbox. SonarQube on the box stops after twenty idle minutes, so a scan wakes it first; a cold start measured 33 seconds.",
    topics: ["mcp", "docker"],
    readings: [
      { label: "Toolchains", value: "dotnet, npm, pytest", source: "detected per project by list_projects" },
      { label: "Repository mount", value: "read-only", source: "the run_tests container spec; scratch space is a tmpfs" },
      { label: "Docker access", value: "a scoped proxy, not the socket", source: "no exec, no networks, no volumes" },
      { label: "SonarQube cold start", value: "33 s", source: "measured when sonar_scan learned to wake it, 2026-09-29" },
    ],
  },
  {
    slug: "agent-skills",
    side: true,
    visibility: "public",
    tech: ["Agent Skills", "Python", "MCP", "GitHub Actions", "GitHub Pages"],
    status: "running",
    name: "agent-skills",
    lang: "Markdown", shape: "skills hub",
    href: "https://github.com/Egoushka/agent-skills",
    summary:
      "Agent skills for Claude Code, OpenCode and Codex, each upstream one pinned to a commit and each showing what it costs in context.",
    description:
      "A curated set of agent skills — my own and upstream ones I have read — that installs into Claude Code, OpenCode, Codex and anything else that reads SKILL.md. It treats skills the way a lockfile treats packages, because that is what they are: instructions and scripts handed to an agent that runs with my permissions. Every vendored skill is pinned to a commit, CI fails if it differs from upstream at that commit by a single byte, and upstream changes arrive only as pull requests whose review report flags changed allowed-tools, new scripts, new URLs and edited descriptions, since a description decides when a skill fires. The catalog prints what each skill costs: all 26 together take about 3.3k tokens of every session, and six have bodies over the 5,000-token guideline.",
    topics: ["mcp", "python"],
    readings: [
      { label: "Skills", value: "26", source: "the catalog the README generates from the skills themselves" },
      { label: "Always loaded", value: "≈3.3k tokens", source: "names and descriptions, estimated at characters ÷ 4" },
      { label: "Vendored skills", value: "byte-identical to a pinned commit", source: "make verify, which CI runs" },
    ],
  },
  {
    slug: "oberih",
    side: true,
    visibility: "private",
    tech: ["Python", "FastAPI", "python-stdnum", "Docker"],
    phase:
      "v0. The five identifier types and the address joining work; names are untouched, and the better model measured for them will not load in the upstream image.",
    status: "building",
    name: "Oberih",
    lang: "Python", shape: "detector",
    href: "",
    summary:
      "Catches the Ukrainian and Russian ID numbers a PII filter has no notion of, before the paste reaches a model.",
    description:
      "A PII detector that sits between PasteGuard’s proxy and its own detector, speaks the same /analyze contract, and adds what the upstream has no concept of: РНОКПП, ИНН, СНИЛС and both passport formats, each recognised by the checksum its issuer publishes rather than by shape, plus the postal addresses the upstream returns as fragments. It started from a measurement rather than an impression: on a 159-case Ukrainian and Russian set the shipped detector emits none of those five types — 0 of 36 spans — and scores F1 0.773 overall. Adding them takes it to 0.890, with 63 of 63 unchanged on PasteGuard’s own multilingual set. The rule that decides its shape is that it fails closed: if the upstream detector is unhealthy, /analyze answers 503 rather than an empty result, because an empty result from a masking proxy is an unmasked paste.",
    cyrillic: { "РНОКПП": "uk", "ИНН": "ru", "СНИЛС": "ru" },
    resumeLine:
      "Cyrillic-aware PII detector in Python over PasteGuard: checksum-validated UA/RU identifiers and address assembly, F1 0.773 → 0.890 on a 159-case set.",
    topics: ["python"],
    readings: [
      { label: "Accuracy", value: "F1 0.773 → 0.890", source: "159-case uk/ru set, run against the production upstream" },
      { label: "What upstream finds", value: "0 of 36 identifiers", source: "same run; five UA/RU types, none emitted" },
      { label: "Characters masked", value: "80.6% → 91.2%", source: "same run" },
      { label: "On upstream failure", value: "503, never an empty result", source: "the health rule in the service" },
    ],
  },
];


/**
 * What I would put my name to.
 *
 * Curated, not derived from the topic vocabulary: a derived list would put
 * Flutter on a backend CV because one app on my own phone is written in it, and
 * could never print Clean Architecture, EF Core, SQL Server or NgRx, because
 * those are not topics. The discipline is in `now` instead: every entry says
 * where it actually stands, including when that is "this is my gap". A skill
 * whose `now` line would have to be vague is not a skill I present.
 *
 * `wakatime` is the key my own Wakapi reports the language under. When the
 * box is publishing (see gen-status.sh in homelab-gitops) the page prints the measured
 * share beside the claim; when it is not, the claim stands alone. Nothing here
 * depends on the figure existing.
 */
export type Skill = {
  name: string;
  /** Key into lib/icons.ts. A brand mark where one exists, a drawn glyph where none does. */
  icon?: string;
  /**
   * What the graph calls it. "Background jobs and scheduling" is the right
   * name in a list and a 190px object in a diagram; the node says "Background
   * jobs" and the list below it still says the whole thing.
   */
  short?: string;
  /** Links to the hub, when the vocabulary has one. */
  topic?: TopicSlug;
  now: string;
  wakatime?: string;
};

export const skills: { group: string; items: Skill[] }[] = [
  {
    group: "Backend",
    items: [
      { name: "C# / .NET", icon: "dotnet", topic: "dotnet", wakatime: "C#",
        now: "Five years, and most of every working week." },
      { name: "ASP.NET Core", icon: "dotnet", topic: "aspnet",
        now: "Where the services live: APIs, background jobs, third-party integrations." },
      { name: "EF Core", icon: "database", now: "The default at work. Dapper when the query matters more than the mapping." },
      { name: "CQRS and vertical slices", icon: "pattern", short: "CQRS", topic: "architecture",
        now: "A greenfield .NET 9 backend built this way in 2025, and an opinion about when it is overkill." },
      { name: "Background jobs and scheduling", icon: "job", short: "Background jobs",
        now: "The part that fails quietly, which is why most of what I write about starts here." },
      { name: "RabbitMQ", icon: "rabbitmq", now: "Cross-service messaging at work: publishers, consumers and the retries around them." },
      { name: "Redis", icon: "redis", now: "Read caches and the invalidation that goes with them." },
    ],
  },
  {
    group: "Data",
    items: [
      { name: "PostgreSQL", icon: "postgresql", short: "Postgres", topic: "postgres", now: "Everywhere I get to choose. TimescaleDB when the rows are a time series." },
      { name: "SQL Server", icon: "sql", now: "At work. Deep SQL is the gap I named myself in 2026 and the one I am deliberately closing." },
      { name: "Python", icon: "python", topic: "python", wakatime: "Python",
        now: "Ingestion, retrieval and backtesting. Not where I would take complex business logic, and I say so before anyone asks." },
      { name: "Retrieval", icon: "search", topic: "retrieval", now: "Embeddings and vector search, and a working argument that most of what people index is noise." },
    ],
  },
  {
    group: "Infrastructure",
    items: [
      { name: "Docker Compose", icon: "docker", short: "Compose", topic: "docker", now: "One stack per service, every one of them in git." },
      { name: "Linux", icon: "linux", topic: "linux", now: "One Ubuntu box I run like production, because it is the only one I get paged for." },
      { name: "Traefik and Caddy", icon: "traefikproxy", short: "Traefik", topic: "caddy", now: "The edge and the origin of everything I self-host, including this page." },
      { name: "Tailscale and Headscale", icon: "tailscale", short: "Tailscale", topic: "tailscale", now: "The only way in for administration. The public SSH port takes only deploy keys that can do nothing but rsync into this site." },
      { name: "SOPS and age", icon: "key", short: "SOPS", topic: "sops", now: "Secrets encrypted in the repository, so the box is never the source of truth." },
      { name: "GitHub Actions", icon: "githubactions", topic: "ci-cd", now: `Every deploy here, and the ${silentDays} days I once spent not noticing one had stopped.` },
    ],
  },
  {
    group: "Front end",
    items: [
      { name: "TypeScript", icon: "typescript", topic: "typescript", wakatime: "TypeScript", now: "This site, and anything that reaches a browser." },
      { name: "Angular and NgRx", icon: "angular", short: "Angular", topic: "angular", now: "When the work reaches the front end. A generic NgRx store factory is the piece I would show." },
    ],
  },
];

/**
 * How the stack gets used, which is not part of the stack.
 *
 * Not a group in `skills`: these are not the same kind of noun as Redis and
 * Angular — nobody installs a habit — so they read as a sentence under the
 * diagram rather than another column of logos.
 */
export const practice: { name: string; topic?: TopicSlug; now: string }[] = [
  { name: "Observability", topic: "observability", now: "Structured logs, Grafana, and the habit of asking what this will look like at 3am before it is 3am." },
  { name: "Debugging production", topic: "debugging", now: "Distributed, job-driven systems, on a rotation. The fastest way I know to learn what a system does when nobody is watching." },
  { name: "Testing", now: "xUnit and Testcontainers. I wrote tests in university before anyone asked for them, which is either a virtue or a warning." },
  { name: "Self-hosting", topic: "self-hosting", now: "Everything above, on one box, defined in git and rebuildable from it." },
];

export type Job = {
  /** First month in the role, `"YYYY-MM"`. Read and printed only through lib/dates.ts. */
  start: string;
  /** Last month in the role, inclusive, `"YYYY-MM"`; `null` while it is current. */
  end: string | null;
  company: string;
  role: string;
  /** What the role was pointed at, when the title does not say. */
  focus?: string;
  location?: string;
  /** Remote, Hybrid, On-site. Its own field for the same reason as `shape`. */
  mode?: string;
  points: { text: string }[];
  /**
   * What the role was actually built with. This is the edge that makes a topic
   * page honest — without it a topic can only ever prove I have a side project,
   * never that I've been paid to use it.
   */
  topics: TopicSlug[];
  /**
   * Prints as title + dates only, no bullets. The role still appears in full on
   * screen — this is the compression that makes one A4 sheet possible, and it
   * is set explicitly rather than derived from position so that reordering the
   * list cannot silently gut a current role.
   */
  resumeCompact?: boolean;
  /**
   * How many bullets survive to paper. A number, not a positional CSS rule:
   * `:nth-child` counts DOM position, the roles are nested inside eras, and a
   * positional rule fails silently the moment the markup changes.
   */
  printBullets?: number;
};

/**
 * The CV as a journey, on screen only.
 *
 * A CV is a list of employers in reverse order, which is a format designed to
 * be skimmed by someone filtering forty people — and it throws away the only
 * thing that makes one person's five years different from another's: what went
 * wrong, and what changed because of it.
 *
 * So the screen gets eras. Each one holds the roles of its period, says what
 * the period was actually like, and names one obstacle. **In print all of this
 * prose disappears** and the job blocks it wraps print as an ordinary record —
 * same data, two densities, one page.
 *
 * Every claim below is dated and came out of my own record: commits, packages,
 * and messages I wrote at the time. Nothing here is a reconstruction, and
 * nothing that belongs to an employer is in it.
 */
export type Era = {
  slug: string;
  title: string;
  years: string;
  /** Companies whose roles belong to this era, matched on `Job.company`. */
  jobs: string[];
  body: string[];
  /** The thing that went wrong. One sentence, and it is not optional padding. */
  obstacle?: string;
};

export const eras: Era[] = [
  {
    slug: "production",
    title: "Production, and a box I get paged for",
    years: "2025 — now",
    jobs: ["Boerse Stuttgart Digital"],
    body: [
      "A white-label crypto trading platform, in .NET: trade and payment flows, reconciliation, the integrations either side of them, and the background jobs that hold it together. The estate is large enough that I onboarded by reading its tests rather than its code, which turned out to be the fastest map anyone had.",
      "The year taught me the parts that do not appear in a demo. A read cache invalidated across services, and two days lost to a consumer I had never registered — the message was published and nothing was listening. A month on the rotation, which is the quickest way to learn what a system does when nobody is watching it. A release run end to end. By 2026 I was on the other side of the interview table.",
      "Alongside it, the homelab moved into git and became the busiest repository I own. That is also where Attest came from: work needed a validation library, the one that existed had been abandoned, so I forked it, fixed 197 of its defects in six days and published it. It is the only thing I have built that fails in public when I get it wrong.",
    ],
    obstacle:
      `My own migration moved the box, and the deploy kept reporting success for ${inWords(silentDays)} days while shipping nothing. I found it by accident, while adding a header.`,
  },
  {
    slug: "greenfield",
    title: "Greenfield, and learning to choose",
    years: "2024 — 2025",
    jobs: ["IT INNOVATIONS"],
    body: [
      "A .NET 9 backend from nothing: Clean Architecture, vertical-slice CQRS, a management module with Specification filters and FluentValidation, and on the front end a generic NgRx store factory and a DataTable that took dynamic templates. It is the work I would point at to show I can start something rather than only maintain it.",
      "It is also where I stopped taking whatever was offered. When it ended I wrote down — for myself, in a message to a friend — exactly which work suits me and which does not: integrations, parsers, CLI tools and data processing on .NET, yes; complex business logic in Python, no; anything without clear business rules, no. I have not deviated from that list since, and this site exists partly to say it out loud.",
    ],
    obstacle:
      "It ended in June and the next one did not start until August. Day five of that search is in my own messages, and so is the rejection on the thirteenth.",
  },
  {
    slug: "umbraco",
    title: "Legacy systems, and a year of my own clients",
    years: "2023 — 2024",
    jobs: ["UKAD", "Atlas Recruiting"],
    body: [
      "Umbraco, Optimizely and Azure: features across several .NET systems, legacy applications modernised, a VPN-to-Azure Identity migration tool. I got in on a take-home I put 348 commits into over eight days, with three rounds of feedback from someone who had no obligation to give any.",
      "When it ended I worked for myself for most of a year. A WordPress estate rescued while it was half down, Telegram bots, Python scrapers and parsers, sites in .NET, PHP and JS frameworks. None of it is on GitHub and none of it has a public URL I can show you — it was other people's businesses — but it is where the scraping and automation work in my side projects actually comes from.",
      `Then two months selling logistics over the phone to US clients, which I took deliberately rather than sit still. It is on this page for the same reason the ${inWords(silentDays)} days are: a record with the awkward parts removed is worth less than one without.`,
    ],
    obstacle:
      "One rejection that year was for being too young — the manager wanted candidates aged 27 and over. It was in writing, which at least made it quick.",
  },
  {
    slug: "first-jobs",
    title: "The first real tasks",
    years: "2021 — 2023",
    jobs: ["LetsData", "GlobalLogic"],
    body: [
      "A trainee programme, then legacy systems, then Angular and .NET on a new product. Four months after a lecture I was in a seat; eight months after that I recorded a voice note saying I was learning more than I ever had, because the tasks were real and somebody depended on them.",
      "In 2022 I wrote myself a plan — gRPC, SignalR, .NET 6, xUnit and AutoFixture, CI/CD, architecture books, a project of my own — and then moved city for the next job. The degree ran underneath all of it: I defended in June 2023, two and a half years into working full time.",
    ],
    obstacle:
      "Four months of applications before the next job, and it came from a mentor calling back rather than from anything I sent.",
  },
  {
    slug: "university",
    title: "Learning it in public",
    years: "2018 — 2021",
    jobs: [],
    body: [
      "It did not start at university. A year and a half before I sat the entrance exams I enrolled at Computer Academy STEP — evening courses, homework, marks — and that is where the question got settled. I defended it to a friend in 2019, before I had written anything anyone paid for: it is not a school, it is courses, and it gives you the basics of nearly every current language. It also meant the first years of the degree were easy, because someone had already explained most of it better.",
      "Then computer science at Petro Mohyla in Mykolaiv: C++, Java, a lexical analyser, a validator in TSQL, the usual coursework. What was not usual is where it went — by the second year everything I wrote went to GitHub, including the parts that embarrassed me in a lab report.",
      "The first public repository is a Unity test task from July 2020, and it is the one that settled the question: I liked the coding, not the games. Tests came before anyone asked for them — JUnit in a lab about a zoo, xUnit in a bank's take-home a year later — and the first CI I ever set up was three workflows on a repository that was one day old.",
    ],
  },
];

/** Source of truth for /about/, /cv/, /journey/, the JSON-LD and every topic page. Mirrors LinkedIn. */
export const experience: Job[] = [
  {
    start: "2025-08", end: null,
    company: "Boerse Stuttgart Digital",
    printBullets: 3,
    role: "Software Engineer",
    focus: "fintech / crypto trading",
    location: "Ukraine",
    mode: "Remote",
    topics: ["dotnet", "aspnet", "observability", "architecture"],
    points: [
      { text: "Build and maintain backend services in .NET / ASP.NET Core for a white-label crypto trading platform." },
      { text: "Own features end to end — domain logic, persistence, background jobs, and the observability around them." },
      { text: "Debug and fix production issues in distributed, job-driven systems." },
    ],
  },
  {
    start: "2024-12", end: "2025-06",
    company: "IT INNOVATIONS",
    printBullets: 2,
    role: "Software Engineer",
    location: "Kyiv",
    mode: "Hybrid",
    topics: ["dotnet", "aspnet", "angular", "typescript", "architecture"],
    points: [
      { text: "Led development of a greenfield .NET 9 backend using Clean Architecture and vertical-slice CQRS." },
      { text: "Delivered a management module with REST API, Specification filters, FluentValidation and FluentResults." },
      { text: "Built Angular features including a generic NgRx store factory and a reusable DataTable with dynamic templates." },
      { text: "Drove backend–frontend integration quality and mentored teammates on architecture." },
    ],
  },
  {
    start: "2024-09", end: "2024-10",
    company: "Atlas Recruiting",
    resumeCompact: true,
    role: "Sales Representative",
    location: "Kyiv",
    mode: "On-site",
    topics: [],
    points: [
      { text: "Worked directly with US clients and drivers on real-time logistics, negotiation and crisis decisions." },
      { text: "A short detour outside engineering; sharpened communication under pressure." },
    ],
  },
  {
    start: "2023-04", end: "2024-06",
    company: "UKAD",
    printBullets: 1,
    role: "Software Engineer",
    focus: "Umbraco / Optimizely / Azure",
    location: "Kyiv",
    mode: "Remote",
    topics: ["dotnet", "architecture"],
    points: [
      { text: "Delivered features across several Umbraco-based .NET systems." },
      { text: "Modernized legacy applications, improving stability and cutting issue turnaround." },
      { text: "Built a VPN-to-Azure Identity migration tool." },
      { text: "Applied CQRS and vertical-slice architecture in production codebases." },
    ],
  },
  {
    start: "2022-10", end: "2023-02",
    company: "LetsData",
    resumeCompact: true,
    role: "Junior Software Engineer",
    location: "Odessa",
    topics: ["angular", "dotnet"],
    points: [
      { text: "Built Angular UI and supported .NET backend work on a new product." },
      { text: "Implemented reusable components, forms and REST API integrations." },
    ],
  },
  {
    start: "2021-03", end: "2022-03",
    company: "GlobalLogic",
    resumeCompact: true,
    role: "Junior Software Engineer",
    location: "Mykolaiv",
    mode: "Remote",
    topics: ["dotnet"],
    points: [
      { text: "Completed the trainee program, then contributed to legacy system improvements." },
      { text: "Implemented features and fixes alongside cross-functional teams." },
    ],
  },
];

export const education = [
  {
    school: "Petro Mohyla Black Sea National University",
    degree: "Computer Science",
    when: "defended 2023",
    detail: "Mykolaiv, Ukraine",
    note: "Worked full time from the second year onward; the degree finished two and a half years into the first job.",
  },
  {
    school: "Computer Academy STEP",
    degree: "Programming",
    when: "2018 — 2020",
    detail: "Mykolaiv, Ukraine",
    note: "Enrolled a year and a half before university and kept going through the first year of it.",
  },
];

export type StackItem = {
  name: string;
  desc: string;
  /** Official project page. Renders as the word "site"; omit if there isn't one. */
  href?: string;
  /** Links the row to a topic page, when the thing is one. */
  topic?: TopicSlug;
};

/** Bump this when the stack below actually changes. Prints on /about/. */
export const usesUpdated = "2026-09";

/**
 * What I actually run, on /skills/.
 *
 * The test for a row is that I could be caught out by it: every service under
 * "the box" is defined in the homelab-gitops repo, every language under "day to
 * day" shows up in my own Wakapi, and the editor split is measured rather than
 * remembered. Nothing aspirational, nothing I used once.
 *
 * What is deliberately NOT here: versions, ports, hostnames, and the rest of
 * the containers on that machine. Naming a dozen mainstream services is an
 * explanation; enumerating the whole stack with versions is a CVE list for a
 * box whose address is already public. Same rule as gen-status.sh.
 *
 * No languages either: those are in `skills`, and a list cannot be evidence and
 * a restatement of another list at the same time. Nothing here expires in
 * public (ADR 0002); it is what the measured hours were measured on.
 */
export const uses: { group: string; items: StackItem[] }[] = [
  {
    group: "The box",
    items: [
      { name: "Hetzner VPS", topic: "hetzner", href: "https://www.hetzner.com/cloud", desc: "One cx53 in Nuremberg, 32 GB. Everything below runs on it." },
      { name: "Traefik", href: "https://traefik.io/traefik/", desc: "The public edge. It decides what the internet is allowed to reach." },
      { name: "Caddy", topic: "caddy", href: "https://caddyserver.com", desc: "Behind Traefik, serving this page as plain files." },
      { name: "Tailscale + Headscale", topic: "tailscale", href: "https://headscale.net", desc: "Self-hosted control plane for a private mesh, and the only way in for administration. Public SSH takes only deploy keys that can do nothing but rsync into this site." },
      { name: "Docker Compose", topic: "docker", href: "https://docs.docker.com/compose/", desc: "One stack per directory, every one of them in git." },
      { name: "SOPS + age", topic: "sops", href: "https://github.com/getsops/sops", desc: "Secrets encrypted in the repo. The box is not the source of truth." },
      { name: "Grafana", topic: "grafana", href: "https://grafana.com", desc: "Enough dashboards to answer “is it up”, not enough to become a hobby." },
      { name: "Postgres + TimescaleDB", topic: "postgres", href: "https://www.timescale.com", desc: "One database per stack. The health data is a hypertable." },
      { name: "Qdrant", href: "https://qdrant.tech", desc: "Vector index over seven years of chat history, and what Chronicle was built to replace." },
      { name: "Wakapi", href: "https://wakapi.dev", desc: "Self-hosted WakaTime. Where the editor hours on this page come from." },
      { name: "Vaultwarden", href: "https://github.com/dani-garcia/vaultwarden", desc: "Bitwarden-compatible vault, self-hosted." },
      { name: "AdGuard Home", href: "https://adguard.com/adguard-home/overview.html", desc: "Network-wide DNS and tracker filtering." },
    ],
  },
  {
    group: "Editor & terminal",
    items: [
      { name: "Claude Code", href: "https://claude.com/claude-code", desc: "Most of my measured editor time, which was not the plan and is now the fact." },
      { name: "JetBrains Rider", href: "https://www.jetbrains.com/rider/", desc: "Anything with a .sln. The debugger is the whole reason." },
      { name: "VS Code", href: "https://code.visualstudio.com", desc: "Everything else — TypeScript, markdown, config." },
      { name: "MCP", href: "https://modelcontextprotocol.io", desc: "How the assistant reaches my own data instead of guessing at it." },
    ],
  },
];

/**
 * What has my attention, on /about/. Edit the date whenever this changes.
 *
 * A short list on a page someone is already reading beats a route that has to
 * justify its own freshness, and nothing here expires in public (ADR 0002).
 */
export const now = {
  updated: "2026-09-29",
  items: [
    {
      label: "Work",
      text: "Backend services for a crypto trading platform at Boerse Stuttgart Digital.",
    },
    {
      label: "Building",
      text: "chargehand — sending questions about a codebase to coding agents, and checking every citation they come back with.",
    },
    {
      label: "Homelab",
      text: "One Hetzner box, every service defined in git, rebuildable from nothing.",
    },
    {
      label: "Writing",
      text: "More of it. The site has been easier to build than to fill.",
    },
  ],
};

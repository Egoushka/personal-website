import type { TopicSlug } from "./topics";

export const site = {
  name: "Yehor Hrabovskyi",
  /** The greeting. First thing on the page, and the register everything else matches. */
  greeting: "Hey — I'm Yehor.",
  domain: "hrabovskyi.online",
  url: "https://hrabovskyi.online",
  role: "Backend-first .NET developer",
  /**
   * One line under the greeting. It has been three sentences and a list of
   * symptoms; both were longer than the thing they said. The three lines under
   * it are the specifics, and they are checkable, which a paragraph is not.
   */
  intro: "I write .NET backends and fix the ones that fail quietly.",
  description:
    "Backend services in .NET and ASP.NET Core, a homelab on one box in Nuremberg, and writing about the parts that went wrong.",
  locale: "en_US",
  location: "Kyiv, Ukraine",
  /**
   * Prints next to the location. This replaced `openToWork`, which advertised
   * for a job this site is not looking for: the reader it is written for is
   * buying a week of work, not filling a role.
   */
  availability: "available for contract work",
  email: "egorgrabovskij@gmail.com",
  github: "https://github.com/Egoushka",
  githubHandle: "Egoushka",
  linkedin: "https://www.linkedin.com/in/yehor-hrabovskyi",
  linkedinHandle: "yehor-hrabovskyi",
};

/**
 * Feed autodiscovery links. Next.js replaces the whole `alternates` object when a
 * page defines one, so any page that sets its own canonical must spread this back
 * in or it silently loses the <link rel="alternate"> tags.
 */
export const feedTypes = {
  "application/rss+xml": [{ url: "/feed.xml", title: `${site.name} — RSS` }],
  "application/atom+xml": [{ url: "/atom.xml", title: `${site.name} — Atom` }],
  "application/feed+json": [{ url: "/feed.json", title: `${site.name} — JSON Feed` }],
};

/**
 * /links — everywhere else I am.
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
    note: "The public half of what I build. Attest lives here; most of the rest is still private.",
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
 * Three lines, and the only test each one has to pass is that a stranger can
 * check it in under a minute. That is why two of them carry links to somewhere
 * that is not this site — a claim I host myself is not evidence — and why the
 * day job carries none: it is the one thing here nobody can verify from
 * outside, so it is stated plainly and not dressed up.
 *
 * Where the figures come from, since the page cannot compute them: **87
 * countries** is one validator per country in github.com/Egoushka/attest, and
 * **197 defects** is the count in the package description on NuGet. Both are on
 * the other end of the links in this row. The third line's figure is not here at
 * all — it is counted at build time from the post's frontmatter, so the home
 * page assembles that row itself.
 */
export const proof: {
  label: string;
  text: string;
  links: { label: string; href: string }[];
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
   * Public or private. This used to be inferred from an empty `href`, which
   * meant "no link" and "private" were the same state and the page said
   * neither — a reader just found a project with nothing to click and drew
   * their own conclusion. Now it says so, and offers the profile instead.
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
  /** One line, for the CV. A four-line bullet on paper does not get read. */
  resumeLine?: string;
  /**
   * True for a project built for one user — me. The home page groups these
   * under their own label, because "a library 400 other people installed" and
   * "an app on my own phone" are not the same kind of evidence and putting
   * them in one list quietly averages the first down to the second.
   */
  side?: boolean;
  topics: TopicSlug[];
  readings: Reading[];
};

/**
 * Three projects, all load-bearing, and one of them installable by a stranger.
 * The set before this was an interview take-home, a utility with a handful of
 * commits, and a link to a GitHub profile — which is how a projects section
 * ends up saying nothing.
 *
 * Attest is first because it is the only one that anybody else runs. The other
 * two carry `side: true` and are grouped under their own label rather than
 * listed as its equals.
 *
 * Every number below was read out of the repo it describes, not estimated, and
 * every reading names where it came from. If a claim here can't be checked
 * against a source, it doesn't belong: unverified project copy has already had
 * to be corrected on this site three times.
 */
export const projects: Project[] = [
  {
    slug: "attest",
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
    slug: "chronicle",
    side: true,
    visibility: "private",
    tech: ["Python", "FastAPI", "Postgres", "pgvector", "MCP", "sentence-transformers", "pymorphy3", "Docker"],
    name: "Chronicle",
    status: "running",
    lang: "Python", shape: "event store",
    href: "",
    summary:
      "Makes seven years of chat history searchable by an assistant, by refusing to index the 65% of it that says “ok”.",
    description:
      "A personal event store that makes seven years of chat history searchable by an assistant. I measured the archive before touching it rather than guessing at it, and the measurement is the whole story: 681,331 messages across 487 chats, of which 65% are under twenty characters. My previous setup embedded every one of them, so roughly 442,000 vectors stood for “ок”, “+1” and “да” — crowding out the 1.5% that carry an actual proposition. Chronicle groups events into episodes using a time gap fitted per conversation, which cuts the index about elevenfold and improves retrieval at the same time. It serves the result over MCP, so the assistant queries it directly.",
    resumeLine:
      "Event store over a 681k-message archive. Aggregates events into episodes before indexing — ~11× smaller vector index, better retrieval — served over MCP.",
    topics: ["python", "retrieval"],
    readings: [
      { label: "Archive", value: "681,331 messages · 487 chats", source: "counted, not sampled, before any embedding ran" },
      { label: "Noise", value: "65% under 20 characters", source: "same pass over the same archive" },
      { label: "Index", value: "~11× smaller", source: "Chronicle's own measurement pass — not recomputable from this repo" },
      { label: "Users", value: "1 — me", source: "counted" },
    ],
  },
  {
    slug: "baseline",
    side: true,
    visibility: "private",
    tech: ["Flutter", "Dart", "Drift", "SQLite", "AES-GCM"],
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
      { label: "Users", value: "1 — me", source: "counted" },
    ],
  },
  {
    slug: "oura-platform",
    side: true,
    visibility: "private",
    tech: ["C#", ".NET", "Postgres", "TimescaleDB", "Dapper", "DbUp", "Serilog", "Grafana", "OAuth", "xUnit", "Testcontainers"],
    phase: "Stage 1 of 8. OAuth, storage, backfill and the scheduled poll work; the dashboards, the webhooks and the MCP server do not exist yet.",
    status: "building",
    name: "Oura Platform",
    lang: "C#", shape: "health warehouse",
    href: "",
    summary:
      "Pulls Oura Ring data into a database I own, so it can be joined against everything Oura will never see.",
    description:
      "A self-hosted health warehouse. Oura's own app will show you last night's sleep; it will never show you last night's sleep against the meetings in the calendar, the training load, the CO₂ in the bedroom or the glucose curve, because it does not have any of those. This pulls the ring's data out over OAuth into Postgres with TimescaleDB, on the same box as everything else, where SQL and Grafana can ask questions across all of it. Two processes, one database, no Kubernetes. It is stage 1 of 8 and the plan says so: OAuth, storage, backfill and the scheduled poll work; dashboards, webhooks and the MCP server do not exist yet.",
    resumeLine:
      "Self-hosted health warehouse in .NET: OAuth ingestion of wearable data into Postgres/TimescaleDB on a single VPS, joined against calendar and environment data.",
    topics: ["dotnet", "postgres", "self-hosting"],
    readings: [
      { label: "Stage", value: "1 of 8", source: "the staged plan in the repo; stages 2–4 are not built" },
      { label: "Storage", value: "Postgres + TimescaleDB", source: "hypertables, on the same box as the rest of the lab" },
      { label: "Users", value: "1 — me", source: "counted" },
    ],
  },
  {
    slug: "homelab-gitops",
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
      "The whole homelab as a git repository: one directory per Docker Compose stack, secrets committed as SOPS+age encrypted files with the plaintext gitignored, and Traefik at the edge deciding what the internet is allowed to reach. The point of doing it this way is falsifiable — if the box disappeared, this repository is what would rebuild it, and the only way to know that is that it has had to. It is also the reason the writing on this site exists: the deploy that shipped nothing for fifty-one days was found because the state of the machine is supposed to be reconstructable from here, and for fifty-one days it was not.",
    resumeLine:
      "Single-VPS homelab defined entirely in git: Compose stacks per service, SOPS+age encrypted secrets, Traefik edge, rebuildable from the repository.",
    topics: ["self-hosting", "infrastructure", "docker", "sops"],
    readings: [
      { label: "Host", value: "one cx53, 32 GB", source: "the repo's own README; tailnet address, not a public one" },
      { label: "Secrets", value: "encrypted in git", source: "*.enc committed, plaintext gitignored — checkable in the tree" },
      { label: "Stacks", value: "one directory each", source: "the layout of the repository" },
    ],
  },
  {
    slug: "trader",
    side: true,
    visibility: "private",
    tech: ["Python", "nautilus_trader", "ccxt", "polars", "DuckDB", "Parquet"],
    phase: "Phase 3 of 7. The backtesting framework is built and the gate was not passed: both opening hypotheses are dead, and no live order has ever been placed.",
    status: "building",
    name: "Trader",
    lang: "Python", shape: "backtesting",
    href: "",
    summary:
      "A systematic crypto trading system whose result so far is two pre-registered hypotheses, both rejected, and no orders.",
    description:
      "Trend following and funding-carry capture on crypto perpetuals, built in the order that makes the answer trustworthy rather than the order that gets to a chart fastest: hypotheses pre-registered before the data was touched, a conservative cost model every strategy has to route through, a second-source reconciliation against another exchange, and Deflated Sharpe and PBO reporting on top of walk-forward selection. The gate for phase 3 was that at least one candidate survives all of it. None did — the known-bad control is correctly rejected at Sharpe −0.43 and PBO 0.82, and both opening hypotheses are dead. That is the project working. A backtest that finds an edge on the first try has usually found a bug, and the expensive version of this lesson is paid for with real money.",
    resumeLine:
      "Systematic trading research in Python: pre-registered hypotheses, conservative cost model, cross-exchange reconciliation, walk-forward with Deflated Sharpe/PBO. Both opening hypotheses rejected.",
    topics: ["python", "architecture"],
    readings: [
      { label: "Phase", value: "3 of 7", source: "the phase gates in the repo's plan, which are not skippable" },
      { label: "Hypotheses", value: "2 pre-registered, 2 rejected", source: "the research log, which records failures too" },
      { label: "Capital at risk", value: "none", source: "testnet only; there are no live orders" },
    ],
  },
];


/**
 * What I would put my name to.
 *
 * This replaced a list derived from the topic vocabulary — every technology
 * topic that any job or project referenced. That rule had the virtue of being
 * uncheatable and the vice of being stupid: it put Flutter on a backend CV
 * because one app on my own phone is written in it, and it could not print
 * Clean Architecture, EF Core, SQL Server or NgRx at all, because those are
 * not topics and never will be.
 *
 * So it is curated now, and the discipline moves into `now`: every entry says
 * where it actually stands, including when that is "this is my gap". A skill
 * whose `now` line would have to be vague is not a skill I present.
 *
 * `wakatime` is the key my own Wakapi reports the language under. When the
 * box is publishing (see scripts/gen-status.sh) the page prints the measured
 * share beside the claim; when it is not, the claim stands alone. Nothing here
 * depends on the figure existing.
 */
export type Skill = {
  name: string;
  /** Links to the hub, when the vocabulary has one. */
  topic?: TopicSlug;
  now: string;
  wakatime?: string;
};

export const skills: { group: string; items: Skill[] }[] = [
  {
    group: "Backend",
    items: [
      { name: "C# / .NET", topic: "dotnet", wakatime: "C#",
        now: "Five years, and most of every working week." },
      { name: "ASP.NET Core", topic: "aspnet",
        now: "Where the services live: APIs, background jobs, third-party integrations." },
      { name: "EF Core", now: "The default at work. Dapper when the query matters more than the mapping." },
      { name: "CQRS and vertical slices", topic: "architecture",
        now: "A greenfield .NET 9 backend built this way in 2025, and an opinion about when it is overkill." },
      { name: "Background jobs and scheduling",
        now: "The part that fails quietly, which is why most of what I write about starts here." },
      { name: "RabbitMQ", now: "Cross-service messaging at work. My first broker feature shipped in 2025 — two days of it spent on a consumer I had never registered." },
      { name: "Redis", now: "Read caches and the invalidation that goes with them." },
    ],
  },
  {
    group: "Data",
    items: [
      { name: "PostgreSQL", topic: "postgres", now: "Everywhere I get to choose. TimescaleDB when the rows are a time series." },
      { name: "SQL Server", now: "At work. Deep SQL is the gap I named myself in 2026 and the one I am deliberately closing." },
      { name: "Python", topic: "python", wakatime: "Python",
        now: "Ingestion, retrieval and backtesting. Not where I would take complex business logic, and I say so before anyone asks." },
      { name: "Retrieval", topic: "retrieval", now: "Embeddings and vector search, and a working argument that most of what people index is noise." },
    ],
  },
  {
    group: "Infrastructure",
    items: [
      { name: "Docker Compose", topic: "docker", now: "One stack per service, every one of them in git." },
      { name: "Linux", topic: "linux", now: "One Ubuntu box I run like production, because it is the only one I get paged for." },
      { name: "Traefik and Caddy", topic: "caddy", now: "The edge and the origin of everything I self-host, including this page." },
      { name: "Tailscale and Headscale", topic: "tailscale", now: "The only way in. SSH is not on the internet." },
      { name: "SOPS and age", topic: "sops", now: "Secrets encrypted in the repository, so the box is never the source of truth." },
      { name: "GitHub Actions", topic: "ci-cd", now: "Every deploy here, and the 51 days I once spent not noticing one had stopped." },
    ],
  },
  {
    group: "Front end",
    items: [
      { name: "TypeScript", topic: "typescript", wakatime: "TypeScript", now: "This site, and anything that reaches a browser." },
      { name: "Angular and NgRx", topic: "angular", now: "When the work reaches the front end. A generic NgRx store factory is the piece I would show." },
    ],
  },
  {
    group: "How I work",
    items: [
      { name: "Observability", topic: "observability", now: "Structured logs, Grafana, and the habit of asking what this will look like at 3am before it is 3am." },
      { name: "Debugging production", topic: "debugging", now: "Distributed, job-driven systems, on a rotation. The fastest way I know to learn what a system does when nobody is watching." },
      { name: "Testing", now: "xUnit and Testcontainers. I wrote tests in university before anyone asked for them, which is either a virtue or a warning." },
      { name: "Self-hosting", topic: "self-hosting", now: "Everything above, on one box, defined in git and rebuildable from it." },
    ],
  },
];

export type Job = {
  when: string;
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
};

/** Source of truth for /about/, /cv/ and every topic page. Mirrors LinkedIn. */
export const experience: Job[] = [
  {
    when: "Aug 2025 — present",
    company: "Boerse Stuttgart Digital",
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
    when: "Dec 2024 — Jun 2025",
    company: "IT INNOVATIONS",
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
    when: "Sep 2024 — Oct 2024",
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
    when: "Apr 2023 — Jun 2024",
    company: "UKAD",
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
    when: "Oct 2022 — Feb 2023",
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
    when: "Mar 2021 — Mar 2022",
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
    detail: "Mykolaiv, Ukraine",
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
 * What I actually run and use, on /about/.
 *
 * The test for a row is that I could be caught out by it: every service under
 * "the box" is defined in the homelab-gitops repo, every language under "day to
 * day" shows up in my own Wakapi, and the editor split is measured rather than
 * remembered. Nothing aspirational, nothing I used once.
 *
 * What is deliberately NOT here: versions, ports, hostnames, and the other
 * ninety-odd containers on that machine. Naming a dozen mainstream services is
 * an explanation; enumerating the whole stack with versions is a CVE list for a
 * box whose address is already public. Same rule as scripts/gen-status.sh.
 *
 * This used to be its own page at /uses/ with a six-month expiry that struck the
 * heading through in public when it lapsed. The expiry is gone with the ledger —
 * see ADR 0002 — so this is now a section of the page about me, which is what it
 * always was.
 */
export const uses: { group: string; items: StackItem[] }[] = [
  {
    group: "The box",
    items: [
      { name: "Hetzner VPS", topic: "hetzner", href: "https://www.hetzner.com/cloud", desc: "One cx53 in Nuremberg, 32 GB. Everything below runs on it." },
      { name: "Traefik", href: "https://traefik.io/traefik/", desc: "The public edge. It decides what the internet is allowed to reach." },
      { name: "Caddy", topic: "caddy", href: "https://caddyserver.com", desc: "Behind Traefik, serving this page as plain files." },
      { name: "Tailscale + Headscale", topic: "tailscale", href: "https://headscale.net", desc: "Self-hosted control plane for a private mesh. SSH is not on the internet." },
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
  {
    group: "Day to day",
    items: [
      { name: "C# / .NET", topic: "dotnet", href: "https://dotnet.microsoft.com", desc: "The majority of every week. ASP.NET Core, EF Core, MediatR-style CQRS." },
      { name: "ASP.NET Core", topic: "aspnet", href: "https://learn.microsoft.com/aspnet/core", desc: "Where the services actually live — APIs, jobs, integrations." },
      { name: "SQL Server", desc: "At work. Postgres everywhere I get to choose." },
      { name: "Python", topic: "python", href: "https://www.python.org", desc: "The data work: ingestion, retrieval, anything with a notebook in its past." },
      { name: "Angular + TypeScript", topic: "angular", href: "https://angular.dev", desc: "When the work reaches the front end. NgRx when state gets real." },
      { name: "Flutter", topic: "flutter", href: "https://flutter.dev", desc: "One app, on one phone, built to prove a point about measurement." },
    ],
  },
];

/**
 * What has my attention. Edit the date whenever this changes.
 *
 * This was /now/, a page of its own with a rule that dropped the link at six
 * months. The rule is gone with the ledger (ADR 0002) and so is the page — it's
 * a section of /about/ now. A short list on a page someone is already reading
 * beats a route that has to justify its own freshness.
 */
export const now = {
  updated: "2026-09-21",
  items: [
    {
      label: "Work",
      text: "Backend services for a crypto trading platform at Boerse Stuttgart Digital.",
    },
    {
      label: "Building",
      text: "Chronicle — turning seven years of chat history into something an assistant can actually search.",
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

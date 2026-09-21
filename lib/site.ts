import type { TopicSlug } from "./topics";

export const site = {
  name: "Yehor Hrabovskyi",
  /** The greeting. First thing on the page, and the register everything else matches. */
  greeting: "Hey — I'm Yehor.",
  domain: "hrabovskyi.online",
  url: "https://hrabovskyi.online",
  role: "Backend-first .NET developer",
  /**
   * The first sentence under the greeting, and the only one stored here. The
   * home page adds a second sentence whose figure is counted at build time —
   * see `longestSpan` in lib/readings.ts — because a number about my work is
   * the one part of a pitch that must not be typed by hand.
   *
   * It replaced "A .NET dev who just likes building interesting things. Some of
   * it worked, some of it didn't." That sentence was true and it answered a
   * question nobody arriving from a cold email is asking.
   */
  intro:
    "I fix .NET backends that fail quietly: the integration that reports success, the job that stopped running, the numbers that stop reconciling.",
  description:
    "Backend services in .NET and ASP.NET Core, a homelab on one box in Helsinki, and writing about the parts that went wrong.",
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
    note: "Everything I build in public, including this site.",
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
      { label: "repo ↗", href: "https://github.com/Egoushka/attest" },
      { label: "nuget ↗", href: "https://www.nuget.org/packages/Attest" },
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
  /** Language and shape, e.g. "Python · event store". Prints beside the name. */
  meta: string;
  /**
   * Must be a PUBLIC URL. `*.lab.hrabovskyi.online` is a tailnet-only namespace
   * (100.64/10), so a Forgejo link there is a dead link for every visitor. Leave
   * this empty rather than emit one — the templates omit the link when it is.
   */
  href: string;
  /** One line. This is what the homepage and the index show. */
  summary: string;
  /** The full account, on the project's own page. */
  description: string;
  /** One line, for the CV. A four-line bullet on paper does not get read. */
  resumeLine?: string;
  topics: TopicSlug[];
  readings: Reading[];
};

/**
 * Two projects, both load-bearing. The previous three were an interview
 * take-home, a utility with a handful of commits, and a link to a GitHub
 * profile — which is how a projects section ends up saying nothing.
 *
 * Every number below was read out of the repo it describes, not estimated, and
 * every reading names where it came from. If a claim here can't be checked
 * against a source, it doesn't belong: unverified project copy has already had
 * to be corrected on this site three times.
 */
export const projects: Project[] = [
  {
    slug: "chronicle",
    name: "Chronicle",
    status: "running",
    meta: "Python · event store",
    href: "https://github.com/Egoushka/chronicle",
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
    name: "Baseline",
    status: "running",
    meta: "Flutter · instrument",
    href: "https://github.com/Egoushka/baseline",
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
];

export type Point = { text: string; link?: { href: string; label: string }; after?: string };
export type Job = {
  when: string;
  company: string;
  role: string;
  location?: string;
  points: Point[];
  /**
   * What the role was actually built with. This is the edge that makes a topic
   * page honest — without it a topic can only ever prove I have a side project,
   * never that I've been paid to use it.
   */
  topics: TopicSlug[];
  /** Kept off the homepage timeline; still shown on /cv/ so the record has no gaps. */
  resumeOnly?: boolean;
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
    role: "Software Engineer · fintech / crypto trading",
    location: "Ukraine · Remote",
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
    location: "Kyiv · Hybrid",
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
    location: "Kyiv · On-site",
    resumeOnly: true,
    topics: [],
    points: [
      { text: "Worked directly with US clients and drivers on real-time logistics, negotiation and crisis decisions." },
      { text: "A short detour outside engineering; sharpened communication under pressure." },
    ],
  },
  {
    when: "Apr 2023 — Jun 2024",
    company: "UKAD",
    role: "Software Engineer · Umbraco / Optimizely / Azure",
    location: "Kyiv · Remote",
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
    location: "Mykolaiv · Remote",
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
  /** Official project page. Renders as a ↗ mark; omit if there isn't one. */
  href?: string;
  /** Links the row to a topic page, when the thing is one. */
  topic?: TopicSlug;
};

/** Bump this when the stack below actually changes. Prints on /about/. */
export const usesUpdated = "2026-07";

/**
 * What I actually run and use, on /about/.
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
      { name: "Hetzner VPS", topic: "hetzner", href: "https://www.hetzner.com/cloud", desc: "Ubuntu, Helsinki. The whole lab on one machine." },
      { name: "Caddy", topic: "caddy", href: "https://caddyserver.com", desc: "Reverse proxy and automatic HTTPS. It's serving this page." },
      { name: "Tailscale + Headscale", topic: "tailscale", href: "https://headscale.net", desc: "Self-hosted control plane for a private mesh VPN. The only way in." },
      { name: "Vaultwarden", href: "https://github.com/dani-garcia/vaultwarden", desc: "Bitwarden-compatible vault, self-hosted." },
      { name: "AdGuard Home", href: "https://adguard.com/adguard-home/overview.html", desc: "Network-wide DNS and tracker filtering." },
      { name: "SOPS + age", topic: "sops", href: "https://github.com/getsops/sops", desc: "Encrypted, version-controlled infra config." },
      { name: "Grafana", topic: "grafana", href: "https://grafana.com", desc: "Enough dashboards to answer “is it up”." },
    ],
  },
  {
    group: "Editor & terminal",
    items: [
      { name: "JetBrains Rider", href: "https://www.jetbrains.com/rider/", desc: "Anything with a .sln. The debugger is the whole reason." },
      { name: "VS Code", href: "https://code.visualstudio.com", desc: "Everything else — TypeScript, markdown, config." },
      { name: "Claude Code", href: "https://claude.com/claude-code", desc: "Pair programming in the terminal." },
    ],
  },
  {
    group: "Day to day",
    items: [
      { name: "C# / .NET", topic: "dotnet", href: "https://dotnet.microsoft.com", desc: "ASP.NET Core, EF Core, MediatR-style CQRS." },
      { name: "PostgreSQL", topic: "postgres", href: "https://www.postgresql.org", desc: "At home. SQL Server at work." },
      { name: "Angular + TypeScript", topic: "angular", href: "https://angular.dev", desc: "When the work reaches the front end." },
      { name: "Docker Compose", topic: "docker", href: "https://docs.docker.com/compose/", desc: "Every service in the lab, defined in git." },
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
  updated: "2026-07-29",
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
      text: "More of it. The infrastructure here has been well ahead of the content it serves, which is the wrong way round.",
    },
  ],
};

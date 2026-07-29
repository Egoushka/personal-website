export const site = {
  name: "Yehor Hrabovskyi",
  domain: "hrabovskyi.online",
  url: "https://hrabovskyi.online",
  role: "Backend-first full-stack engineer",
  tagline: "Clean code, calm mind, hard lessons, quiet wins.",
  description:
    ".NET / C#, ASP.NET Core, Angular. Fintech, distributed systems, and a self-hosted homelab.",
  locale: "en_US",
  email: "egorgrabovskij@gmail.com",
  github: "https://github.com/Egoushka",
  githubHandle: "Egoushka",
  linkedin: "https://www.linkedin.com/in/yehor-hrabovskyi",
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

export const skills = [
  "C# / .NET",
  "ASP.NET Core",
  "Angular",
  "TypeScript",
  "PostgreSQL",
  "Docker",
  "Caddy",
  "Grafana",
  "Linux",
];

export type Project = {
  name: string;
  meta: string;
  /**
   * Must be a PUBLIC URL. `*.lab.hrabovskyi.online` is a tailnet-only namespace
   * (100.64/10), so a Forgejo link there is a dead link for every visitor. Leave
   * this empty rather than emit one — the templates omit the link when it is.
   */
  href: string;
  description: string;
  /** One line, for the CV. A four-line bullet on paper does not get read. */
  resumeLine?: string;
  tags: string[];
};

/**
 * Two projects, both load-bearing. The previous three were an interview
 * take-home, a utility with a handful of commits, and a link to a GitHub
 * profile — which is how a projects section ends up saying nothing.
 *
 * Every number below was read out of the repo, not estimated. If a claim here
 * cannot be checked against the source, it does not belong here: unverified
 * project copy has already had to be corrected on this site three times.
 */
export const projects: Project[] = [
  {
    name: "Chronicle",
    meta: "Python · event store",
    href: "https://github.com/Egoushka/chronicle",
    description:
      "A personal event store that makes seven years of chat history searchable by an assistant. The archive was measured rather than assumed: 681,331 messages across 487 chats, of which 65% are under twenty characters. The existing setup embedded every one of them, so roughly 442,000 vectors stood for “ок”, “+1” and “да” — crowding out the 1.5% that carry an actual proposition. Chronicle groups events into episodes using a time gap fitted per conversation, which cuts the index about elevenfold and improves retrieval at the same time. It serves the result over MCP, so the assistant queries it directly.",
    resumeLine:
      "Personal event store over a 681k-message archive. Aggregates events into episodes before indexing, cutting the vector index ~11× while improving retrieval; served to an assistant over MCP.",
    // The language is already in `meta`; tags carry the domain, not a repeat.
    tags: ["retrieval", "embeddings", "MCP"],
  },
  {
    name: "Baseline",
    meta: "Flutter · instrument",
    href: "https://github.com/Egoushka/baseline",
    description:
      "A self-observation app that records perceived change — where you are compared to the mark before — and never an absolute mood, score or emoji. The first mark is the baseline; every later one is placed relative to its predecessor. What makes it worth building is what it refuses to do: after a seven-day gap the line visibly breaks rather than pretending the comparison still holds, an uncertain placement is recorded as a fuzzy point instead of being laundered into false precision, and there is no global scale at all, because a chain of subjective deltas is a random walk. It measures shape and rhythm, and says so.",
    resumeLine:
      "Flutter app for tracking perceived change rather than absolute mood. Breaks the line after a 7-day gap and records uncertain entries as fuzzy points, rather than implying precision the data does not have.",
    tags: ["Dart", "data viz", "product design"],
  },
];

export type Point = { text: string; link?: { href: string; label: string }; after?: string };
export type Job = {
  when: string;
  company: string;
  role: string;
  location?: string;
  points: Point[];
  /** Kept off the homepage timeline; still shown on /resume/ so the record has no gaps. */
  resumeOnly?: boolean;
};

/** Source of truth for both the homepage timeline and /resume/. Mirrors LinkedIn. */
export const experience: Job[] = [
  {
    when: "Aug 2025 — present",
    company: "Boerse Stuttgart Digital",
    role: "Software Engineer · fintech / crypto trading",
    location: "Ukraine · Remote",
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
    role: "Sales Representative",
    location: "Kyiv · On-site",
    resumeOnly: true,
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
    role: "Junior Software Engineer",
    location: "Odessa",
    points: [
      { text: "Built Angular UI and supported .NET backend work on a new product." },
      { text: "Implemented reusable components, forms and REST API integrations." },
    ],
  },
  {
    when: "Mar 2021 — Mar 2022",
    company: "GlobalLogic",
    role: "Junior Software Engineer",
    location: "Mykolaiv · Remote",
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

export type StackItem = { name: string; desc: string };

export const homelab: StackItem[] = [
  { name: "Hetzner VPS", desc: "Ubuntu, Helsinki. The whole lab on one box." },
  { name: "Caddy", desc: "Reverse proxy + automatic HTTPS. Serves this page." },
  { name: "Tailscale + Headscale", desc: "Self-hosted control plane for a private mesh VPN." },
  { name: "Vaultwarden", desc: "Self-hosted Bitwarden-compatible secrets vault." },
  { name: "AdGuard Home", desc: "Network-wide DNS + ad/tracker filtering." },
  { name: "GitOps · SOPS + age", desc: "Encrypted, version-controlled infra config." },
];

/** Shown in the /uses/ rail. Bump it when the list below actually changes. */
export const usesUpdated = "2026-07";

/** /uses — the homelab grid plus the day-to-day kit. */
export const uses: { group: string; items: StackItem[] }[] = [
  { group: "Server", items: homelab },
  {
    group: "Editor & terminal",
    items: [
      { name: "JetBrains Rider", desc: "Day-to-day .NET work." },
      { name: "VS Code", desc: "Everything else — TypeScript, markdown, config." },
      { name: "Claude Code", desc: "Pair-programming in the terminal." },
    ],
  },
  {
    group: "Day to day",
    items: [
      { name: "C# / .NET", desc: "ASP.NET Core, EF Core, MediatR-style CQRS." },
      { name: "PostgreSQL", desc: "Plus SQL Server at work." },
      { name: "Angular + TypeScript", desc: "When the work reaches the front end." },
      { name: "Docker Compose", desc: "Every service in the lab, defined in git." },
    ],
  },
];

/**
 * /now — what has my attention. Edit the date whenever this changes.
 *
 * One label, one sentence, one-to-one. The label goes in the rail; a second
 * sentence in any row means the page needs a different structure, not a longer
 * paragraph.
 *
 * Standing rule from the design: if this page passes six months without an
 * edit, drop the footer link rather than leave it. A missing /now/ is neutral;
 * a stale one is a statement.
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
      text: "Chronicle — a personal event store that turns seven years of chat history into something an assistant can actually search.",
    },
    {
      label: "Homelab",
      text: "One Hetzner box, every service defined in git, rebuildable from nothing.",
    },
    {
      label: "Writing",
      text: "More of it. The infrastructure here is well ahead of the content it serves, and that is the wrong way round.",
    },
  ],
};

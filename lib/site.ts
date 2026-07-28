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
  href: string;
  description: string;
  tags: string[];
};

export const projects: Project[] = [
  {
    name: "MetaExchange",
    meta: "C#",
    href: "https://github.com/Egoushka/MetaExchange",
    description:
      "A best-execution engine that computes the optimal way to buy or sell a given volume across multiple order books, respecting per-exchange balance constraints.",
    tags: [".NET", "algorithms", "order books"],
  },
  {
    name: "Jirify",
    meta: "C#",
    href: "https://github.com/Egoushka/Jirify",
    description:
      "A tool for working with Jira from the terminal / automating issue workflows — built to cut the clicks out of day-to-day ticket management.",
    tags: [".NET", "CLI", "Jira API"],
  },
  {
    name: "NetworkMonitor",
    meta: "C#",
    href: "https://github.com/Egoushka/NetworkMonitor",
    description:
      "A monitoring utility for tracking network/host availability — grew out of wanting visibility into my own homelab before paying for a SaaS.",
    tags: [".NET", "monitoring", "homelab"],
  },
  {
    name: "More on GitHub",
    meta: "@Egoushka",
    href: "https://github.com/Egoushka",
    description:
      "Smaller experiments and learning projects — webhooks, real-time chat, API integrations. The kind of thing you build to understand a thing, not to ship it.",
    tags: ["misc", "experiments"],
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
      {
        text: "Debug and fix production issues in distributed, job-driven systems (see the ",
        link: { href: "/posts/referral-bug/", label: "referral-tier writeup" },
        after: ").",
      },
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

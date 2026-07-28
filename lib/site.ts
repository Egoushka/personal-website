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
  points: Point[];
};

export const experience: Job[] = [
  {
    when: "2023 — present",
    company: "Boerse Stuttgart Digital",
    role: "Full-Stack Developer (backend-first) · fintech / crypto trading",
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
    when: "earlier",
    company: "GlobalLogic — .NET Bootcamp",
    role: "Transition from C++ into .NET / C#",
    points: [
      { text: "Intensive .NET training that moved me from a C++ background into professional C# development." },
    ],
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

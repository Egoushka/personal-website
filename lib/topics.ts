/**
 * The site's one vocabulary.
 *
 * A Post, a Project and a Job all reference the same slugs, and `/topics/<slug>/`
 * gathers them. Separate vocabularies make "dotnet", "C# / .NET" and ".NET" three
 * unrelated strings, and nothing can answer "show me everything about Postgres".
 *
 * Two kinds live here on purpose. A **theme** is something I do (debugging,
 * self-hosting); a **technology** is something I do it with. They share a URL
 * space because a reader looking for "Kubernetes" and a reader looking for
 * "debugging" want the same page shape — everything I have about it.
 *
 * Closed vocabulary. `npm run validate` fails on anything not listed here, which
 * is what stops one post saying "ci-cd" and the next saying "cicd" until there
 * are two hubs of one post each.
 */

export type TopicKind = "theme" | "technology";

export type Topic = {
  name: string;
  kind: TopicKind;
  /** One sentence, first person. Renders as the topic page's standfirst. */
  blurb: string;
};

export const TOPICS = {
  // ── themes ────────────────────────────────────────────────────────────────
  infrastructure: {
    name: "Infrastructure",
    kind: "theme",
    blurb: "Servers, networking, and the parts that only matter at 3am.",
  },
  "self-hosting": {
    name: "Self-hosting",
    kind: "theme",
    blurb: "Running things myself, on one box, on purpose.",
  },
  debugging: {
    name: "Debugging",
    kind: "theme",
    blurb: "Bugs worth writing down, and how they actually got found.",
  },
  "ci-cd": {
    name: "CI/CD",
    kind: "theme",
    blurb: "Pipelines, deploys, and the ways they fail quietly.",
  },
  architecture: {
    name: "Architecture",
    kind: "theme",
    blurb: "Clean Architecture, CQRS, vertical slices — and when they're overkill.",
  },
  observability: {
    name: "Observability",
    kind: "theme",
    blurb: "Knowing what a system is doing without attaching a debugger to production.",
  },
  retrieval: {
    name: "Retrieval",
    kind: "theme",
    blurb: "Embeddings, vector search, and why most of what you index is noise.",
  },

  // ── technologies ──────────────────────────────────────────────────────────
  dotnet: {
    name: "C# / .NET",
    kind: "technology",
    blurb: "The day job and the default. Five years of it.",
  },
  aspnet: {
    name: "ASP.NET Core",
    kind: "technology",
    blurb: "Where the backend services actually live.",
  },
  postgres: {
    name: "PostgreSQL",
    kind: "technology",
    blurb: "Postgres at home, SQL Server at work.",
  },
  typescript: {
    name: "TypeScript",
    kind: "technology",
    blurb: "This site, and anything else that reaches a browser.",
  },
  angular: {
    name: "Angular",
    kind: "technology",
    blurb: "When the work reaches the front end. NgRx when state gets real.",
  },
  docker: {
    name: "Docker",
    kind: "technology",
    blurb: "One compose file per service. If it isn't in one, it isn't running.",
  },
  caddy: {
    name: "Caddy",
    kind: "technology",
    blurb: "Serves this page. The only networking config I still keep by hand.",
  },
  tailscale: {
    name: "Tailscale and Headscale",
    kind: "technology",
    blurb: "The only way in. SSH isn't exposed to the internet.",
  },
  sops: {
    name: "SOPS + age",
    kind: "technology",
    blurb: "Secrets encrypted in git. The repo is the source of truth, not the box.",
  },
  grafana: {
    name: "Grafana",
    kind: "technology",
    blurb: "Enough dashboards to answer “is it up”, not enough to become a hobby.",
  },
  linux: {
    name: "Linux",
    kind: "technology",
    blurb: "Ubuntu, unattended upgrades, and nothing installed by hand.",
  },
  hetzner: {
    name: "Hetzner VPS",
    kind: "technology",
    blurb: "One shared-vCPU box in Nuremberg. Everything else runs on it.",
  },
  python: {
    name: "Python",
    kind: "technology",
    blurb: "Where the data work happens. Chronicle is written in it.",
  },
  flutter: {
    name: "Flutter",
    kind: "technology",
    blurb: "One app, on my own phone, built to prove a point about measurement.",
  },
} as const satisfies Record<string, Topic>;

export type TopicSlug = keyof typeof TOPICS;

export const ALL_TOPICS = Object.keys(TOPICS) as TopicSlug[];

export function isTopic(value: string): value is TopicSlug {
  return Object.prototype.hasOwnProperty.call(TOPICS, value);
}

/** Never throws. An unknown slug renders as itself rather than crashing a page. */
export function topicName(slug: string): string {
  return isTopic(slug) ? TOPICS[slug].name : slug;
}

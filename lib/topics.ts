/**
 * The site's one vocabulary.
 *
 * There used to be three: `lib/tags.ts` for posts, `lib/skills.ts` for the graph,
 * and a loose `skills` string array for the CV. Three vocabularies for one set of
 * ideas means "dotnet", "C# / .NET" and ".NET" were three unrelated strings, and
 * nothing could answer "show me everything about Postgres". Now a Post, a Project
 * and a Job all reference the same slugs, and `/topics/<slug>/` gathers them.
 *
 * Two kinds live here on purpose. A **theme** is something I do (debugging,
 * self-hosting); a **technology** is something I do it with. They share a URL
 * space because a reader looking for "Kubernetes" and a reader looking for
 * "debugging" want the same page shape — everything I have about it.
 *
 * Closed vocabulary. `npm run validate` fails on anything not listed here, which
 * is what stops one post saying "ci-cd" and the next saying "cicd" until there
 * are two hubs of one post each.
 *
 * `graph` is optional and means "this belongs on the stack diagram". Only give a
 * topic coordinates if you can also write honest edges for it below — Python and
 * Flutter are real topics with no place in a diagram about how the server is
 * wired together, and that is fine.
 */

export type TopicKind = "theme" | "technology";

export type Topic = {
  name: string;
  kind: TopicKind;
  /** One sentence, first person. Renders as the topic page's standfirst. */
  blurb: string;
  /** Position on the stack diagram. Omit and the topic simply is not on it. */
  graph?: { x: number; y: number; group: GraphGroup };
};

export type GraphGroup = "infra" | "backend" | "frontend";

export const graphGroups: Record<GraphGroup, string> = {
  infra: "Runs the box",
  backend: "Backend",
  frontend: "Front end",
};

/**
 * Wide enough for the longest label to finish inside the box. Labels sit to the
 * right of their node at roughly 9.6 units per character, so "Tailscale ·
 * Headscale" sets the right-hand bound, not the node coordinates.
 */
export const GRAPH_VIEWBOX = { w: 900, h: 470 } as const;

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
    graph: { x: 552, y: 232, group: "backend" },
  },
  aspnet: {
    name: "ASP.NET Core",
    kind: "technology",
    blurb: "Where the backend services actually live.",
    graph: { x: 548, y: 128, group: "backend" },
  },
  postgres: {
    name: "PostgreSQL",
    kind: "technology",
    blurb: "Postgres at home, SQL Server at work.",
    graph: { x: 592, y: 350, group: "backend" },
  },
  typescript: {
    name: "TypeScript",
    kind: "technology",
    blurb: "This site, and anything else that reaches a browser.",
    graph: { x: 726, y: 128, group: "frontend" },
  },
  angular: {
    name: "Angular",
    kind: "technology",
    blurb: "When the work reaches the front end. NgRx when state gets real.",
    graph: { x: 748, y: 246, group: "frontend" },
  },
  docker: {
    name: "Docker",
    kind: "technology",
    blurb: "One compose file per service. If it isn't in one, it isn't running.",
    graph: { x: 258, y: 336, group: "infra" },
  },
  caddy: {
    name: "Caddy",
    kind: "technology",
    blurb: "Serves this page. The only networking config I still keep by hand.",
    graph: { x: 250, y: 224, group: "infra" },
  },
  tailscale: {
    name: "Tailscale and Headscale",
    kind: "technology",
    blurb: "The only way in. SSH isn't exposed to the internet.",
    graph: { x: 108, y: 158, group: "infra" },
  },
  sops: {
    name: "SOPS + age",
    kind: "technology",
    blurb: "Secrets encrypted in git. The repo is the source of truth, not the box.",
    graph: { x: 388, y: 412, group: "infra" },
  },
  grafana: {
    name: "Grafana",
    kind: "technology",
    blurb: "Enough dashboards to answer “is it up”, not enough to become a hobby.",
    graph: { x: 396, y: 300, group: "infra" },
  },
  linux: {
    name: "Linux",
    kind: "technology",
    blurb: "Ubuntu, unattended upgrades, and nothing installed by hand.",
    graph: { x: 96, y: 286, group: "infra" },
  },
  hetzner: {
    name: "Hetzner VPS",
    kind: "technology",
    blurb: "One shared-vCPU box in Nuremberg. Everything else runs on it.",
    graph: { x: 110, y: 390, group: "infra" },
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

/** Topics that carry graph coordinates, in vocabulary order. */
export function graphTopics(): (Topic & { slug: TopicSlug; graph: NonNullable<Topic["graph"]> })[] {
  return ALL_TOPICS.flatMap((slug) => {
    const t: Topic = TOPICS[slug];
    return t.graph ? [{ ...t, slug, graph: t.graph }] : [];
  });
}

/**
 * How the stack is wired.
 *
 * ── The rule for this list ──────────────────────────────────────────────────
 * An edge must assert something TRUE and checkable about how these two things
 * are actually used together — "Caddy runs as a container", "EF Core talks to
 * Postgres". An edge meaning "both of these are backend words" is noise, and a
 * graph of noise is why most skill diagrams on personal sites are worthless.
 * If you can't write the `why`, don't add the edge.
 */
export type TopicEdge = { from: TopicSlug; to: TopicSlug; why: string };

export const topicEdges: TopicEdge[] = [
  { from: "hetzner", to: "linux", why: "the box runs Ubuntu" },
  { from: "hetzner", to: "docker", why: "every service on it is a container" },
  { from: "hetzner", to: "tailscale", why: "administration happens over the tailnet, not the internet" },
  { from: "docker", to: "caddy", why: "Caddy runs as a container like everything else" },
  { from: "docker", to: "grafana", why: "monitoring is part of the same compose stack" },
  { from: "docker", to: "postgres", why: "Postgres runs in compose, reachable only by its own service" },
  { from: "docker", to: "sops", why: "compose reads env that SOPS decrypts at deploy" },
  { from: "caddy", to: "typescript", why: "it serves this statically exported site" },
  { from: "dotnet", to: "aspnet", why: "ASP.NET Core is the framework the services are built on" },
  { from: "dotnet", to: "postgres", why: "EF Core is how the domain reaches the database" },
  { from: "angular", to: "typescript", why: "Angular is TypeScript in practice" },
  { from: "aspnet", to: "angular", why: "the REST API on one side of the integration, the client on the other" },
  { from: "grafana", to: "postgres", why: "dashboards read from it" },
];

/** Adjacency, for highlighting and for the graph's text equivalent. */
export function neighboursOf(slug: string): TopicSlug[] {
  return topicEdges
    .filter((e) => e.from === slug || e.to === slug)
    .map((e) => (e.from === slug ? e.to : e.from));
}

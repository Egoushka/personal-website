/**
 * The stack as a graph.
 *
 * ── The rule for this file ──────────────────────────────────────────────────
 * An edge must assert something TRUE and checkable about how these things are
 * actually used together — "Caddy runs as a container", "EF Core talks to
 * Postgres". An edge that means "both of these are backend words" is noise, and
 * a graph of noise is the reason most skill graphs on personal sites are
 * worthless. If you cannot write the `why`, do not add the edge.
 *
 * Positions are authored, not simulated. A force layout would need a physics
 * dependency, would settle differently on every load, and would put labels
 * wherever it liked. Fixed coordinates render identically on the server, cost
 * nothing, and let related things actually sit near each other.
 *
 * Coordinate space is the SVG viewBox below, not pixels.
 */

/**
 * Wide enough for the longest label to finish inside the box. Labels sit to the
 * right of their node, so the rightmost extent is the node's x plus roughly
 * 9.6 units per character — "JetBrains Rider" and "VS Code" set this bound, not
 * the node coordinates.
 */
export const GRAPH_VIEWBOX = { w: 900, h: 470 } as const;

export type SkillGroup = "infra" | "backend" | "frontend" | "tools";

export type SkillNode = {
  id: string;
  label: string;
  group: SkillGroup;
  x: number;
  y: number;
  /** Shown when the node is selected. One sentence, first person, concrete. */
  note: string;
};

export const skillGroups: Record<SkillGroup, string> = {
  infra: "Runs the box",
  backend: "Backend",
  frontend: "Front end",
  tools: "Tools",
};

export const skillNodes: SkillNode[] = [
  // ── the box ──────────────────────────────────────────────────────────────
  { id: "hetzner", label: "Hetzner VPS", group: "infra", x: 110, y: 390,
    note: "One shared-vCPU box in Helsinki. Everything below runs on it." },
  { id: "linux", label: "Linux", group: "infra", x: 96, y: 286,
    note: "Ubuntu, unattended upgrades, and nothing installed by hand." },
  { id: "docker", label: "Docker Compose", group: "infra", x: 258, y: 336,
    note: "One file per service. If it is not in a compose file, it is not running." },
  { id: "caddy", label: "Caddy", group: "infra", x: 250, y: 224,
    note: "Serves this page. The Caddyfile is the only networking config I keep by hand." },
  { id: "tailscale", label: "Tailscale · Headscale", group: "infra", x: 108, y: 158,
    note: "The only way in. SSH is not exposed to the internet." },
  { id: "sops", label: "SOPS + age", group: "infra", x: 388, y: 412,
    note: "Secrets encrypted in git. The repo is the source of truth, not the box." },
  { id: "grafana", label: "Grafana", group: "infra", x: 396, y: 300,
    note: "Enough dashboards to answer “is it up”, not enough to become a hobby." },

  // ── backend ──────────────────────────────────────────────────────────────
  { id: "dotnet", label: "C# / .NET", group: "backend", x: 552, y: 232,
    note: "Day job and default. Five years of it." },
  { id: "aspnet", label: "ASP.NET Core", group: "backend", x: 548, y: 128,
    note: "Where the backend services actually live." },
  { id: "postgres", label: "PostgreSQL", group: "backend", x: 560, y: 344,
    note: "Postgres at home, SQL Server at work." },

  // ── front end ────────────────────────────────────────────────────────────
  { id: "typescript", label: "TypeScript", group: "frontend", x: 726, y: 128,
    note: "This site, and anything that reaches a browser." },
  { id: "angular", label: "Angular", group: "frontend", x: 730, y: 232,
    note: "When the work reaches the front end. NgRx when state gets real." },

  // ── tools ────────────────────────────────────────────────────────────────
  { id: "rider", label: "JetBrains Rider", group: "tools", x: 700, y: 396,
    note: "For anything with a .sln. The debugger is the whole reason." },
  { id: "vscode", label: "VS Code", group: "tools", x: 800, y: 316,
    note: "Everything else — TypeScript, markdown, config." },
];

export type SkillEdge = { from: string; to: string; why: string };

export const skillEdges: SkillEdge[] = [
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
  { from: "dotnet", to: "rider", why: "Rider is where .NET work happens" },
  { from: "angular", to: "typescript", why: "Angular is TypeScript in practice" },
  { from: "typescript", to: "vscode", why: "VS Code for everything that is not a .sln" },
  { from: "aspnet", to: "angular", why: "the REST API one side of the integration, the client the other" },
  { from: "grafana", to: "postgres", why: "dashboards read from it" },
];

/** Adjacency, for highlighting and for the text equivalent. */
export function neighboursOf(id: string): string[] {
  return skillEdges
    .filter((e) => e.from === id || e.to === id)
    .map((e) => (e.from === id ? e.to : e.from));
}

/**
 * What the Shop, Partner and home pages say that no build can measure: the
 * products, the self-check and the figures read from GitHub by hand. Each block
 * carries the date it was read; nothing here is live. The box's own figures
 * come from /status.json (lib/status.ts) and these are only the dated fallback
 * shown before it answers, or when it is missing.
 *
 * Safe to import from a client component: no build-time reads, no `cn`.
 */

/** When the figures below were read. */
export const READ_AT = "2026-11-11T01:58:08Z";
export const READ_DATE = "2026-11-11";

export type ProductState = "coming" | "building" | "rebuilding";

export type Product = {
  id: string;
  name: string;
  host: string;
  state: ProductState;
  usage: string;
  free: string;
  paid: string;
  body: string;
  last: { label: string; href: string; at: string } | null;
  key: { label: string; href: string };
};

export const commitUrl = (repo: string, sha: string) => `https://github.com/Egoushka/${repo}/commit/${sha}`;

export const PRODUCTS: Product[] = [
  {
    id: "checker",
    name: "Agent-ready checker",
    host: "check.hrabovskyi.online",
    state: "coming",
    usage: "0 checks run · not deployed",
    free: "Web check, GitHub Action",
    paid: "API, pay per call over x402 · price not set",
    body: "Paste an address and see which agent doors the site has open, which are missing, and what each one would take. Runs as a web page, as a GitHub Action on every deploy, and as an API an agent can call and pay for per check.",
    last: null,
    key: { label: "Where it will live", href: "https://check.hrabovskyi.online" },
  },
  {
    id: "webmcp",
    name: "WebMCP for ASP.NET and Blazor",
    host: "NuGet library",
    state: "coming",
    usage: "0 installs · not published",
    free: "The whole library",
    paid: "nothing paid planned",
    body: "Mark a page action or a minimal-API endpoint and it shows up as a WebMCP tool the visitor's agent can call, with the schema generated from your C# types.",
    last: null,
    key: { label: "Where it will live", href: "/shop/#webmcp" },
  },
  {
    id: "chargehand",
    name: "chargehand hosted",
    host: "chargehand.hrabovskyi.online",
    state: "coming",
    usage: "1 user (me) · v0.19.19 self-hosted",
    free: "Self-hosted, source available",
    paid: "Hosted runs · price not set",
    body: "The orchestrator runs today from the CLI, over HTTP and over MCP. Hosted means the runners, sandboxes and model routing run on my box instead of yours.",
    last: {
      label: "chargehand/commit/a167640 chore: relicense versions after v0.19.19 to FSL-1.1-ALv2",
      href: commitUrl("chargehand", "a167640"),
      at: "2026-11-11T02:02:03Z",
    },
    key: { label: "Where it will live", href: "https://chargehand.hrabovskyi.online" },
  },
  {
    id: "x402",
    name: "x402 .NET kit",
    host: "github.com/Egoushka/x402-mcp-dotnet",
    state: "building",
    usage: "0 paying agents · not released",
    free: "Library, Sample server",
    paid: "nothing paid planned",
    body: "Middleware for paid MCP tool calls over HTTP 402. Settlement happens only after the tool succeeds. Conformance runs in CI against x402-conformance-svm 1.6.0.",
    last: {
      label: "x402-mcp-dotnet/commit/6a0731a ci: run x402-conformance-svm 1.6.0 against the sample server",
      href: commitUrl("x402-mcp-dotnet", "6a0731a"),
      at: "2026-11-02T11:09:24Z",
    },
    key: { label: "Open", href: "/projects/x402-mcp-dotnet/" },
  },
  {
    id: "touchstone",
    name: "touchstone",
    host: "touchstone.hrabovskyi.online",
    state: "coming",
    usage: "0 users · no public repo yet",
    free: "Core checks, locally",
    paid: "Large schemas, CI reports · price not set",
    body: "A migration that compiles can still answer differently: trailing spaces, collation, rounding, NULL ordering. touchstone replays your queries on both and lists every row that changed.",
    last: null,
    key: { label: "Where it will live", href: "https://touchstone.hrabovskyi.online" },
  },
  {
    id: "attest",
    name: "Attest",
    host: "nuget.org/packages/Attest",
    state: "rebuilding",
    usage: "660 NuGet downloads · v1.2.1",
    free: "The whole library",
    paid: "free, by design",
    body: "A fork of CountryValidator with 197 of its defects fixed. 1.2.1 is on NuGet and works; the next version is being rebuilt from the rules up.",
    last: {
      label: "attest/commit/6bbffbe ci: fix zizmor findings, add zizmor config",
      href: commitUrl("attest", "6bbffbe"),
      at: "2026-10-29T14:16:06Z",
    },
    key: { label: "Open", href: "https://www.nuget.org/packages/Attest" },
  },
  {
    id: "oura",
    name: "oura-platform",
    host: "github.com/Egoushka/oura-platform",
    state: "building",
    usage: "3 of 8 stages done · 1 user (me)",
    free: "Self-hosted, open source",
    paid: "nothing paid planned",
    body: "Self-hosted: OAuth ingestion into Postgres with TimescaleDB, three Grafana dashboards the Oura app cannot draw, and an MCP server over the warehouse.",
    last: {
      label: "oura-platform/commit/1c08844 docs(publish): describe the tag@digest pin the homelab uses",
      href: commitUrl("oura-platform", "1c08844"),
      at: "2026-11-06T14:10:48Z",
    },
    key: { label: "Open", href: "/projects/oura-platform/" },
  },
];

export const STATE_COUNTS = {
  rebuilding: PRODUCTS.filter((p) => p.state === "rebuilding").length,
  building: PRODUCTS.filter((p) => p.state === "building").length,
  coming: PRODUCTS.filter((p) => p.state === "coming").length,
};
export const STATE_NOTE = `${STATE_COUNTS.rebuilding} rebuilding, ${STATE_COUNTS.building} building, ${STATE_COUNTS.coming} coming`;

/** The box's figures as last read, shown until /status.json answers or when it cannot. */
export const BOX_FALLBACK = { generated: READ_AT, containers: 133, unhealthy: 0, uptimeDays: 0 };

/** Coding time as last read; the file does not state a period, so none is claimed. */
export const CODING_FALLBACK = {
  hours: 160,
  editor: "Claude",
  editorPercent: 87,
  languages: [
    { name: "Markdown", hours: 67.4, percent: 42 },
    { name: "Unknown", hours: 22.1, percent: 14 },
    { name: "C#", hours: 21.1, percent: 13 },
    { name: "Python", hours: 10.3, percent: 6 },
    { name: "Text", hours: 8.9, percent: 6 },
  ],
};

export const ATTEST_FALLBACK = { version: "1.2.1", downloads: 660 };

/** GitHub, read by hand on READ_DATE. */
export const CHARGEHAND = { prs: 857, version: "0.19.19" };

export type FeedItem = { repo: string; sha: string; message: string; at: string };

/** Public commits, newest first, read on READ_DATE. */
export const FEED: FeedItem[] = [
  { repo: "chargehand", sha: "a167640", message: "chore: relicense versions after v0.19.19 to FSL-1.1-ALv2", at: "2026-11-11T02:02:03Z" },
  { repo: "chargehand", sha: "036b34f", message: "feat(runners): preflight the session images against each runner's allowlist", at: "2026-11-11T01:50:31Z" },
  { repo: "chargehand", sha: "4fafc13", message: "feat(handover): refuse junk branches and rename WIP commits before the push", at: "2026-11-11T01:50:14Z" },
  { repo: "chargehand", sha: "7042271", message: "fix(runners): let a routed session's container get CLAUDE_CODE_SUBAGENT_MODEL", at: "2026-11-11T01:17:00Z" },
  { repo: "chargehand", sha: "4f610eb", message: "chore(main): release 0.19.19", at: "2026-11-10T21:48:00Z" },
  { repo: "chargehand", sha: "3054a0d", message: "feat(console): subscription windows on the cockpit", at: "2026-11-10T21:16:00Z" },
  { repo: "oura-platform", sha: "1c08844", message: "docs(publish): describe the tag@digest pin the homelab uses", at: "2026-11-06T14:10:48Z" },
];


/** Fixed-locale date, so server and client print the same string. */
export function shortDate(iso: string): string {
  const d = new Date(iso);
  const m = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][d.getUTCMonth()];
  return `${d.getUTCDate()} ${m}`;
}

export type CheckRow = { name: string; target: string; code: string; ok: boolean; na?: boolean; note: string };

/** This site, fetched by hand against the built site on READ_DATE. */
export const SELF_CHECK: CheckRow[] = [
  { name: "llms.txt", target: "/llms.txt", code: "404", ok: false, note: "No llms.txt. An agent gets the HTML and has to guess." },
  { name: "MCP discovery", target: "/.well-known/mcp.json", code: "404", ok: false, note: "No MCP server is advertised." },
  { name: "WebMCP tools", target: "document.modelContext", code: "5 tools", ok: true, note: "search_site, list_posts, get_post, get_status and contact, registered for a browser agent." },
  { name: "x402", target: "HTTP 402 on a paid route", code: "none", ok: false, na: true, note: "Nothing is for sale here, so nothing answers 402. Not applicable to this site." },
  { name: "robots.txt", target: "/robots.txt", code: "200", ok: true, note: "Present." },
  { name: "sitemap", target: "/sitemap.xml", code: "200", ok: true, note: "Present." },
  { name: "feed", target: "/feed.xml", code: "200", ok: true, note: "Present." },
];

export const CHANNELS = [
  { id: "cobuild", icon: "users", name: "Co-build", text: "A co-builder for the checker's GitHub Action or the WebMCP library. Shared repo, shared credit, a written split." },
  { id: "integrate", icon: "plug", name: "Integrate", text: "A team with an API that agents should be able to call and pay for. I wire x402 and MCP into it." },
  { id: "distribute", icon: "megaphone", name: "Distribute", text: "Someone who already reaches .NET shops or agent builders. Revenue share per product, agreed first." },
  { id: "use", icon: "message", name: "Use it honestly", text: "Early users of the free tiers who tell me what is wrong. No payment, no contract." },
] as const;

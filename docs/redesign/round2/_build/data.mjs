// Every figure on every round-2 page comes from here. Each one was read on
// 2026-11-11 from the live site, /status.json, the GitHub API or the repo's
// lib/site.ts. Nothing is invented; a value nobody has counted says so.
export const READ_AT = "2026-11-11T01:58:08Z";
const SITE = "https://hrabovskyi.online";
const GH = "https://github.com/Egoushka";
export const links = { site: SITE, status: SITE + "/status.json", gh: GH, email: "egorgrabovskij@gmail.com", feed: SITE + "/feed.xml", writing: SITE + "/writing/" };

export const status = {
  generated: READ_AT, uptimeDays: 0, containers: 133, unhealthy: 0,
  codingHours: 160, editor: "Claude", editorPercent: 87,
  languages: [["Markdown", 67.4, 42], ["Unknown", 22.1, 14], ["C#", 21.1, 13], ["Python", 10.3, 6], ["Text", 8.9, 6], ["Kotlin", 6.7, 4], ["YAML", 4.6, 3], ["Bash", 4.3, 3], ["Typescript", 4.0, 3], ["Json", 2.9, 2], ["TSX", 2.2, 1]],
  attest: { version: "1.2.1", downloads: 660 },
};

// Figures with receipts. id -> { v: shown value, l: label, src: where it is read, how: how it is counted, href }
export const figs = {
  containers: { v: "133", l: "containers running", src: "status.json → containers", how: "Counted on the box by docker, written to status.json by a timer. Container names are not published.", href: links.status },
  unhealthy: { v: "0", l: "unhealthy", src: "status.json → unhealthy", how: "Containers whose Docker healthcheck reports unhealthy at the time of writing.", href: links.status },
  uptime: { v: "0 d", l: "uptime", src: "status.json → uptimeDays", how: "Days since the box last booted. It restarted today, so this reads 0.", href: links.status },
  hours: { v: "160 h", l: "coding time", src: "status.json → coding.hours", how: "Hours my editor tracker counted. The period it covers is not stated in the file, so none is claimed here.", href: links.status },
  editor: { v: "87%", l: "of it in Claude", src: "status.json → coding.editorPercent", how: "Share of tracked time by editor.", href: links.status },
  attestDl: { v: "660", l: "Attest downloads", src: "status.json → package.downloads", how: "NuGet's total download count for the Attest package, read by the box.", href: "https://www.nuget.org/packages/Attest" },
  attestVer: { v: "1.2.1", l: "Attest on NuGet", src: "status.json → package.version", how: "The latest published version.", href: "https://www.nuget.org/packages/Attest" },
  countries: { v: "87", l: "countries", src: "lib/site.ts → attest.readings", how: "One validator per country in the repo, each with its own test file.", href: GH + "/attest" },
  defects: { v: "197", l: "defects fixed", src: "lib/site.ts → attest.readings", how: "Counted against the upstream CountryValidator project.", href: GH + "/attest" },
  chVer: { v: "0.19.19", l: "chargehand release", src: "GitHub tags, read 2026-11-11", how: "Latest tag on Egoushka/chargehand.", href: GH + "/chargehand/tags" },
  chPrs: { v: "857", l: "pull requests", src: "GitHub API, read 2026-11-11", how: "Highest pull request number on Egoushka/chargehand, open and closed.", href: GH + "/chargehand/pulls?q=is%3Apr" },
  chUsers: { v: "1", l: "chargehand user: me", src: "lib/site.ts → chargehand.readings", how: "Counted by hand. Nobody else runs it yet.", href: SITE + "/projects/chargehand/" },
  chBlind: { v: "0.333 → 0.667", l: "first blind test, lost", src: "post, 29 Sep 2026", how: "Model-judged blind comparison against a plain agent session; my orchestrator scored 0.333.", href: SITE + "/writing/chargehand-blind-test/" },
  posts: { v: "12", l: "posts", src: "the live site, built 6 Nov 2026", how: "Published posts; drafts are not counted.", href: links.writing },
  words: { v: "12,006", l: "words", src: "counted at build", how: "The build counts the words of every published post.", href: links.writing },
  ouraStage: { v: "3 of 8", l: "Oura stages done", src: "oura-platform README", how: "Stages 1, 2 and 4 run. 3 is skipped on purpose; 5 to 8 are not built.", href: GH + "/oura-platform" },
  paying: { v: "0", l: "paying users", src: "counted by hand", how: "No product takes money yet. This stays 0 until one does.", href: SITE },
  checks: { v: "0", l: "checks run", src: "not deployed", how: "check.hrabovskyi.online has no DNS record yet, so nobody has run a check.", href: "#checker" },
};

// state: available | rebuilding | building | coming
export const products = [
  { id: "checker", name: "Agent-ready checker", host: "check.hrabovskyi.online", state: "coming",
    line: "Scans a URL for what an AI agent looks for: WebMCP, MCP, x402 and llms.txt.",
    long: "Paste an address and see which agent doors the site has open, which are missing, and what each one would take. Runs as a web page, as a GitHub Action on every deploy, and as an API an agent can call and pay for per check.",
    free: ["Web check", "GitHub Action"], paid: ["API, pay per call over x402"], price: "price not set",
    usage: { fig: "checks", text: "0 checks run · not deployed" }, repo: null },
  { id: "webmcp", name: "WebMCP for ASP.NET and Blazor", host: "NuGet library", state: "coming",
    line: "Lets a .NET web app expose its actions to an agent in the browser, from attributes on code you already have.",
    long: "Mark a page action or a minimal-API endpoint and it shows up as a WebMCP tool the visitor's agent can call, with the schema generated from your C# types.",
    free: ["The whole library"], paid: [], price: "nothing paid planned",
    usage: { text: "0 installs · not published" }, repo: null },
  { id: "chargehand", name: "chargehand hosted", host: "chargehand.hrabovskyi.online", state: "coming",
    line: "Ask a question about your code; every claim in the answer cites a file at a pinned commit, checked before you see it.",
    long: "The orchestrator runs today from the CLI, over HTTP and over MCP. Hosted means the runners, sandboxes and model routing run on my box instead of yours.",
    free: ["Self-hosted, source available"], paid: ["Hosted runs"], price: "price not set",
    usage: { fig: "chUsers", text: "1 user (me) · v0.19.19 self-hosted" }, repo: "chargehand" },
  { id: "x402", name: "x402 .NET kit", host: "github.com/Egoushka/x402-mcp-dotnet", state: "building",
    line: "Lets a .NET MCP tool charge an AI agent per call in USDC, and never for a call that failed.",
    long: "Middleware for paid MCP tool calls over HTTP 402. Settlement happens only after the tool succeeds. Conformance runs in CI against x402-conformance-svm 1.6.0.",
    free: ["Library", "Sample server"], paid: [], price: "nothing paid planned",
    usage: { text: "0 paying agents · not released" }, repo: "x402-mcp-dotnet" },
  { id: "touchstone", name: "touchstone", host: "touchstone.hrabovskyi.online", state: "coming",
    line: "Runs the same queries on SQL Server and on PostgreSQL and shows where the answers differ.",
    long: "A migration that compiles can still answer differently: trailing spaces, collation, rounding, NULL ordering. touchstone replays your queries on both and lists every row that changed.",
    free: ["Core checks, locally"], paid: ["Large schemas", "CI reports"], price: "price not set",
    usage: { text: "0 users · no public repo yet" }, repo: null },
  { id: "attest", name: "Attest", host: "nuget.org/packages/Attest", state: "rebuilding",
    line: "Validates national ID, tax ID, VAT and postal codes for 87 countries against each country's published rule.",
    long: "A fork of CountryValidator with 197 of its defects fixed. 1.2.1 is on NuGet and works; the next version is being rebuilt from the rules up.",
    free: ["The whole library"], paid: [], price: "free, by design",
    usage: { fig: "attestDl", text: "660 NuGet downloads · v1.2.1" }, repo: "attest" },
  { id: "oura", name: "oura-platform", host: "github.com/Egoushka/oura-platform", state: "building",
    line: "Pulls your Oura Ring data into a Postgres you own, so sleep can be joined against your calendar.",
    long: "Self-hosted: OAuth ingestion into Postgres with TimescaleDB, three Grafana dashboards the Oura app cannot draw, and an MCP server over the warehouse.",
    free: ["Self-hosted, open source"], paid: [], price: "nothing paid planned",
    usage: { fig: "ouraStage", text: "3 of 8 stages done · 1 user (me)" }, repo: "oura-platform" },
];
export const stateLabel = { available: "available", rebuilding: "rebuilding", building: "building", coming: "coming" };

export const commits = [
  ["2026-11-11T02:02:03Z", "chargehand", "a167640", "chore: relicense versions after v0.19.19 to FSL-1.1-ALv2"],
  ["2026-11-11T01:50:31Z", "chargehand", "036b34f", "feat(runners): preflight the session images against each runner's allowlist"],
  ["2026-11-11T01:50:14Z", "chargehand", "4fafc13", "feat(handover): refuse junk branches and rename WIP commits before the push"],
  ["2026-11-11T01:17:00Z", "chargehand", "7042271", "fix(runners): let a routed session's container get CLAUDE_CODE_SUBAGENT_MODEL"],
  ["2026-11-10T21:48:00Z", "chargehand", "4f610eb", "chore(main): release 0.19.19"],
  ["2026-11-10T21:16:00Z", "chargehand", "3054a0d", "feat(console): subscription windows on the cockpit"],
  ["2026-11-06T14:10:48Z", "oura-platform", "1c08844", "docs(publish): describe the tag@digest pin the homelab uses"],
  ["2026-11-02T11:09:24Z", "x402-mcp-dotnet", "6a0731a", "ci: run x402-conformance-svm 1.6.0 against the sample server"],
  ["2026-10-29T14:16:06Z", "attest", "6bbffbe", "ci: fix zizmor findings, add zizmor config"],
].map(([at, repo, sha, msg]) => ({ at, repo, sha, msg, href: `${GH}/${repo}/commit/${sha}` }));

export const posts = [
  ["2026-10-17", "rewrite-nobody-can-accept", "My prompt enhancer's acceptance rate is zero, by design", "chargehand asks whetstone for a better prompt on every run and sends the original anyway.", "2 min"],
  ["2026-10-10", "paid-mcp-tools", "HTTP 402 waited 29 years for a payer. An AI agent fits.", "Paid MCP tool calls in .NET over x402: an agent pays per call in USDC, never for a call that failed.", "5 min"],
  ["2026-09-29", "chargehand-blind-test", "My agent orchestrator lost its first blind test, 0.333 to 0.667", "A plain agent session beat my orchestrator. The fix cost 28% more until an ablation found why.", "7 min"],
  ["2026-09-29", "chronicle-vs-grep", "My search scored 48.2% on its first eval. Then I found the scoreboard was wrong twice.", "A fair grep, scored the same way, made it 71.1% against 54.2%.", "7 min"],
  ["2026-09-29", "dns-is-not-access-control", "My private services were on the public internet. DNS was the only thing hiding them.", "Every internal service answered 200 to the open internet.", "5 min"],
].map(([date, slug, title, sum, read]) => ({ date, slug, title, sum, read, href: `${SITE}/writing/${slug}/` }));

// A real check of the apex site, done by hand on 2026-11-11 (fetch + status codes).
export const selfCheck = [
  ["llms.txt", "/llms.txt", "404", false, "No llms.txt. An agent gets the HTML and has to guess."],
  ["MCP discovery", "/.well-known/mcp.json", "404", false, "No MCP server is advertised."],
  ["WebMCP tools", "document.modelContext", "none", false, "The page registers no tools for a browser agent (navigator.modelContext only as fallback)."],
  ["x402", "HTTP 402 on a paid route", "none", false, "Nothing is for sale here, so nothing answers 402. Correct for this site."],
  ["robots.txt", "/robots.txt", "200", true, "Present, with rules per crawler."],
  ["sitemap", "/sitemap.xml", "200", true, "Present."],
  ["feed", "/feed.xml", "200", true, "Present."],
];

export const partner = {
  bring: [
    ["A .NET backend that holds up", "Attest validates 87 countries with 197 upstream defects fixed; 660 downloads.", "attestDl"],
    ["Agent tooling, measured", "chargehand: 857 pull requests to v0.19.19, and the blind test it lost is published.", "chPrs"],
    ["Paid calls for agents", "x402 in .NET: an agent pays per call and never for a call that failed.", null],
    ["A box that is boring on purpose", "133 containers, 0 unhealthy, every stack defined in git.", "containers"],
  ],
  want: [
    ["Co-build", "A co-builder for the checker's GitHub Action or the WebMCP library. Shared repo, shared credit, a written split."],
    ["Integrate", "A team with an API that agents should be able to call and pay for. I wire x402 and MCP into it."],
    ["Distribute", "Someone who already reaches .NET shops or agent builders. Revenue share per product, agreed first."],
    ["Use it honestly", "Early users of the free tiers who tell me what is wrong. No payment, no contract."],
  ],
  steps: [
    ["Talk", "Email what it is, what you have, what you want from it."],
    ["One page", "Who builds what, who pays which cost, how the split is paid, when it ends. Written before code."],
    ["Build", "In the open where possible. Every claim gets a link."],
    ["Split", "Paid as agreed. No product has earned a cent yet, so no split is listed here."],
  ],
};

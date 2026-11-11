// WebMCP (https://webmachinelearning.github.io/webmcp/): registers read-only tools
// an in-browser agent can call. Loaded by the inline loader in app/layout.tsx only
// when the browser exposes `modelContext`; everything the tools say is read from
// /webmcp.json, /webmcp-posts.json and /status.json, written at build time.
// Nothing here renders, writes storage, or sends anything.

const text = (x) => JSON.stringify(x);
const json = async (url) => {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`${url} answered ${r.status}`);
  return r.json();
};

/** Markdown to plain text, enough for an agent: no fence lines, link targets or markers. */
export function plain(md) {
  return md
    .replace(/^```.*$/gm, "")
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/(\*\*|__|`)/g, "")
    .trim();
}

/** Tool descriptors. `env` is injected so tests need no browser. */
export function tools(m, env) {
  const enumOf = (xs) => ({ type: "string", enum: xs });
  const ro = { readOnlyHint: true };
  return [
    {
      name: "search_site",
      description: `Full-text search over ${m.site.name}'s site (posts, projects, docs, methods). Returns title, URL and excerpt.`,
      inputSchema: {
        type: "object",
        properties: { query: { type: "string" }, limit: { type: "integer", minimum: 1, maximum: 10 } },
        required: ["query"],
      },
      annotations: ro,
      async execute({ query, limit = 5 }) {
        const found = await env.search(String(query));
        if (!found) return text({ error: "The search index is not available here." });
        return text(found.slice(0, Math.min(Math.max(+limit || 5, 1), 10)));
      },
    },
    {
      name: "list_posts",
      description: "List published posts, newest first, optionally filtered by kind and/or topic slug.",
      inputSchema: {
        type: "object",
        properties: { kind: enumOf(m.kinds), topic: enumOf(m.topics.map((t) => t.slug)) },
      },
      annotations: ro,
      async execute({ kind, topic } = {}) {
        return text(m.posts.filter((p) => (!kind || p.kind === kind) && (!topic || p.topics.includes(topic))));
      },
    },
    {
      name: "get_post",
      description: "Get one post's full text by slug (see list_posts), as Markdown or plain text.",
      inputSchema: {
        type: "object",
        properties: { slug: enumOf(m.posts.map((p) => p.slug)), format: enumOf(["markdown", "text"]) },
        required: ["slug"],
      },
      annotations: ro,
      async execute({ slug, format = "markdown" }) {
        const meta = m.posts.find((p) => p.slug === slug);
        if (!meta) return text({ error: `No post "${slug}". Use list_posts.` });
        const md = (await env.json("/webmcp-posts.json"))[slug];
        return text({ ...meta, format, body: format === "text" ? plain(md) : md });
      },
    },
    {
      name: "get_status",
      description: "Live state of the site's server and the owner's coding activity, from /status.json (aggregates only).",
      inputSchema: { type: "object", properties: {} },
      annotations: ro,
      async execute() {
        const s = await env.json("/status.json").catch(() => null);
        const age = s ? (env.now() - Date.parse(s.generated)) / 36e5 : NaN;
        if (!(age <= m.statusMaxAgeHours)) return text({ available: false });
        return text({ available: true, ...s });
      },
    },
    {
      name: "contact",
      description:
        "How to reach the site's owner. The site has no contact form: this returns the email address and a mailto link prefilled with the given text. It sends nothing; the user must open the link and send the message themselves.",
      inputSchema: {
        type: "object",
        properties: { subject: { type: "string", maxLength: 200 }, message: { type: "string", maxLength: 2000 } },
      },
      annotations: ro,
      async execute({ subject = "", message = "" } = {}) {
        const q = new URLSearchParams({ subject, body: message }).toString().replace(/\+/g, "%20");
        return text({
          email: m.contact.email,
          page: m.contact.page,
          mailto: `mailto:${m.contact.email}${q ? `?${q}` : ""}`,
          sent: false,
          note: "Nothing was sent. Ask the user to confirm the text, then open the mailto link.",
        });
      },
    },
  ];
}

/** Registers every tool on `ctx` (document.modelContext). One failed registration does not stop the rest. */
export async function register(ctx, env) {
  const m = await env.json("/webmcp.json");
  for (const t of tools(m, env)) {
    try {
      await ctx.registerTool(t);
    } catch {
      /* already registered, or refused */
    }
  }
}

// Pagefind by native import() with the URL in a variable: the CSP has no 'unsafe-eval'.
let pagefind;
const PAGEFIND = "/pagefind/pagefind.js";
async function search(q) {
  try {
    pagefind ??= await import(/* webpackIgnore: true */ PAGEFIND);
    await pagefind.init?.();
    const { results } = await pagefind.search(q);
    const top = await Promise.all(results.slice(0, 10).map((r) => r.data()));
    return top.map((d) => ({
      title: d.meta?.title ?? d.url,
      url: new URL(d.url, location.origin).href,
      excerpt: d.excerpt.replace(/<\/?mark>/g, ""),
    }));
  } catch {
    return null;
  }
}

// `modelContext` is on Document in the spec; navigator is the older entry point.
const ctx = typeof document === "undefined" ? undefined : document.modelContext ?? navigator.modelContext;
if (ctx?.registerTool) register(ctx, { json, search, now: Date.now });

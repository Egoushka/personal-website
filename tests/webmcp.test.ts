import { test } from "node:test";
import assert from "node:assert/strict";
import { buildManifest, buildPosts, STATUS_MAX_AGE_HOURS } from "../lib/webmcp";
import { MAX_AGE_HOURS } from "../lib/status";
import { getAllSlugs } from "../lib/posts";
import { ALL_TOPICS } from "../lib/topics";
import * as web from "../public/webmcp.js";
const { tools, register, plain } = web as any;

const m = buildManifest();
const NOW = Date.parse("2026-09-27T12:00:00Z");
const calls: string[] = [];
const env = {
  json: async (u: string) => {
    calls.push(u);
    if (u === "/webmcp-posts.json") return buildPosts();
    if (u === "/status.json") return { generated: new Date(NOW - 36e5).toISOString(), containers: 3 };
    return m;
  },
  search: async (q: string) => (q === "none" ? null : [{ title: "a", url: "u", excerpt: "e" }, { title: "b", url: "v", excerpt: "f" }]),
  now: () => NOW,
};
const tool = (name: string) => tools(m, env).find((t: { name: string }) => t.name === name);
const run = async (name: string, args?: object) => JSON.parse(await tool(name).execute(args));

test("the manifest is built from the posts and topics, and the status age matches the pages", () => {
  assert.deepEqual(m.posts.map((p) => p.slug).sort(), getAllSlugs().sort());
  assert.deepEqual(m.topics.map((t) => t.slug), ALL_TOPICS);
  assert.equal(STATUS_MAX_AGE_HOURS, MAX_AGE_HOURS);
  assert.ok(m.posts.every((p) => p.url.startsWith("http") && p.url.endsWith("/")));
});

test("five tools, all read-only, names legal for the spec", () => {
  const ts = tools(m, env);
  assert.deepEqual(ts.map((t: { name: string }) => t.name), ["search_site", "list_posts", "get_post", "get_status", "contact"]);
  for (const t of ts) {
    assert.match(t.name, /^[A-Za-z0-9_.-]{1,128}$/);
    assert.ok(t.description && t.annotations.readOnlyHint === true);
  }
});

test("list_posts filters by kind and topic", async () => {
  assert.equal((await run("list_posts")).length, m.posts.length);
  const kind = m.posts.find((p) => p.kind)!.kind;
  assert.ok((await run("list_posts", { kind })).every((p: { kind: string }) => p.kind === kind));
  assert.deepEqual(await run("list_posts", { topic: "no-such" }), []);
});

test("get_post returns markdown or plain text, and an error for an unknown slug", async () => {
  const slug = m.posts[0].slug;
  const md = await run("get_post", { slug });
  assert.equal(md.body, buildPosts()[slug]);
  const txt = await run("get_post", { slug, format: "text" });
  assert.ok(!/^#{1,6}\s/m.test(txt.body) && !txt.body.includes("```"));
  assert.match((await run("get_post", { slug: "nope" })).error, /No post/);
});

test("plain strips links, headings and fences", () => {
  assert.equal(plain("## Hi\n[a **b**](/x) `c`\n```js\nx\n```"), "Hi\na b c\n\nx");
});

test("get_status is unavailable when stale or missing", async () => {
  assert.equal((await run("get_status")).containers, 3);
  const stale = { ...env, json: async () => ({ generated: new Date(NOW - 49 * 36e5).toISOString() }) };
  assert.equal(JSON.parse(await tools(m, stale).find((t: { name: string }) => t.name === "get_status").execute()).available, false);
  const gone = { ...env, json: async () => { throw new Error("404"); } };
  assert.equal(JSON.parse(await tools(m, gone).find((t: { name: string }) => t.name === "get_status").execute()).available, false);
});

test("search_site caps results and reports a missing index", async () => {
  assert.equal((await run("search_site", { query: "x", limit: 1 })).length, 1);
  assert.match((await run("search_site", { query: "none" })).error, /not available/);
});

test("contact sends nothing: it returns the address and a prefilled mailto", async () => {
  const c = await run("contact", { subject: "Hi there", message: "a&b" });
  assert.equal(c.sent, false);
  assert.equal(c.mailto, `mailto:${m.contact.email}?subject=Hi%20there&body=a%26b`);
});

test("register registers every tool and survives a refused one", async () => {
  const got: string[] = [];
  await register({ registerTool: async (t: { name: string }) => { if (t.name === "list_posts") throw new Error("dup"); got.push(t.name); } }, env);
  assert.equal(got.length, 4);
});

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { xml2js } from "xml-js"; // feed's own dependency: a real, strict (sax) XML parser
import { buildFeed } from "../lib/feed";
import { getAllPosts, getNotes } from "../lib/posts";
import { getTopicUsage } from "../lib/readings";
import { site } from "../lib/site";
import { topicName } from "../lib/topics";
import sitemap from "../app/sitemap";

/** Every href/src in an HTML body that a feed reader could not resolve on its own. */
function relativeLinks(html: string): string[] {
  return [...html.matchAll(/(?:href|src)="([^"]*)"/g)]
    .map((m) => m[1])
    .filter((u) => !/^(https?:|mailto:)/.test(u));
}

const posts = getAllPosts();
const feed = buildFeed();

test("RSS parses, carries every post in full, with absolute links", () => {
  const items = [xml2js(feed.rss2(), { compact: true }) as any].flatMap((d) => d.rss.channel.item);
  assert.equal(items.length, posts.length);
  for (const item of items) {
    assert.ok(item.link._text.startsWith(`${site.url}/writing/`), item.link._text);
    assert.match(item.author._text, /^\S+@\S+ \(.+\)$/);
    const body: string = item["content:encoded"]._cdata;
    assert.ok(body.includes("<h2"), item.link._text);
    assert.deepEqual(relativeLinks(body), [], item.link._text);
  }
});

test("Atom parses; published is the post date, updated is updated ?? date", () => {
  const entries = (xml2js(feed.atom1(), { compact: true }) as any).feed.entry;
  assert.equal(entries.length, posts.length);
  entries.forEach((entry: any, i: number) => {
    const post = posts[i];
    assert.equal(entry.link._attributes.href, `${site.url}/writing/${post.slug}/?utm_source=feed&utm_medium=rss`);
    assert.equal(entry.published._text.slice(0, 10), post.date);
    assert.equal(entry.updated._text.slice(0, 10), post.updated ?? post.date);
  });
});

test("JSON Feed parses, with absolute urls and bodies", () => {
  const json = JSON.parse(feed.json1());
  assert.equal(json.items.length, posts.length);
  for (const item of json.items) {
    assert.ok(item.url.startsWith(`${site.url}/writing/`), item.url);
    assert.deepEqual(relativeLinks(item.content_html), [], item.url);
  }
});

test("the sitemap lists no thin hub and no /links/", () => {
  const urls = sitemap().map((e) => e.url.replace(site.url, ""));
  assert.ok(!urls.includes("/links/"));
  for (const t of getTopicUsage()) {
    assert.equal(urls.includes(`/topics/${t.slug}/`), t.total >= 2, t.slug);
  }
  for (const p of posts) assert.ok(urls.includes(`/writing/${p.slug}/`), p.slug);
  assert.equal(urls.includes("/notes/"), getNotes().length >= 2, "/notes/ is a hub like a topic's");
});

// ── notes (ADR 0009), over fixture trees ────────────────────────────────────

const note = (date: string) =>
  `---\ntitle: "A note"\ndate: "${date}"\ndescription: "One finding."\nkind: note\ntopics: ["dotnet"]\n---\n\nThe number, then its output.\n`;

/**
 * The site's posts plus these, as /notes/, the sitemap and the feeds see them.
 * lib/posts.ts reads content/posts under the working directory once, at import,
 * so a child process moves into a temporary tree before it loads anything. The
 * real posts come along: lib/site.ts reads one of them at import.
 */
function withPosts(extra: Record<string, string>) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "notes-"));
  try {
    const into = path.join(dir, "content", "posts");
    fs.mkdirSync(into, { recursive: true });
    for (const file of fs.readdirSync("content/posts")) fs.copyFileSync(path.join("content/posts", file), path.join(into, file));
    for (const [slug, text] of Object.entries(extra)) fs.writeFileSync(path.join(into, `${slug}.md`), text);
    const load = (file: string) => `require(${JSON.stringify(path.resolve(file))})`;
    const run = spawnSync(
      process.execPath,
      [
        "--import",
        "tsx",
        "--eval",
        `process.chdir(${JSON.stringify(dir)});
        const feed = ${load("lib/feed.ts")}.buildFeed();
        console.log(JSON.stringify({
          notes: ${load("lib/posts.ts")}.getNotes().map((p) => p.slug),
          sitemap: ${load("app/sitemap.ts")}.default(),
          json: JSON.parse(feed.json1()).items,
          rss: feed.rss2(),
        }));`,
      ],
      { encoding: "utf8" },
    );
    assert.equal(run.status, 0, run.stderr);
    return JSON.parse(run.stdout) as {
      notes: string[];
      sitemap: { url: string; lastModified?: string }[];
      json: { url: string; tags?: string[] }[];
      rss: string;
    };
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

const twoNotes = withPosts({ "first-note": note("2026-01-10"), "second-note": note("2026-02-01") });
const listed = (r: ReturnType<typeof withPosts>) => r.sitemap.find((e) => e.url === `${site.url}/notes/`);

test("notes: /notes/ lists the notes alone, newest first, and the sitemap lists it from two", () => {
  const one = withPosts({ "first-note": note("2026-01-10") });
  assert.deepEqual(one.notes, ["first-note"]);
  assert.equal(listed(one), undefined, "one note is its own search result, as one post is a topic's");
  assert.deepEqual(twoNotes.notes, ["second-note", "first-note"]);
  assert.equal(listed(twoNotes)?.lastModified, "2026-02-01", "dated by the newest note");
});

test("notes: every feed carries a note with its kind as a category", () => {
  const tags = Object.fromEntries(twoNotes.json.map((item) => [item.url.replace(site.url, "").split("?")[0], item.tags]));
  assert.deepEqual(tags["/writing/first-note/"], ["Note", topicName("dotnet")]);
  for (const p of posts) assert.ok(!tags[`/writing/${p.slug}/`]?.includes("Note"), `${p.slug} is not a note`);
  const items = [xml2js(twoNotes.rss, { compact: true }) as any].flatMap((d) => d.rss.channel.item);
  const item = items.find((i: any) => i.link._text === `${site.url}/writing/second-note/?utm_source=feed&utm_medium=rss`);
  assert.deepEqual([item.category].flat().map((c: any) => c._text), ["Note", topicName("dotnet")]);
});

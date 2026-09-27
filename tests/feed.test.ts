import { test } from "node:test";
import assert from "node:assert/strict";
import { xml2js } from "xml-js"; // feed's own dependency: a real, strict (sax) XML parser
import { buildFeed } from "../lib/feed";
import { getAllPosts } from "../lib/posts";
import { getTopicUsage } from "../lib/readings";
import { site } from "../lib/site";
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
    assert.equal(entry.link._attributes.href, `${site.url}/writing/${post.slug}/`);
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
});

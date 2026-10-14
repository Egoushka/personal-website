import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { INDEXNOW_KEY, changedPaths, sitemapUrls } from "../lib/indexnow.mjs";

test("indexnow: a post maps to its page and the listings that show it", () => {
  assert.deepEqual(changedPaths(["content/posts/silent-deploys.md"]).sort(), [
    "/", "/projects/", "/writing/", "/writing/silent-deploys/",
  ]);
});

test("indexnow: docs and methods map to their pages, an index doc to the docs root", () => {
  assert.deepEqual(changedPaths(["content/docs/chargehand/quickstart.md"]), ["/projects/chargehand/docs/quickstart/"]);
  assert.deepEqual(changedPaths(["content/docs/chargehand/index.md"]), ["/projects/chargehand/docs/"]);
  assert.deepEqual(changedPaths(["content/methods/evidence.md"]), ["/methods/evidence/"]);
});

test("indexnow: code changes ping the listings; tests, workflows and drafts nothing", () => {
  assert.deepEqual(changedPaths(["lib/site.ts"]).sort(), ["/", "/projects/", "/writing/"]);
  assert.deepEqual(changedPaths(["tests/a.test.ts", ".github/workflows/ci.yml", "README.md"]), []);
});

test("indexnow: lib/site.ts also pings every project page in the sitemap, not its docs", () => {
  const sitemap = ["/", "/projects/", "/projects/attest/", "/projects/chargehand/", "/projects/chargehand/docs/", "/writing/x/"];
  assert.deepEqual(changedPaths(["lib/site.ts"], sitemap).sort(), [
    "/", "/projects/", "/projects/attest/", "/projects/chargehand/", "/writing/",
  ]);
  assert.deepEqual(changedPaths(["lib/feed.ts"], sitemap).sort(), ["/", "/projects/", "/writing/"]);
});

test("indexnow: sitemap locs are read in order", () => {
  const xml = "<urlset><url><loc>https://x/</loc></url><url><loc>https://x/a/</loc></url></urlset>";
  assert.deepEqual(sitemapUrls(xml), ["https://x/", "https://x/a/"]);
});

test("indexnow: the key file serves the key", () => {
  assert.equal(fs.readFileSync(`public/${INDEXNOW_KEY}.txt`, "utf8").trim(), INDEXNOW_KEY);
});

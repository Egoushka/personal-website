import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync, readdirSync } from "node:fs";
import { NEWSLETTER_FORM_ACTION, NEWSLETTER_LIST_UUID } from "../lib/newsletter";

test("the list is a UUID and the form is a same-origin path the CSP allows", () => {
  assert.match(NEWSLETTER_LIST_UUID, /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
  assert.equal(NEWSLETTER_FORM_ACTION, "/subscription/form");
  const caddy = readFileSync(new URL("../deploy/Caddyfile", import.meta.url), "utf8");
  assert.match(caddy, /connect-src 'self'/);
  assert.match(caddy, /form-action 'self'/);
});

test("npm run newsletter prints a subject, the post link and the unsubscribe tag", () => {
  const slug = readdirSync(new URL("../content/posts", import.meta.url))[0].replace(/\.md$/, "");
  const out = execFileSync("node", ["scripts/newsletter.mjs", slug], { encoding: "utf8" });
  assert.match(out, /^Subject: .+/);
  assert.ok(out.includes(`https://hrabovskyi.online/writing/${slug}/`));
  assert.ok(out.includes("{{ UnsubscribeURL }}"));
});

test("npm run newsletter refuses an unknown slug", () => {
  assert.throws(() => execFileSync("node", ["scripts/newsletter.mjs", "no-such-post"], { stdio: "pipe" }));
});

import { test } from "node:test";
import assert from "node:assert/strict";
import { UMAMI_BEFORE_SEND, UMAMI_OFF_COOKIE } from "../lib/umami";

/** Runs the inlined hook as a browser would: `cookie` is document.cookie, `framed` puts the page in an iframe. */
function send(cookie: string, framed = false) {
  const win: Record<string, unknown> = {};
  win.top = framed ? {} : win;
  new Function("window", "document", UMAMI_BEFORE_SEND)(win, { cookie });
  const hook = win.umamiBeforeSend as (type: string, payload: object) => object | null;
  const payload = { url: "/" };
  return { payload, out: hook("event", payload) };
}

test("a visitor with no cookie is counted", () => {
  const { payload, out } = send("");
  assert.equal(out, payload);
});

test("other cookies do not opt a visitor out", () => {
  assert.notEqual(send("theme=dark; a=1").out, null);
  assert.notEqual(send(`not-${UMAMI_OFF_COOKIE}=1`).out, null);
});

test("the cookie /umami-off/ sets drops the payload", () => {
  assert.equal(send(`${UMAMI_OFF_COOKIE}=1`).out, null);
  assert.equal(send(`theme=dark; ${UMAMI_OFF_COOKIE}=1; a=1`).out, null);
});

test("a framed page is still dropped", () => {
  assert.equal(send("", true).out, null);
});

test("the Caddyfile route sets the cookie the hook reads", async () => {
  const { readFileSync } = await import("node:fs");
  const caddy = readFileSync(new URL("../deploy/Caddyfile", import.meta.url), "utf8");
  assert.match(caddy, new RegExp(`handle /umami-off\\*[\\s\\S]*?Set-Cookie "${UMAMI_OFF_COOKIE}=1;`));
});

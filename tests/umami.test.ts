import { test } from "node:test";
import assert from "node:assert/strict";
import { UMAMI_BEFORE_SEND, UMAMI_EVENTS, UMAMI_OFF_COOKIE } from "../lib/umami";

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

/** Runs UMAMI_EVENTS in a fake page and returns what it sent and the listeners and timer it registered. */
function page(opts: { pathname?: string } = {}) {
  const sent: Array<[string, unknown]> = [];
  const listeners: Record<string, (e?: unknown) => void> = {};
  const loc = { origin: "https://hrabovskyi.online", pathname: opts.pathname ?? "/cv/" };
  const doc = {
    visibilityState: "visible",
    documentElement: { scrollHeight: 4000 },
    addEventListener: (n: string, f: () => void) => (listeners[n] = f),
  };
  const win: Record<string, unknown> = {
    umami: { track: (n: string, d?: unknown) => sent.push([n, d]) },
    innerHeight: 1000,
    scrollY: 0,
    addEventListener: (n: string, f: () => void) => (listeners["w" + n] = f),
  };
  let tick: () => void = () => {};
  new Function("window", "document", "location", "addEventListener", "setInterval", "innerHeight", "scrollY", UMAMI_EVENTS)(
    win, doc, loc, win.addEventListener, (f: () => void) => (tick = f), 1000, 0,
  );
  const click = (a: { href: string; protocol: string; origin: string; pathname: string }) =>
    listeners.click({ target: { closest: () => a } });
  return { sent, click, copy: () => listeners.copy(), tick: () => tick(), doc, loc };
}

test("outbound sends the origin and path, never the query", () => {
  const p = page();
  p.click({ href: "https://github.com/Egoushka/x?token=1", protocol: "https:", origin: "https://github.com", pathname: "/Egoushka/x" });
  assert.deepEqual(p.sent, [["outbound", { url: "https://github.com/Egoushka/x" }]]);
});

test("mailto and tel send the scheme only, so no address or number is recorded", () => {
  const p = page();
  p.click({ href: "mailto:me@example.com", protocol: "mailto:", origin: "null", pathname: "me@example.com" });
  p.click({ href: "tel:+10000000", protocol: "tel:", origin: "null", pathname: "+10000000" });
  assert.deepEqual(p.sent, [["outbound", { url: "mailto:" }], ["outbound", { url: "tel:" }]]);
});

test("a same-site pdf is a download; a same-site page is nothing", () => {
  const p = page();
  p.click({ href: "https://hrabovskyi.online/cv.pdf", protocol: "https:", origin: "https://hrabovskyi.online", pathname: "/cv.pdf" });
  p.click({ href: "https://hrabovskyi.online/about/", protocol: "https:", origin: "https://hrabovskyi.online", pathname: "/about/" });
  assert.deepEqual(p.sent, [["download", { file: "/cv.pdf" }]]);
});

test("copy sends a bare event with no text", () => {
  const p = page();
  p.copy();
  assert.deepEqual(p.sent, [["copy", undefined]]);
});

test("time events fire once at 15, 60 and 180 visible seconds, and not while hidden", () => {
  const p = page();
  for (let i = 0; i < 14; i++) p.tick();
  assert.equal(p.sent.length, 0);
  p.tick();
  assert.deepEqual(p.sent.map((s) => s[0]), ["time-15"]);
  p.doc.visibilityState = "hidden";
  for (let i = 0; i < 100; i++) p.tick();
  assert.equal(p.sent.length, 1);
  p.doc.visibilityState = "visible";
  for (let i = 0; i < 45; i++) p.tick();
  assert.deepEqual(p.sent.map((s) => s[0]), ["time-15", "time-60"]);
  for (let i = 0; i < 200; i++) p.tick();
  assert.deepEqual(p.sent.map((s) => s[0]), ["time-15", "time-60", "time-180"]);
});

test("nothing is sent and nothing throws while the tracker is absent", () => {
  const p = page();
  assert.doesNotThrow(() => p.copy());
});

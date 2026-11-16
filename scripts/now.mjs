// Writes public/now.json before `next build`: the remote half of the /now/ feed
// (lib/now.mjs). It never fails the build. GitHub unreachable or rate-limited
// -> the last deployed file from the live site -> an empty feed the page words
// honestly. NOW_OFFLINE=1 skips the network (local builds, tests).
import fs from "node:fs";
import path from "node:path";
import { collectNow, validNow } from "../lib/now.mjs";

const OUT = path.join(process.cwd(), "public", "now.json");
const LIVE = "https://hrabovskyi.online/now.json";

async function fetchJson(url) {
  const headers = { "user-agent": "hrabovskyi.online-build", accept: "application/json" };
  // The Actions token only raises the rate limit; what is kept is decided by
  // the public-repository list, not by what the token could see.
  if (url.startsWith("https://api.github.com") && process.env.GITHUB_TOKEN) headers.authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  const res = await fetch(url, { headers, signal: AbortSignal.timeout(10_000) });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.json();
}

async function main() {
  if (process.env.NOW_OFFLINE === "1") return { doc: null, how: "offline" };
  try {
    return { doc: await collectNow({ fetchJson }), how: "github" };
  } catch (e) {
    console.warn(`now: GitHub unavailable (${e.message}); trying the last deployed file`);
  }
  try {
    const doc = await fetchJson(LIVE);
    if (validNow(doc)) return { doc, how: "previous deploy" };
  } catch (e) {
    console.warn(`now: no previous file (${e.message})`);
  }
  return { doc: null, how: "empty" };
}

const { doc, how } = await main();
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(doc ?? { generated: null, since: null, mergedPrs: 0, items: [] }, null, 1) + "\n");
console.log(`now: ${doc?.items.length ?? 0} items from ${how}`);

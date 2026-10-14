// Submits URLs to IndexNow (lib/indexnow.mjs). Run by the deploy once the build is live.
//
//   node scripts/indexnow.mjs <changed-file>...   the pages those files produce
//   node scripts/indexnow.mjs --all               every URL in out/sitemap.xml
//   --dry-run                                     print the URLs, send nothing
import fs from "node:fs";
import { INDEXNOW_KEY, changedPaths, sitemapUrls } from "../lib/indexnow.mjs";

const SITE = process.env.SITE ?? "https://hrabovskyi.online";
const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const files = args.filter((a) => !a.startsWith("--"));

const sitemap = fs.existsSync("out/sitemap.xml") ? sitemapUrls(fs.readFileSync("out/sitemap.xml", "utf8")) : [];
const urls = args.includes("--all")
  ? sitemap
  : changedPaths(files, sitemap.map((u) => new URL(u).pathname)).map((p) => SITE + p);

if (urls.length === 0) {
  console.log("indexnow: no page changed, nothing to submit");
  process.exit(0);
}
console.log(`indexnow: ${urls.length} URL(s)\n${urls.join("\n")}`);
if (dryRun) process.exit(0);

const host = new URL(SITE).host;
const res = await fetch("https://api.indexnow.org/indexnow", {
  method: "POST",
  headers: { "Content-Type": "application/json; charset=utf-8" },
  body: JSON.stringify({ host, key: INDEXNOW_KEY, keyLocation: `${SITE}/${INDEXNOW_KEY}.txt`, urlList: urls }),
});
// 200 and 202 both mean accepted; 202 means the key is not verified yet.
console.log(`indexnow: HTTP ${res.status}`);
if (res.status !== 200 && res.status !== 202) process.exit(1);

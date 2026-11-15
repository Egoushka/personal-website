#!/usr/bin/env node
// The "new post" mail (`npm run newsletter -- <slug>`): prints the subject and an HTML body
// to paste into a new campaign in listmonk (list "hrabovskyi.online"). Reads only the post's
// frontmatter, so it needs no credential; the send stays a click in listmonk.
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

const slug = process.argv[2];
const file = slug && path.join(process.cwd(), "content", "posts", `${slug}.md`);
if (!file || !fs.existsSync(file)) {
  console.error("usage: npm run newsletter -- <slug>  (a published post in content/posts)");
  process.exit(2);
}
const { title, description } = matter(fs.readFileSync(file, "utf8")).data;
const url = `${process.env.SITE_URL ?? "https://hrabovskyi.online"}/writing/${slug}/`;
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
console.log(`Subject: ${title}\n\n<p>${esc(description)}</p>\n<p><a href="${url}">${esc(url)}</a></p>\n<p>Unsubscribe: {{ UnsubscribeURL }}</p>`);

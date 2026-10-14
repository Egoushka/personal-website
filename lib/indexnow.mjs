// IndexNow tells Bing, Yandex, Seznam and Naver which URLs changed, so they
// recrawl those instead of waiting for the sitemap. Google does not take part;
// it reads the sitemap. https://www.indexnow.org/documentation

/** The key is public by design: engines fetch it from /<key>.txt to check ownership. */
export const INDEXNOW_KEY = "af569b95a25223bedc8ddb0776e9ff00"; // gitleaks:allow — served publicly at /<key>.txt

/** Pages every build can change: they list posts, projects or the latest writing. */
const INDEX_PAGES = ["/", "/writing/", "/projects/"];

/**
 * Site paths for the files a push changed. A content file maps to its page; a
 * deleted post maps too, so engines learn that its URL now redirects. Any other
 * file (code, styles, lib/site.ts) can change a listing, so it maps to the index pages.
 * lib/site.ts holds the project pages' content too, so it also maps to every
 * `/projects/<slug>/` path in `sitemapPaths` (the built sitemap's paths).
 */
export function changedPaths(files, sitemapPaths = []) {
  const paths = new Set();
  for (const file of files) {
    let m;
    if (file === "lib/site.ts") {
      sitemapPaths.filter((p) => /^\/projects\/[a-z0-9-]+\/$/.test(p)).forEach((p) => paths.add(p));
    }
    if ((m = file.match(/^content\/posts\/([a-z0-9-]+)\.md$/))) {
      paths.add(`/writing/${m[1]}/`);
      INDEX_PAGES.forEach((p) => paths.add(p));
    } else if ((m = file.match(/^content\/docs\/([a-z0-9-]+)\/([a-z0-9-]+)\.md$/))) {
      paths.add(m[2] === "index" ? `/projects/${m[1]}/docs/` : `/projects/${m[1]}/docs/${m[2]}/`);
    } else if ((m = file.match(/^content\/methods\/([a-z0-9-]+)\.md$/))) {
      paths.add(`/methods/${m[1]}/`);
    } else if (/^(app|components|lib)\//.test(file)) {
      INDEX_PAGES.forEach((p) => paths.add(p));
    }
  }
  return [...paths];
}

/** Every <loc> in a sitemap, for a one-off full submission. */
export function sitemapUrls(xml) {
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
}

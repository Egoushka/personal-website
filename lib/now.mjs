/**
 * The /now/ feed: what I shipped lately, from public signals only.
 *
 * Every item is a fact another site already states and links to: a merged pull
 * request or a release in a public repository I own, a NuGet version, a post.
 * Nothing is typed by hand and nothing is estimated. Public only is enforced
 * three ways: the search asks for `is:public`, the events API lists public
 * events only, and an item whose repository is not in my public, non-fork
 * repository list is dropped.
 *
 * Build time only. `collectNow` takes `fetchJson` so tests never touch the
 * network; scripts/now.mjs supplies the real one and the fallbacks. Posts are
 * not in the file: lib/now.ts adds them from content/posts at render time.
 */

export const OWNER = "Egoushka";
/** The NuGet profile's owner id (lib/site.ts links to the profile). */
export const NUGET_OWNER = "red_tar";
export const WINDOW_DAYS = 30;
export const MAX_ITEMS = 40;
const MAX_PRS = 20;
const PER_REPO = 3;
const MAX_TITLE = 140;

const day = (iso) => String(iso).slice(0, 10);
const clip = (s) => {
  const t = String(s).replace(/\s+/g, " ").trim();
  return t.length > MAX_TITLE ? `${t.slice(0, MAX_TITLE - 1)}…` : t;
};
const repoOf = (fullName) => fullName.slice(OWNER.length + 1);

/** @returns {Set<string>} full names of public, non-fork repositories. */
export function publicRepos(repos) {
  return new Set(repos.filter((r) => !r.fork && !r.private && r.owner?.login === OWNER).map((r) => r.full_name));
}

export function prItems(search, allowed) {
  return (search.items ?? [])
    .map((i) => ({
      kind: "merged",
      date: day(i.pull_request?.merged_at ?? i.closed_at),
      repo: String(i.repository_url ?? "").replace("https://api.github.com/repos/", ""),
      title: clip(i.title),
      href: i.html_url,
    }))
    .filter((i) => allowed.has(i.repo) && i.href?.startsWith("https://github.com/"))
    .map((i) => ({ ...i, repo: repoOf(i.repo) }));
}

/**
 * The newest few per repository, and not release-please's own pull requests
 * (their releases are listed as releases): one busy repository must not be the
 * whole page.
 */
export function pickPrs(items) {
  const seen = new Map();
  return items
    .filter((i) => !/^chore(\([^)]*\))?: release /.test(i.title))
    .filter((i) => !/^(build|chore|deps)(\([^)]*\))?: [Bb]ump /.test(i.title))
    .filter((i) => {
      const n = (seen.get(i.repo) ?? 0) + 1;
      seen.set(i.repo, n);
      return n <= PER_REPO;
    })
    .slice(0, MAX_PRS);
}

export function releaseItems(events, allowed, since) {
  return events
    .filter((e) => e.type === "ReleaseEvent" && e.payload?.action === "published" && allowed.has(e.repo?.name))
    .map((e) => ({
      kind: "release",
      date: day(e.payload.release.published_at ?? e.created_at),
      repo: repoOf(e.repo.name),
      title: clip(e.payload.release.name || e.payload.release.tag_name),
      href: e.payload.release.html_url,
    }))
    .filter((i) => i.date >= since && i.href?.startsWith("https://github.com/"));
}

/** One package's newest version in the window: Chargehand publishes daily, and a feed of its patch versions would bury everything else. */
export function nugetItems(id, versions, since) {
  return versions
    .filter((v) => v.published && day(v.published) >= since && !v.published.startsWith("1900"))
    .sort((a, b) => b.published.localeCompare(a.published))
    .slice(0, 1)
    .map((v) => ({
      kind: "nuget",
      date: day(v.published),
      repo: id,
      title: `${id} ${v.version}`,
      href: `https://www.nuget.org/packages/${id}/${v.version}`,
    }));
}

export function postItems(posts, since) {
  return posts
    .filter((p) => p.date >= since)
    .map((p) => ({ kind: "post", date: p.date, repo: "writing", title: clip(p.title), href: `/writing/${p.slug}/` }));
}

export function sinceDate(now, days = WINDOW_DAYS) {
  return new Date(now.getTime() - days * 864e5).toISOString().slice(0, 10);
}

/** Newest first; one stable order so a rebuild with the same facts is the same file. */
export function sortItems(items) {
  return [...items].sort((a, b) => b.date.localeCompare(a.date) || a.href.localeCompare(b.href));
}

export async function collectNow({ fetchJson, now = new Date() }) {
  const since = sinceDate(now);
  const repos = await fetchJson(`https://api.github.com/users/${OWNER}/repos?type=owner&per_page=100`);
  const allowed = publicRepos(repos);
  const q = encodeURIComponent(`user:${OWNER} is:pr is:merged is:public -author:app/dependabot -author:app/renovate closed:>=${since}`);
  const search = await fetchJson(`https://api.github.com/search/issues?q=${q}&sort=updated&order=desc&per_page=100`);
  const prs = pickPrs(prItems(search, allowed));

  // Releases and NuGet are extras: a failure in one drops that source, not the page.
  let releases = [];
  try {
    const events = await fetchJson(`https://api.github.com/users/${OWNER}/events/public?per_page=100`);
    releases = releaseItems(events, allowed, since);
  } catch {}
  let nuget = [];
  try {
    const found = await fetchJson(`https://azuresearch-usnc.nuget.org/query?q=owner:${NUGET_OWNER}&take=30&prerelease=true`);
    for (const pkg of found.data ?? []) {
      const reg = await fetchJson(`https://api.nuget.org/v3/registration5-gz-semver2/${pkg.id.toLowerCase()}/index.json`);
      const last = reg.items.at(-1);
      const page = last.items ? last : await fetchJson(last["@id"]);
      const versions = page.items.map((i) => ({ version: i.catalogEntry.version, published: i.catalogEntry.published }));
      nuget.push(...nugetItems(pkg.id, versions, since));
    }
  } catch {
    nuget = [];
  }

  const items = sortItems([...prs, ...releases, ...nuget]);
  return {
    generated: now.toISOString(),
    since,
    // Counted by GitHub over the whole window, not the capped list below.
    mergedPrs: search.total_count ?? prs.length,
    items,
  };
}

/** A document is usable when it has the shape the page reads; a stale one is still true, only dated. */
export function validNow(d) {
  return (
    Boolean(d) && typeof d === "object" && typeof d.generated === "string" && Array.isArray(d.items) &&
    d.items.every((i) => i && ["merged", "release", "nuget", "post"].includes(i.kind) && /^\d{4}-\d\d-\d\d$/.test(i.date) && typeof i.title === "string" && typeof i.href === "string")
  );
}

import fs from "node:fs";
import path from "node:path";
import { getAllPosts } from "./posts";
import { MAX_ITEMS, WINDOW_DAYS, postItems, sinceDate, sortItems, validNow } from "./now.mjs";

export type NowItem = {
  kind: "merged" | "release" | "nuget" | "post";
  /** YYYY-MM-DD. */
  date: string;
  repo: string;
  title: string;
  href: string;
};

export type Now = {
  /** When the remote half was read, ISO; null when no source answered. */
  generated: string | null;
  since: string;
  /** Merged PRs in the window, as GitHub counts them (the list below is capped). */
  mergedPrs: number;
  counts: { release: number; nuget: number; post: number };
  items: NowItem[];
};

/**
 * Build time only: public/now.json is written by scripts/now.mjs (GitHub, NuGet,
 * the last deploy as fallback); posts come from content/posts here. Absent or
 * malformed means an empty remote half, never an error.
 */
export function getNow(buildDate = new Date()): Now {
  let remote: { generated: string | null; since: string | null; mergedPrs: number; items: NowItem[] } = {
    generated: null, since: null, mergedPrs: 0, items: [],
  };
  try {
    const doc = JSON.parse(fs.readFileSync(path.join(process.cwd(), "public", "now.json"), "utf8"));
    if (validNow({ ...doc, generated: doc.generated ?? "" }) && doc.generated) remote = doc;
  } catch {}
  const since = sinceDate(buildDate, WINDOW_DAYS);
  const posts = postItems(getAllPosts(), since) as NowItem[];
  const all = sortItems([...remote.items.filter((i) => i.date >= since), ...posts]) as NowItem[];
  const count = (k: NowItem["kind"]) => all.filter((i) => i.kind === k).length;
  return {
    generated: remote.generated,
    since,
    mergedPrs: remote.mergedPrs,
    counts: { release: count("release"), nuget: count("nuget"), post: count("post") },
    items: all.slice(0, MAX_ITEMS),
  };
}

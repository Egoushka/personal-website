"use client";

import { useState } from "react";
import Link from "next/link";

/**
 * The writing index, with the vocabulary as a filter over it.
 *
 * Every post is server-rendered into the static HTML, so the page is a complete
 * list before any JavaScript runs — the filter only ever *removes* rows, and the
 * sort only ever reorders ones already present. With JS off you get every post,
 * newest first, grouped by month, which is the correct degraded state.
 *
 * Topics are multi-select and union, not intersection: picking Python and
 * Postgres shows everything about either. Intersection reads like a mistake on a
 * blog this size — two topics almost always meet in zero posts.
 *
 * It takes rows, not `PostMeta`, because formatting a date means importing
 * lib/posts.ts, and that file reads the filesystem. The server formats; this
 * only arranges.
 */
export type PostRow = {
  slug: string;
  title: string;
  description: string;
  dateLabel: string;
  /** "July 2026" — the running head when the order is chronological. */
  month: string;
  readingTime: number;
  wordCount: number;
  topics: string[];
};

type Sort = "newest" | "oldest" | "longest";

const SORTS: { key: Sort; label: string }[] = [
  { key: "newest", label: "Newest" },
  { key: "oldest", label: "Oldest" },
  { key: "longest", label: "Longest" },
];

export default function PostFilter({
  posts,
  topics,
}: {
  posts: PostRow[];
  topics: { slug: string; name: string; count: number }[];
}) {
  const [active, setActive] = useState<string[]>([]);
  const [sort, setSort] = useState<Sort>("newest");

  const shown = posts.filter(
    (p) => active.length === 0 || p.topics.some((t) => active.includes(t)),
  );

  // `posts` arrives newest first, so chronological order is free in both
  // directions and only length has to be computed.
  const ordered =
    sort === "longest"
      ? [...shown].sort((a, b) => b.wordCount - a.wordCount)
      : sort === "oldest"
        ? [...shown].reverse()
        : shown;

  // A running head only where it means something. Sorted by length, a month is
  // not a fact about the group — it is noise beside a list that is no longer in
  // date order at all.
  const groups =
    sort === "longest"
      ? [{ head: "Longest first", rows: ordered }]
      : ordered.reduce<{ head: string; rows: PostRow[] }[]>((acc, p) => {
          const last = acc[acc.length - 1];
          if (last && last.head === p.month) last.rows.push(p);
          else acc.push({ head: p.month, rows: [p] });
          return acc;
        }, []);

  const toggle = (slug: string) =>
    setActive((a) => (a.includes(slug) ? a.filter((x) => x !== slug) : [...a, slug]));

  return (
    <>
      <ul className="filter-bar">
        <li>
          <button
            type="button"
            className="filter-chip"
            aria-pressed={active.length === 0}
            onClick={() => setActive([])}
          >
            All {posts.length}
          </button>
        </li>
        {topics.map((t) => (
          <li key={t.slug}>
            <button
              type="button"
              className="filter-chip"
              aria-pressed={active.includes(t.slug)}
              onClick={() => toggle(t.slug)}
            >
              {t.name} <span className="rail-count">{t.count}</span>
            </button>
          </li>
        ))}
      </ul>

      <div className="sort-bar">
        <span className="rail--label">Order</span>
        <div role="group" aria-label="Sort posts" className="sort-group">
          {SORTS.map((s) => (
            <button
              key={s.key}
              type="button"
              className="sort-btn"
              aria-pressed={sort === s.key}
              onClick={() => setSort(s.key)}
            >
              {s.label}
            </button>
          ))}
        </div>
        <span className="sort-count" aria-live="polite">
          {ordered.length === posts.length
            ? `${posts.length} ${posts.length === 1 ? "post" : "posts"}`
            : `${ordered.length} of ${posts.length}`}
        </span>
      </div>

      {groups.map((g) => (
        <section className="row post-group" key={g.head}>
          <span className="rail group-head">{g.head}</span>
          <ol className="post-list">
            {g.rows.map((p) => (
              <li className="post-row" key={p.slug}>
                <Link href={`/writing/${p.slug}/`}>{p.title}</Link>
                <p>{p.description}</p>
                <span className="post-meta run">
                  <span>{p.dateLabel}</span>
                  <span>{p.readingTime} min read</span>
                  <span>{p.wordCount.toLocaleString("en-GB")} words</span>
                </span>
              </li>
            ))}
          </ol>
        </section>
      ))}
    </>
  );
}

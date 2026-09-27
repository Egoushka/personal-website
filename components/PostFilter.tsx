"use client";

import { useState } from "react";
import Link from "next/link";

/**
 * The writing index, with the vocabulary as a filter over it.
 *
 * Every post is server-rendered into the static HTML, so the page is a complete
 * list before any JavaScript runs — the filter only ever *removes* rows, and the
 * sort only ever reorders ones already present. With JS off the controls are
 * hidden by CSS and you get every post, newest first, grouped by month.
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
  /** ISO `YYYY-MM-DD`, for ordering. */
  date: string;
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

  // Every order breaks ties by slug, so two posts from the same day land the
  // same way on the server and in the browser, and on every build.
  const bySlug = (a: PostRow, b: PostRow) => a.slug.localeCompare(b.slug);
  const ordered = [...shown].sort(
    sort === "longest"
      ? (a, b) => b.wordCount - a.wordCount || bySlug(a, b)
      : sort === "oldest"
        ? (a, b) => a.date.localeCompare(b.date) || bySlug(a, b)
        : (a, b) => b.date.localeCompare(a.date) || bySlug(a, b),
  );

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
              {t.name} <span className="rail-count">{t.count}<span className="visually-hidden"> posts</span></span>
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
        {/* Announces the count after a change; the page figures already show it. */}
        <span className="sort-count visually-hidden" aria-live="polite">
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
                <Link prefetch={false} href={`/writing/${p.slug}/`}>{p.title}</Link>
                <p>{p.description}</p>
                <span className="post-meta run">
                  <span>{p.dateLabel}</span>{" "}
                  <span>{p.readingTime} min read</span>{" "}
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

"use client";

import { useState } from "react";
import Link from "next/link";
import Lang from "@/components/Lang";
import KindLabel from "@/components/KindLabel";
import { chip, chipCount, segment, segmentButton } from "@/components/ui/toggle";
import type { CyrillicLang } from "@/lib/lang";
import type { PostKind } from "@/lib/posts";

/**
 * The writing index, with the vocabulary and the projects as a filter over it.
 *
 * Every post is server-rendered into the static HTML, so the page is a complete
 * list before any JavaScript runs — the filter only ever *removes* rows, and the
 * sort only ever reorders ones already present. With JS off the controls are
 * hidden by CSS and you get every post, newest first, grouped by month.
 *
 * Topics and projects are multi-select and union, not intersection: picking
 * Python and Chronicle shows everything about either. Intersection reads like a
 * mistake on a blog this size — two filters almost always meet in zero posts.
 *
 * It takes rows, not `PostMeta`, because formatting a date means importing
 * lib/posts.ts, and that file reads the filesystem. The server formats; this
 * only arranges.
 */
export type PostRow = {
  slug: string;
  title: string;
  /** The post's `cyrillic` frontmatter: the language its title's Cyrillic is marked with. */
  cyrillic?: CyrillicLang;
  description: string;
  /** The post's kind: a note says so on its row. */
  kind?: PostKind;
  /** ISO `YYYY-MM-DD`, for ordering. */
  date: string;
  dateLabel: string;
  /** "July 2026" — the running head when the order is chronological. */
  month: string;
  readingTime: number;
  wordCount: number;
  topics: string[];
  /** The project the post is about, when it is about one: its page lists the post too. */
  project?: { slug: string; name: string };
};

/** A chip's key. Topic and project slugs are separate vocabularies and may one day meet. */
const topicKey = (slug: string) => `topic:${slug}`;
const projectKey = (slug: string) => `project:${slug}`;

type Sort = "newest" | "oldest" | "longest";

const SORTS: { key: Sort; label: string }[] = [
  { key: "newest", label: "Newest" },
  { key: "oldest", label: "Oldest" },
  { key: "longest", label: "Longest" },
];

export default function PostFilter({
  posts,
  topics,
  projects,
}: {
  posts: PostRow[];
  topics: { slug: string; name: string; count: number }[];
  projects: { slug: string; name: string; count: number }[];
}) {
  const [active, setActive] = useState<string[]>([]);
  const [sort, setSort] = useState<Sort>("newest");

  const shown = posts.filter(
    (p) =>
      active.length === 0 ||
      p.topics.some((t) => active.includes(topicKey(t))) ||
      (p.project !== undefined && active.includes(projectKey(p.project.slug))),
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

  const toggle = (key: string) =>
    setActive((a) => (a.includes(key) ? a.filter((x) => x !== key) : [...a, key]));

  return (
    <>
      <div className="flex flex-col gap-3 border-b pb-6">
        <ul className="filter-bar flex flex-wrap gap-2" aria-label="Filter by topic">
          <li>
            <button type="button" className={chip} aria-pressed={active.length === 0} onClick={() => setActive([])}>
              All <span className={chipCount}>{posts.length}</span>
            </button>
          </li>
          {topics.map((t) => (
            <li key={t.slug}>
              <button
                type="button"
                className={chip}
                aria-pressed={active.includes(topicKey(t.slug))}
                onClick={() => toggle(topicKey(t.slug))}
              >
                {t.name} <span className={chipCount}>{t.count}<span className="visually-hidden"> posts</span></span>
              </button>
            </li>
          ))}
        </ul>

        {projects.length > 0 && (
          <div className="filter-row flex flex-wrap items-center gap-2">
            <span className="mr-1 text-sm text-muted-foreground" id="filter-projects">Project</span>
            <ul className="filter-bar flex flex-wrap gap-2" aria-labelledby="filter-projects">
              {projects.map((p) => (
                <li key={p.slug}>
                  <button
                    type="button"
                    className={chip}
                    aria-pressed={active.includes(projectKey(p.slug))}
                    onClick={() => toggle(projectKey(p.slug))}
                  >
                    {p.name} <span className={chipCount}>{p.count}<span className="visually-hidden"> posts</span></span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="sort-bar flex flex-wrap items-center gap-2">
          <span className="mr-1 text-sm text-muted-foreground">Order</span>
          <div role="group" aria-label="Sort posts" className={segment}>
            {SORTS.map((s) => (
              <button
                key={s.key}
                type="button"
                className={segmentButton}
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
      </div>

      {groups.map((g) => (
        <section
          className="post-group grid gap-3 border-b py-8 last:border-b-0 md:grid-cols-[11rem_minmax(0,1fr)] md:gap-8"
          key={g.head}
          aria-label={g.head}
        >
          <h2 className="text-sm font-medium text-muted-foreground md:pt-1">{g.head}</h2>
          <ol className="post-list divide-y">
            {g.rows.map((p) => (
              <li className="post-row group relative py-5 first:pt-0 last:pb-0" key={p.slug}>
                <h3 className="text-lg font-semibold tracking-tight text-balance">
                  <Link
                    prefetch={false}
                    href={`/writing/${p.slug}/`}
                    className="after:absolute after:inset-0 group-hover:underline group-hover:decoration-brand group-hover:underline-offset-4"
                  >
                    <Lang text={p.title} lang={p.cyrillic} />
                  </Link>
                </h3>
                <p className="mt-1 text-[0.9375rem] leading-relaxed text-muted-foreground">{p.description}</p>
                <p className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                  <KindLabel kind={p.kind} />{" "}
                  <span>{p.dateLabel}</span>{" "}
                  <span>{p.readingTime} min read</span>{" "}
                  <span>{p.wordCount.toLocaleString("en-GB")} words</span>
                  {p.project && (
                    <>
                      {" "}
                      <Link
                        prefetch={false}
                        href={`/projects/${p.project.slug}/`}
                        className="relative z-10 inline-flex min-h-6 items-center rounded-md border px-2 font-medium text-foreground transition-colors hover:bg-accent"
                      >
                        {p.project.name}
                      </Link>
                    </>
                  )}
                </p>
              </li>
            ))}
          </ol>
        </section>
      ))}

      {ordered.length === 0 && <p className="py-10 text-muted-foreground">Nothing matches that filter.</p>}
    </>
  );
}

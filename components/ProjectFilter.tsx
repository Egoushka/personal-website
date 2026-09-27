"use client";

import { useState } from "react";
import Link from "next/link";

/**
 * The project index, with a topic filter over it.
 *
 * Renders every project on the server, so the static HTML is a complete list and
 * the page is whole before any JavaScript runs. The filter only ever *removes*
 * rows — that is the rule that keeps this honest as a client component. With JS
 * off the chips are hidden by CSS and the full list stands.
 *
 * It takes rows, not `Project`: whatever a client component receives travels in
 * the page's payload, and a project's description and readings are not shown
 * here.
 */
export type ProjectRow = {
  slug: string;
  name: string;
  shape: string;
  status: string;
  summary: string;
  topics: { slug: string; name: string }[];
};

export default function ProjectFilter({
  projects,
  topics,
}: {
  projects: ProjectRow[];
  topics: { slug: string; name: string }[];
}) {
  const [active, setActive] = useState<string | null>(null);

  const shown = active
    ? projects.filter((p) => p.topics.some((t) => t.slug === active))
    : projects;

  return (
    <>
      <ul className="filter-bar">
        <li>
          <button
            type="button"
            className="filter-chip"
            aria-pressed={active === null}
            onClick={() => setActive(null)}
          >
            All {projects.length}
          </button>
        </li>
        {topics.map((t) => (
          <li key={t.slug}>
            <button
              type="button"
              className="filter-chip"
              aria-pressed={active === t.slug}
              onClick={() => setActive((a) => (a === t.slug ? null : t.slug))}
            >
              {t.name}
            </button>
          </li>
        ))}
      </ul>

      {/* Announces the count after a filter; the page figures already show it. */}
      <span className="sort-count visually-hidden" aria-live="polite">
        {shown.length === projects.length
          ? `${projects.length} projects`
          : `${shown.length} of ${projects.length} projects`}
      </span>

      <ol className="project-list">
        {shown.map((p) => (
          <li className="project-row" key={p.slug}>
            <h2 className="project-name">
              <Link prefetch={false} href={`/projects/${p.slug}/`}>{p.name}</Link>
            </h2>
            <span className="project-status">
              <span>{p.shape}</span>{" "}
              <span className="project-state">{p.status}</span>
            </span>
            <p>{p.summary}</p>
            <ul className="topic-run">
              {p.topics.map((t) => (
                <li key={t.slug}>
                  <Link prefetch={false} href={`/topics/${t.slug}/`}>{t.name}</Link>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ol>
    </>
  );
}

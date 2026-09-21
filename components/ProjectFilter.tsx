"use client";

import { useState } from "react";
import Link from "next/link";
import type { Project } from "@/lib/site";

/**
 * The project index, with a topic filter over it.
 *
 * Renders every project on the server, so the static HTML is a complete list and
 * the page is whole before any JavaScript runs. The filter only ever *removes*
 * rows — that is the rule that keeps this honest as a client component. With JS
 * off you get the full list and no chips, which is the correct degraded state.
 *
 * With three projects a filter is close to decoration, and I know it. It is here
 * because the shape has to exist before there are fifteen, and because the chips
 * double as a way into the topic pages, which are not decoration at all.
 */
export default function ProjectFilter({
  projects,
  topics,
}: {
  projects: Project[];
  topics: { slug: string; name: string }[];
}) {
  const [active, setActive] = useState<string | null>(null);

  const shown = active
    ? projects.filter((p) => (p.topics as string[]).includes(active))
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

      <ol className="project-list" aria-live="polite">
        {shown.map((p) => (
          <li className="project-row" key={p.slug}>
            <h2 className="project-name">
              <Link href={`/projects/${p.slug}/`}>{p.name}</Link>
            </h2>
            <span className="project-status">
              {p.meta} · {p.status}
            </span>
            <p>{p.summary}</p>
            <ul className="topic-run">
              {p.topics.map((t) => (
                <li key={t}>
                  <Link href={`/topics/${t}/`}>
                    {topics.find((x) => x.slug === t)?.name ?? t}
                  </Link>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ol>
    </>
  );
}

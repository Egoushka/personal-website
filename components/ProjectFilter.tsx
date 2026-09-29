"use client";

import { useState } from "react";
import ProjectCard from "@/components/ProjectCard";
import { chip, chipCount } from "@/components/ui/toggle";
import { groupProjects, type ProjectRow } from "@/lib/project-rows";

/**
 * The project index, with a topic filter and a "public code" filter over it.
 *
 * Renders every project on the server, so the static HTML is a complete list and
 * the page is whole before any JavaScript runs. The filters only ever *remove*
 * rows — that is the rule that keeps this honest as a client component. With JS
 * off the chips are hidden by CSS and the full list stands.
 *
 * The page is grouped by what a visitor wants to know, not by when it was built:
 * first what other people can run (`featured`, with its measured figures), then
 * everything else by state — running, building, paused — with public repositories
 * before private ones inside each group, because code you can read is the part
 * you can check.
 *
 * It takes rows, not `Project`: whatever a client component receives travels in
 * the page's payload, and a project's description is not shown here.
 */
const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

function Section({ id, label, note, rows, wide }: { id: string; label: string; note?: string; rows: ProjectRow[]; wide?: boolean }) {
  if (rows.length === 0) return null;
  return (
    <section className="border-t py-10 first:border-t-0" aria-labelledby={id}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id={id} className="text-2xl font-semibold tracking-tight">
          {label}
        </h2>
        <p className="text-sm text-muted-foreground tabular-nums">
          {plural(rows.length, "project", "projects")}
          {note && <> · {note}</>}
        </p>
      </div>
      <ul className={wide ? "mt-6 grid gap-4 md:grid-cols-2" : "mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3"}>
        {rows.map((p) => (
          <ProjectCard key={p.slug} p={p} />
        ))}
      </ul>
    </section>
  );
}

export default function ProjectFilter({
  projects,
  topics,
}: {
  projects: ProjectRow[];
  topics: { slug: string; name: string }[];
}) {
  const [topic, setTopic] = useState<string | null>(null);
  const [publicOnly, setPublicOnly] = useState(false);

  const { shown, featured, states } = groupProjects(projects, { topic, publicOnly });
  const publicTotal = projects.filter((p) => p.visibility === "public").length;
  const filtered = topic !== null || publicOnly;

  return (
    <>
      <div className="flex flex-col gap-3 border-b pb-6">
        <ul className="filter-bar flex flex-wrap gap-2" aria-label="Filter by topic">
          <li>
            <button
              type="button"
              className={chip}
              aria-pressed={!filtered}
              onClick={() => { setTopic(null); setPublicOnly(false); }}
            >
              All <span className={chipCount}>{projects.length}</span>
            </button>
          </li>
          {topics.map((t) => (
            <li key={t.slug}>
              <button
                type="button"
                className={chip}
                aria-pressed={topic === t.slug}
                onClick={() => setTopic((a) => (a === t.slug ? null : t.slug))}
              >
                {t.name}
              </button>
            </li>
          ))}
        </ul>

        <div className="filter-row flex flex-wrap items-center gap-2">
          <span className="mr-1 text-sm text-muted-foreground" id="filter-code">Code</span>
          <ul className="filter-bar flex flex-wrap gap-2" aria-labelledby="filter-code">
            <li>
              <button
                type="button"
                className={chip}
                aria-pressed={publicOnly}
                onClick={() => setPublicOnly((v) => !v)}
              >
                Public repository <span className={chipCount}>{publicTotal}<span className="visually-hidden"> projects</span></span>
              </button>
            </li>
          </ul>
        </div>
      </div>

      {/* Announces the count after a filter; the page figures already show it. */}
      <span className="sort-count visually-hidden" aria-live="polite">
        {shown.length === projects.length
          ? plural(projects.length, "project", "projects")
          : `${shown.length} of ${projects.length} projects`}
      </span>

      <Section id="pj-featured" label="Built for other people" note="you can run these" rows={featured} wide />
      {states.map(({ status, label, rows }) => (
        <Section key={status} id={`pj-${status}`} label={label} rows={rows} />
      ))}

      {shown.length === 0 && <p className="py-10 text-muted-foreground">Nothing matches both filters.</p>}
    </>
  );
}

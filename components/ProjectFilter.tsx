"use client";

import { useState } from "react";
import Link from "next/link";
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

/** Language, shape and where to look: the line under a project's name. */
function Facts({ p, withStatus }: { p: ProjectRow; withStatus?: boolean }) {
  return (
    <p className="pj-facts run">
      <span>{p.lang}</span>
      <span>{p.shape}</span>
      {withStatus && <span className="project-state">{p.status}</span>}
      {p.repo ? (
        <span><a href={p.repo} rel="noopener">repo</a></span>
      ) : (
        <span>private</span>
      )}
      {p.docs && <span><Link prefetch={false} href={p.docs}>docs</Link></span>}
      {p.posts > 0 && <span>{plural(p.posts, "post", "posts")}</span>}
    </p>
  );
}

function Entry({ p }: { p: ProjectRow }) {
  return (
    <li className={p.featured ? "pj pj--lead" : "pj"}>
      <div className="pj-head">
        <h3 className="pj-name">
          <Link prefetch={false} href={`/projects/${p.slug}/`}>{p.name}</Link>
        </h3>
        <Facts p={p} withStatus={p.featured} />
      </div>
      <p className="pj-sum">{p.summary}</p>
      {p.figures && p.figures.length > 0 && (
        <dl className="pj-figures">
          {p.figures.map((f) => (
            <div key={f.label}>
              <dt>{f.label}</dt>
              <dd>{f.value}</dd>
            </div>
          ))}
        </dl>
      )}
    </li>
  );
}

function Section({ id, label, unit, rows }: { id: string; label: string; unit: string; rows: ProjectRow[] }) {
  if (rows.length === 0) return null;
  return (
    <>
      <hr className="bleed" />
      <section className="row" aria-labelledby={id}>
        <div className="rail">
          <h2 className="rail--label" id={id}>{label}</h2>
          <span>{plural(rows.length, unit, `${unit}s`)}</span>
        </div>
        <ol className={rows[0].featured ? "pj-list pj-list--lead" : "pj-list"}>
          {rows.map((p) => <Entry key={p.slug} p={p} />)}
        </ol>
      </section>
    </>
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
      <ul className="filter-bar filter-bar--strip" aria-label="Filter by topic">
        <li>
          <button
            type="button"
            className="filter-chip"
            aria-pressed={!filtered}
            onClick={() => { setTopic(null); setPublicOnly(false); }}
          >
            All {projects.length}
          </button>
        </li>
        {topics.map((t) => (
          <li key={t.slug}>
            <button
              type="button"
              className="filter-chip"
              aria-pressed={topic === t.slug}
              onClick={() => setTopic((a) => (a === t.slug ? null : t.slug))}
            >
              {t.name}
            </button>
          </li>
        ))}
      </ul>

      <div className="filter-row">
        <span className="rail--label" id="filter-code">Code</span>
        <ul className="filter-bar" aria-labelledby="filter-code">
          <li>
            <button
              type="button"
              className="filter-chip"
              aria-pressed={publicOnly}
              onClick={() => setPublicOnly((v) => !v)}
            >
              Public repository <span className="rail-count">{publicTotal}<span className="visually-hidden"> projects</span></span>
            </button>
          </li>
        </ul>
      </div>

      {/* Announces the count after a filter; the page figures already show it. */}
      <span className="sort-count visually-hidden" aria-live="polite">
        {shown.length === projects.length
          ? plural(projects.length, "project", "projects")
          : `${shown.length} of ${projects.length} projects`}
      </span>

      <Section id="pj-featured" label="Built for other people" unit="project" rows={featured} />
      {states.map(({ status, label, rows }) => (
        <Section key={status} id={`pj-${status}`} label={label} unit="project" rows={rows} />
      ))}

      {shown.length === 0 && <p className="page-lede">Nothing matches both filters.</p>}
    </>
  );
}

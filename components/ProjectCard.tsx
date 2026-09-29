import Link from "next/link";
import StatusBadge from "@/components/StatusBadge";

/** What a card needs to know about a project; the index and the home page both build it on the server. */
export type ProjectCardData = {
  slug: string;
  name: string;
  lang: string;
  shape: string;
  status: "running" | "building" | "paused";
  summary: string;
  /** The public repository, when there is one. */
  repo?: string;
  /** The first page of its docs, when it has docs (ADR 0006). */
  docs?: string;
  /** How many posts name this project. */
  posts?: number;
  /** A few short measured figures, each read from the project's readings. */
  figures?: { label: string; value: string }[];
};

/**
 * One project as a card. The whole card follows the title's link; the repo and
 * docs links in its footer sit above that and go where they say. The projects
 * filter renders it in the browser, so no `cn()`: tailwind-merge would ship with it.
 */
export default function ProjectCard({ p, className }: { p: ProjectCardData; className?: string }) {
  return (
    <li
      className={`group relative flex flex-col rounded-xl border bg-card p-5 transition-colors hover:border-input hover:bg-accent/40 ${className ?? ""}`}
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-lg font-semibold tracking-tight">
          <Link prefetch={false} href={`/projects/${p.slug}/`} className="after:absolute after:inset-0 after:rounded-xl">
            {p.name}
          </Link>
        </h3>
        <StatusBadge status={p.status} className="mt-0.5" />
      </div>
      <p className="mt-0.5 text-sm text-muted-foreground">
        {p.lang} · {p.shape}
      </p>
      <p className="mt-3 text-sm leading-relaxed text-foreground/85">{p.summary}</p>

      {p.figures && p.figures.length > 0 && (
        <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 border-t pt-4 sm:grid-cols-3">
          {p.figures.map((f) => (
            <div key={f.label} className="min-w-0">
              <dt className="text-xs text-muted-foreground">{f.label}</dt>
              <dd className="mt-0.5 text-sm font-semibold tabular-nums wrap-anywhere">{f.value}</dd>
            </div>
          ))}
        </dl>
      )}

      {(p.repo || p.docs || (p.posts ?? 0) > 0) && (
        <p className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1 pt-4 text-xs text-muted-foreground">
          {p.docs && (
            <Link prefetch={false} href={p.docs} className="relative z-10 inline-flex min-h-6 items-center font-medium text-foreground hover:underline hover:decoration-brand hover:underline-offset-4">
              Docs
            </Link>
          )}
          {p.repo ? (
            <a href={p.repo} rel="noopener" className="relative z-10 inline-flex min-h-6 items-center font-medium text-foreground hover:underline hover:decoration-brand hover:underline-offset-4">
              Source
            </a>
          ) : (
            <span>Private repository</span>
          )}
          {(p.posts ?? 0) > 0 && (
            <span>
              {p.posts} {p.posts === 1 ? "post" : "posts"}
            </span>
          )}
        </p>
      )}
    </li>
  );
}

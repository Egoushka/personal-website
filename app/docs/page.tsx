import type { Metadata } from "next";
import Link from "next/link";
import Shell from "@/components/Shell";
import PageHead from "@/components/PageHead";
import { Badge } from "@/components/ui/badge";
import { ArrowRight } from "@/components/ui/icons";
import { projects } from "@/lib/site";
import { pageMetadata } from "@/lib/metadata";
import { docVersion, getDocProjects } from "@/lib/docs";

const description =
  "Guides for the tools I've built, each written in its project's own repository and copied here at a pinned commit.";

export const metadata: Metadata = pageMetadata({ title: "Docs", description, path: "/docs/" });

/**
 * Every project that has docs (ADR 0006), one card each. A project without docs
 * is not listed: its page on /projects/ says what it is, and a card that leads
 * to nothing is a promise the site cannot keep.
 */
export default function DocsIndex() {
  const docs = getDocProjects().flatMap((d) => {
    const project = projects.find((p) => p.slug === d.slug);
    return project ? [{ ...d, project }] : [];
  });
  const pageCount = docs.reduce((sum, d) => sum + d.pages.length, 0);

  return (
    <Shell current="docs">
      <PageHead
        title="Docs"
        lede={
          <>
            {description} Each page says which commit it describes, and the source is one click away.
          </>
        }
        figures={
          <>
            <span>{docs.length} {docs.length === 1 ? "project" : "projects"}</span>{" "}
            <span>{pageCount} pages</span>
          </>
        }
      />

      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" data-pagefind-ignore>
        {docs.map(({ project, source, pages }) => (
          <li
            key={project.slug}
            className="group relative flex flex-col rounded-xl border bg-card p-5 transition-colors hover:border-input hover:bg-accent/40"
          >
            <div className="flex items-center gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg border bg-muted font-display text-lg font-semibold">
                {project.name.slice(0, 1).toUpperCase()}
              </span>
              <div className="min-w-0">
                <h2 className="font-semibold tracking-tight">
                  <Link prefetch={false} href={pages[0].href} className="after:absolute after:inset-0 after:rounded-xl">
                    {project.name}
                  </Link>
                </h2>
                <p className="text-sm text-muted-foreground">
                  {project.lang} · {project.shape}
                </p>
              </div>
              <ArrowRight className="ml-auto text-muted-foreground transition-transform group-hover:translate-x-0.5" />
            </div>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{project.summary}</p>
            {/*
              The card's own link opens the overview; this list names what is behind
              it. `relative` lifts each link above the card's stretched link.
            */}
            <ol className="mt-4 space-y-0.5 border-l pl-3 text-sm" aria-label={`${project.name} docs pages`}>
              {pages.slice(1).map((page) => (
                <li key={page.page}>
                  <Link
                    prefetch={false}
                    href={page.href}
                    className="relative inline-flex min-h-6 items-center text-muted-foreground hover:text-foreground"
                  >
                    {page.title}
                  </Link>
                </li>
              ))}
            </ol>
            <div className="mt-auto flex flex-wrap gap-2 pt-5">
              <Badge variant="outline">{pages.length} pages</Badge>
              <Badge variant="outline" className="font-mono">{docVersion(source)}</Badge>
            </div>
          </li>
        ))}
      </ul>
    </Shell>
  );
}

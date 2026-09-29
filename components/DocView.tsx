import Link from "next/link";
import Shell from "@/components/Shell";
import Prose from "@/components/Prose";
import PostEnhancements from "@/components/PostEnhancements";
import Lang from "@/components/Lang";
import { DocsMenu, DocsNav, type DocsProjectLink } from "@/components/docs/DocsSidebar";
import { TocDisclosure, TocRail } from "@/components/Toc";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { badgeVariants } from "@/components/ui/badge";
import { ArrowLeft, ArrowRight, ArrowUpRight, Calendar, GitCommitHorizontal, PenLine } from "@/components/ui/icons";
import type { Project } from "@/lib/site";
import { formatDate, tableOfContents } from "@/lib/posts";
import {
  docSections,
  docSourceUrl,
  docVersion,
  resolveDocHref,
  type DocPage,
  type DocPageMeta,
  type DocSource,
} from "@/lib/docs";
import { cn } from "@/lib/utils";

/**
 * One page of a project's docs (ADR 0006), laid out the way documentation sites
 * are: the project's pages grouped by section on the left, the page in the
 * middle, its contents on the right. The badges under the title say what the
 * page is a copy of — the repository at a commit — because docs that do not say
 * which version they describe are the docs nobody trusts.
 */
export default function DocView({
  project,
  source,
  pages,
  page,
  others,
}: {
  project: Project;
  source: DocSource;
  pages: DocPageMeta[];
  page: DocPage;
  /** Every other project with docs, for the sidebar's switcher. */
  others: DocsProjectLink[];
}) {
  // Sections and their subsections, unless the subsections would bury the
  // sections: past fifteen, a page's `###` are rows of a list, not a map.
  const all = tableOfContents(page.content, 3);
  const toc = all.filter((h) => h.depth === 3).length > 15 ? all.filter((h) => h.depth === 2) : all;
  // Previous and Next walk the sidebar as it reads: section by section, then
  // `order` inside each. Walking `order` alone would jump between sections.
  const reading = docSections(pages).flatMap((s) => s.pages);
  const at = reading.findIndex((p) => p.page === page.page);
  const prev = at > 0 ? reading[at - 1] : undefined;
  const next = at >= 0 && at < reading.length - 1 ? reading[at + 1] : undefined;
  const isIndex = page.page === "index";
  // An edit goes to the branch the docs were pulled from, never to the pinned
  // commit: that is where the change has to be made (ADR 0006).
  const editable = !/^[0-9a-f]{40}$/.test(source.ref) && !/^v\d/.test(source.ref);
  const editUrl = `https://github.com/${source.repo}/edit/${source.ref}/${source.path}/${page.page}.md`;
  const sidebar = { project, source, pages, current: page.page, others };

  return (
    <Shell current="docs" width="wide">
      <PostEnhancements key={`${project.slug}/${page.page}`} />

      <div className="docs-grid">
        <DocsNav {...sidebar} />
        <DocsMenu {...sidebar} />

        {toc.length > 1 && <TocDisclosure entries={toc} className="docs-toc-inline mt-3 lg:mt-8" />}

        <div className="docs-main pt-8 lg:pt-10">
          <Breadcrumb data-pagefind-ignore>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/docs/">Docs</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                {isIndex ? (
                  <BreadcrumbPage>{project.name}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink href={pages[0].href}>{project.name}</BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {!isIndex && (
                <>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage>{page.section}</BreadcrumbPage>
                  </BreadcrumbItem>
                </>
              )}
            </BreadcrumbList>
          </Breadcrumb>

          <div data-pagefind-body>
            <header className="mt-5">
              <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
                <Lang text={page.title} lang={page.cyrillic} />
              </h1>
              {page.description && (
                <p className="mt-3 text-lg leading-relaxed text-muted-foreground">
                  <Lang text={page.description} lang={page.cyrillic} />
                </p>
              )}
              <div className="mt-5 flex flex-wrap items-center gap-2" data-pagefind-ignore>
                <a
                  href={docSourceUrl(source)}
                  rel="noopener"
                  className={cn(badgeVariants({ variant: "outline" }), "h-6 font-mono transition-colors hover:bg-accent")}
                  title={`The copy is of ${source.repo} at ${source.commit}`}
                >
                  <GitCommitHorizontal />
                  {docVersion(source)}
                </a>
                <span className={cn(badgeVariants({ variant: "muted" }), "h-6")}>
                  <Calendar />
                  Pulled <time dateTime={source.pulled}>{formatDate(source.pulled)}</time>
                </span>
                <a
                  href={docSourceUrl(source, page.page)}
                  rel="noopener"
                  className="ml-auto inline-flex min-h-6 items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  View source <ArrowUpRight className="size-3.5" />
                </a>
              </div>
            </header>

            <article className="prose markdown mt-10">
              <Prose
                markdown={page.content}
                cyrillic={page.cyrillic}
                resolveHref={(href) => resolveDocHref(project.slug, source, href)}
              />
            </article>
          </div>

          {(prev || next) && (
            <nav className="mt-16 grid gap-3 sm:grid-cols-2" aria-label="Previous and next page" data-pagefind-ignore>
              {prev ? (
                <Link
                  prefetch={false}
                  href={prev.href}
                  className="group flex flex-col gap-1 rounded-xl border p-4 transition-colors hover:border-input hover:bg-accent/50"
                >
                  <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                    <ArrowLeft className="size-3.5 transition-transform group-hover:-translate-x-0.5" /> Previous
                  </span>
                  <span className="font-medium">{prev.title}</span>
                </Link>
              ) : (
                <span className="hidden sm:block" />
              )}
              {next && (
                <Link
                  prefetch={false}
                  href={next.href}
                  className="group flex flex-col items-end gap-1 rounded-xl border p-4 text-right transition-colors hover:border-input hover:bg-accent/50"
                >
                  <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                    Next <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                  </span>
                  <span className="font-medium">{next.title}</span>
                </Link>
              )}
            </nav>
          )}

          {/* A div, not a <footer>: the page's contentinfo is the site footer, outside <main>. */}
          <div className="mt-10 flex flex-col gap-3 border-t pt-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between" data-pagefind-ignore>
            <p>
              Written in{" "}
              <a className="link" href={`https://github.com/${source.repo}`} rel="noopener">
                {source.repo}
              </a>{" "}
              and copied here at <span className="font-mono text-foreground">{source.commit.slice(0, 7)}</span>.
            </p>
            {editable && (
              <a href={editUrl} rel="noopener" className="inline-flex min-h-6 items-center gap-1.5 transition-colors hover:text-foreground">
                <PenLine className="size-3.5" /> Edit this page on GitHub
              </a>
            )}
          </div>
        </div>

        {toc.length > 1 && (
          <TocRail entries={toc} className="docs-toc py-10">
            <div className="mt-6 space-y-2 border-t pt-4 text-sm text-muted-foreground">
              <a href={docSourceUrl(source, page.page)} rel="noopener" className="flex items-center gap-1.5 transition-colors hover:text-foreground">
                View source <ArrowUpRight className="size-3.5" />
              </a>
              {editable && (
                <a href={editUrl} rel="noopener" className="flex items-center gap-1.5 transition-colors hover:text-foreground">
                  Edit on GitHub <ArrowUpRight className="size-3.5" />
                </a>
              )}
            </div>
          </TocRail>
        )}
      </div>
    </Shell>
  );
}

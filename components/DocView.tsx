import Link from "next/link";
import Shell from "@/components/Shell";
import Prose from "@/components/Prose";
import PostEnhancements from "@/components/PostEnhancements";
import type { Project } from "@/lib/site";
import { formatDate, tableOfContents } from "@/lib/posts";
import {
  docSourceUrl,
  docVersion,
  resolveDocHref,
  type DocPage,
  type DocPageMeta,
  type DocSource,
} from "@/lib/docs";

/**
 * One page of a project's docs (ADR 0006).
 *
 * The post layout, so reading a page of docs feels like reading a post: the rail
 * carries the docs' own pages and then this page's sections, and the body goes
 * through the same renderer. The figures say what the page is a copy of — the
 * repository at a commit — because docs that do not say which version they
 * describe are the docs nobody trusts.
 */
export default function DocView({
  project,
  source,
  pages,
  page,
}: {
  project: Project;
  source: DocSource;
  pages: DocPageMeta[];
  page: DocPage;
}) {
  const toc = tableOfContents(page.content);
  const at = pages.findIndex((p) => p.page === page.page);
  const prev = at > 0 ? pages[at - 1] : undefined;
  const next = at >= 0 && at < pages.length - 1 ? pages[at + 1] : undefined;

  return (
    <Shell current="projects">
      <PostEnhancements key={`${project.slug}/${page.page}`} />

      <header className="post-head" data-pagefind-body>
        <h1>{page.title}</h1>
        <p className="page-figures" data-pagefind-ignore>
          <span><Link prefetch={false} href={`/projects/${project.slug}/`}>{project.name}</Link></span>{" "}
          <span>docs at <a href={docSourceUrl(source)} rel="noopener">{docVersion(source)}</a></span>{" "}
          <span>pulled <time dateTime={source.pulled}>{formatDate(source.pulled)}</time></span>{" "}
          <span><a href={docSourceUrl(source, page.page)} rel="noopener">source</a></span>
        </p>
      </header>

      <div className="post-layout">
        <aside className="post-aside">
          {/*
            The docs' pages first, then this page's sections. Both collapse into
            closed <details> below 900px, like a post's contents, and neither
            needs JavaScript. The pages are not a `.toc`: the scroll-spy marks the
            first `.toc` in the rail, and that must stay this page's sections.
          */}
          <details className="toc-details rail--group">
            <summary data-pagefind-ignore>Docs <span className="rail-count">{pages.length}<span className="visually-hidden"> pages</span></span></summary>
            <span className="rail--label">Docs</span>
            <nav aria-label={`${project.name} docs`}>
              <ol className="docs-pages">
                {pages.map((p) => (
                  <li key={p.page}>
                    <Link prefetch={false} href={p.href} aria-current={p.page === page.page ? "page" : undefined}>
                      {p.title}
                    </Link>
                  </li>
                ))}
              </ol>
            </nav>
          </details>
          {toc.length > 1 && (
            <details className="toc-details rail--group">
              <summary data-pagefind-ignore>On this page <span className="rail-count">{toc.length}<span className="visually-hidden"> sections</span></span></summary>
              <span className="rail--label">On this page</span>
              <ol className="toc">
                {toc.map((h) => (
                  <li key={h.id}><a href={`#${h.id}`}>{h.text}</a></li>
                ))}
              </ol>
            </details>
          )}
        </aside>

        <article className="prose post-body" data-pagefind-body>
          <Prose markdown={page.content} resolveHref={(href) => resolveDocHref(project.slug, source, href)} />
        </article>
      </div>

      {(prev || next) && (
        <>
          <hr className="bleed" />
          <nav className="row doc-pager" aria-label="Docs pages" data-pagefind-ignore>
            <span className="rail rail--label">Read on</span>
            <div className="run">
              {prev && <span>Previous: <Link prefetch={false} href={prev.href}>{prev.title}</Link></span>}{" "}
              {next && <span>Next: <Link prefetch={false} href={next.href}>{next.title}</Link></span>}
            </div>
          </nav>
        </>
      )}
    </Shell>
  );
}

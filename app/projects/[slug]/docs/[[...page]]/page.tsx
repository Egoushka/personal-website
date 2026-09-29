import type { Metadata } from "next";
import { notFound } from "next/navigation";
import DocView from "@/components/DocView";
import { projects } from "@/lib/site";
import { pageMetadata } from "@/lib/metadata";
import { getDocPage, getDocPages, getDocProjects, getDocSource, getDocSources } from "@/lib/docs";

/** `page` is absent for the overview (`index.md`, the docs root) and one segment otherwise. */
type Params = { slug: string; page?: string[] };

/**
 * Every page of every project's docs, the overview as the docs root. One
 * optional catch-all rather than a root route and a `[page]` route: with
 * `output: "export"` a route whose list comes back empty fails the build, and a
 * project whose docs are only an overview would empty the second one. The list
 * as a whole is never empty while any project has docs (ADR 0006).
 */
export function generateStaticParams(): Params[] {
  return Object.keys(getDocSources()).flatMap((slug) =>
    getDocPages(slug).map((d) => ({ slug, page: d.page === "index" ? [] : [d.page] })),
  );
}

/** The docs page a route names, or nothing: a second segment is never a page. */
function resolve(slug: string, segments: string[] | undefined) {
  const project = projects.find((p) => p.slug === slug);
  const source = getDocSource(slug);
  if (!project || !source || (segments && segments.length > 1)) return undefined;
  const name = segments?.[0] ?? "index";
  const pages = getDocPages(slug);
  return pages.some((p) => p.page === name) ? { project, source, pages, name } : undefined;
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug, page } = await params;
  const found = resolve(slug, page);
  if (!found) return {};
  const meta = found.pages.find((p) => p.page === found.name)!;
  return pageMetadata({
    title: found.name === "index" ? `${found.project.name} docs` : `${meta.title} — ${found.project.name} docs`,
    description: meta.description,
    path: meta.href,
  });
}

export default async function Docs({ params }: { params: Promise<Params> }) {
  const { slug, page } = await params;
  const found = resolve(slug, page);
  if (!found) notFound();
  // The other projects with docs, for the sidebar's switcher: name and summary
  // only, never the pages.
  const others = getDocProjects()
    .filter((d) => d.slug !== slug)
    .flatMap((d) => {
      const p = projects.find((q) => q.slug === d.slug);
      return p ? [{ slug: p.slug, name: p.name, summary: p.summary, href: d.pages[0].href }] : [];
    });
  return (
    <DocView
      project={found.project}
      source={found.source}
      pages={found.pages}
      page={getDocPage(slug, found.name)}
      others={others}
    />
  );
}

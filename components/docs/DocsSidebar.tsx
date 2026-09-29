import Link from "next/link";
import type { Project } from "@/lib/site";
import { docSections, docVersion, docSourceUrl, type DocPageMeta, type DocSource } from "@/lib/docs";
import { ArrowUpRight, ChevronDown, ChevronsUpDown, Menu } from "@/components/ui/icons";
import { cn } from "@/lib/utils";

export type DocsProjectLink = { slug: string; name: string; summary: string; href: string };

/**
 * The docs sidebar: which project's docs these are (and a way to the others),
 * then the pages grouped by section, the same five sections for every project.
 * Rendered twice by DocsLayout — a rail from 1024px (`DocsNav`) and a closed
 * disclosure above the page below it (`DocsMenu`) — with one displayed at a time.
 */
type SidebarProps = {
  project: Project;
  source: DocSource;
  pages: DocPageMeta[];
  current: string;
  others: DocsProjectLink[];
};

function SidebarContent({ project, source, pages, current, others }: SidebarProps) {
  const sections = docSections(pages);
  return (
    <>
      <details className="disclosure">
        <summary className="flex w-full items-center gap-3 rounded-lg border bg-card px-3 py-2.5 text-left transition-colors hover:bg-accent">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-md border bg-muted font-display text-sm font-semibold text-foreground">
            {project.name.slice(0, 1).toUpperCase()}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold">{project.name}</span>
            <span className="block truncate font-mono text-xs text-muted-foreground">{docVersion(source)}</span>
          </span>
          <ChevronsUpDown className="text-muted-foreground" />
          <span className="visually-hidden">, switch to another project&apos;s docs</span>
        </summary>
        <ul className="mt-2 space-y-0.5 rounded-lg border bg-card p-1.5">
          {others.map((o) => (
            <li key={o.slug}>
              <Link prefetch={false} href={o.href} className="block rounded-md px-2.5 py-2 transition-colors hover:bg-accent">
                <span className="block text-sm font-medium">{o.name}</span>
                <span className="block truncate text-xs text-muted-foreground">{o.summary}</span>
              </Link>
            </li>
          ))}
          <li className="mt-1 border-t pt-1">
            <Link
              prefetch={false}
              href="/docs/"
              className="block rounded-md px-2.5 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              All docs
            </Link>
          </li>
        </ul>
      </details>

      {sections.map((s) => (
        <div key={s.title} className="mt-6">
          <p className="mb-1.5 px-2.5 text-[0.8125rem] font-semibold text-foreground">{s.title}</p>
          <ul className="space-y-0.5">
            {s.pages.map((p) => (
              <li key={p.page}>
                <Link
                  prefetch={false}
                  href={p.href}
                  aria-current={p.page === current ? "page" : undefined}
                  className={cn(
                    "flex min-h-8 items-center rounded-md px-2.5 py-1.5 text-sm text-muted-foreground transition-colors",
                    "hover:bg-accent hover:text-foreground",
                    "aria-[current=page]:bg-accent aria-[current=page]:font-medium aria-[current=page]:text-foreground",
                  )}
                >
                  {p.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}

      <ul className="mt-8 space-y-0.5 border-t pt-4 text-sm text-muted-foreground">
        <li>
          <Link
            prefetch={false}
            href={`/projects/${project.slug}/`}
            className="flex min-h-8 items-center rounded-md px-2.5 transition-colors hover:bg-accent hover:text-foreground"
          >
            About {project.name}
          </Link>
        </li>
        <li>
          <a
            href={docSourceUrl(source)}
            rel="noopener"
            className="flex min-h-8 items-center gap-1.5 rounded-md px-2.5 transition-colors hover:bg-accent hover:text-foreground"
          >
            Docs source <ArrowUpRight className="size-3.5" />
          </a>
        </li>
      </ul>
    </>
  );
}

/** The sidebar as a rail, from 1024px. */
export function DocsNav(props: SidebarProps) {
  return (
    <nav className="docs-nav py-8 pr-1" aria-label={`${props.project.name} docs`} data-pagefind-ignore>
      <SidebarContent {...props} />
    </nav>
  );
}

/** The sidebar as a closed disclosure above the page, below 1024px. */
export function DocsMenu(props: SidebarProps) {
  const here = props.pages.find((p) => p.page === props.current);
  return (
    <details className="docs-menu disclosure mt-6 rounded-lg border" data-pagefind-ignore>
      <summary className="flex min-h-11 items-center gap-2 px-3 text-sm font-medium">
        <Menu className="text-muted-foreground" />
        <span className="shrink-0 text-muted-foreground">{props.project.name} docs</span>
        {here && (
          <>
            <span className="text-muted-foreground" aria-hidden="true">/</span>
            <span className="truncate">{here.title}</span>
          </>
        )}
        <ChevronDown className="disclosure-chevron ml-auto text-muted-foreground transition-transform" />
      </summary>
      <nav className="border-t p-2 pb-4" aria-label={`${props.project.name} docs`}>
        <SidebarContent {...props} />
      </nav>
    </details>
  );
}

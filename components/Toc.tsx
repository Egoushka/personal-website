import { ChevronDown } from "@/components/ui/icons";
import { cn } from "@/lib/utils";

export type TocEntry = { id: string; text: string; depth: number };

/**
 * "On this page": a page's `##` headings, and its `###` headings indented under
 * them. The scroll-spy in PostEnhancements marks the current one; without
 * JavaScript it is a list of working anchors.
 *
 * Rendered twice by a page that has room for a rail: `TocRail` beside the
 * content on a wide screen, `TocDisclosure` above it on a narrow one, with one
 * displayed at a time. Both are `nav`s with the same name, never both visible.
 */
export function TocList({ entries }: { entries: TocEntry[] }) {
  return (
    <ol className="toc">
      {entries.map((h) => (
        <li key={h.id} className={h.depth > 2 ? "toc-sub" : undefined}>
          <a href={`#${h.id}`}>{h.text}</a>
        </li>
      ))}
    </ol>
  );
}

export function TocRail({
  entries,
  className,
  children,
}: {
  entries: TocEntry[];
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <nav className={className} aria-label="On this page" data-toc data-pagefind-ignore>
      <p className="mb-3 text-sm font-semibold">On this page</p>
      <TocList entries={entries} />
      {children}
    </nav>
  );
}

export function TocDisclosure({ entries, className }: { entries: TocEntry[]; className?: string }) {
  return (
    <details className={cn("disclosure rounded-lg border", className)} data-pagefind-ignore>
      <summary className="flex min-h-11 items-center gap-2 px-3 text-sm font-medium">
        On this page
        <span className="text-muted-foreground tabular-nums">{entries.length}</span>
        <ChevronDown className="disclosure-chevron ml-auto text-muted-foreground transition-transform" />
      </summary>
      <nav className="border-t px-3 py-3" aria-label="On this page" data-toc>
        <TocList entries={entries} />
      </nav>
    </details>
  );
}

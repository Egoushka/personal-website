import Link from "next/link";
import { site } from "@/lib/site";
import { GUTTER, WIDTHS, type Width } from "@/lib/layout";
import { cn } from "@/lib/utils";

/**
 * The footer carries what is not a section: the journey, how to reach me, the
 * feed and the source. /journey/ is here because nothing else links to it, and a
 * finished page nobody can navigate to is the same as a missing one.
 */
const LINKS = [
  { href: "/journey/", label: "Journey", internal: true },
  { href: "/about/#contact", label: "Contact", internal: true },
  { href: "/feed.xml", label: "RSS" },
  { href: site.github, label: "GitHub", external: true },
];

export default function Footer({ width = "default" }: { width?: Width }) {
  return (
    <footer className="site-footer mt-24 border-t" data-pagefind-ignore>
      <div
        className={cn(
          "mx-auto flex flex-col gap-3 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between",
          WIDTHS[width],
          GUTTER,
        )}
      >
        <p>
          <span className="font-medium text-foreground">{site.name}</span>
          <span aria-hidden="true"> · </span>
          <span>{site.domain}</span>
        </p>
        <ul className="-mx-2 flex flex-wrap items-center gap-1">
          {LINKS.map((l) => (
            <li key={l.href}>
              {l.internal ? (
                <Link prefetch={false} href={l.href} className="inline-flex min-h-8 items-center rounded-md px-2 transition-colors hover:text-foreground">
                  {l.label}
                </Link>
              ) : (
                <a href={l.href} rel={l.external ? "noopener" : undefined} className="inline-flex min-h-8 items-center rounded-md px-2 transition-colors hover:text-foreground">
                  {l.label}
                </a>
              )}
            </li>
          ))}
        </ul>
      </div>
    </footer>
  );
}

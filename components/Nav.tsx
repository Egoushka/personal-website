import Link from "next/link";
import Search from "@/components/Search";
import ThemeToggle from "@/components/ThemeToggle";
import { GUTTER, WIDTHS, type Width } from "@/lib/layout";
import { cn } from "@/lib/utils";

/**
 * The header: wordmark, the sections, search and the theme switch. Sticky from
 * a tablet up; on a phone it scrolls away, and the sections take a row of their
 * own under the wordmark rather than hiding behind a menu button.
 *
 * Writing, Projects, Docs, About, CV. The CV is here because the home page
 * advertises contract work and the CV is what a buyer forwards. Skills is not:
 * About and the CV both link to it.
 *
 * Search stays outside `<nav>`, so its result links never land inside the
 * navigation landmark.
 */
const SECTIONS = [
  { key: "writing", href: "/writing/", label: "Writing" },
  { key: "projects", href: "/projects/", label: "Projects" },
  { key: "docs", href: "/docs/", label: "Docs" },
  { key: "about", href: "/about/", label: "About" },
  { key: "cv", href: "/cv/", label: "CV" },
] as const;

export type Section = (typeof SECTIONS)[number]["key"] | "home";

export default function Nav({ current, width = "default" }: { current?: Section; width?: Width }) {
  return (
    <header
      className="site-header z-40 w-full border-b bg-background/90 backdrop-blur-md supports-[backdrop-filter]:bg-background/75 md:sticky md:top-0"
      data-pagefind-ignore
    >
      <div className={cn("mx-auto flex flex-wrap items-center gap-x-3 md:h-14 md:flex-nowrap", WIDTHS[width], GUTTER)}>
        {current === "home" ? (
          // On the home page the wordmark is not a link to itself.
          <span className="brand order-1 flex h-14 items-center font-semibold tracking-tight">Yehor Hrabovskyi</span>
        ) : (
          <Link className="brand order-1 flex h-14 items-center font-semibold tracking-tight hover:text-foreground/80" href="/">
            Yehor Hrabovskyi
          </Link>
        )}

        <nav
          aria-label="Primary"
          className="order-3 -mx-2 flex w-[calc(100%+1rem)] items-center gap-0.5 overflow-x-auto pb-2 md:order-2 md:mx-0 md:ml-4 md:w-auto md:overflow-visible md:pb-0"
        >
          {SECTIONS.map((s) => (
            <Link
              key={s.key}
              href={s.href}
              aria-current={current === s.key ? "page" : undefined}
              className="inline-flex h-8 shrink-0 items-center rounded-md px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground aria-[current=page]:bg-accent aria-[current=page]:text-foreground"
            >
              {s.label}
            </Link>
          ))}
        </nav>

        {/* One unit, so the two controls wrap together. */}
        <div className="order-2 ml-auto flex items-center gap-2 md:order-3">
          <Search />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}

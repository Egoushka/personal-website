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
 * Writing, Projects, Shop, Partner, Docs, About, CV. The CV is here because it is what a
 * reader forwards. Skills is not: About and the CV both link to it.
 *
 * Search stays outside `<nav>`, so its result links never land inside the
 * navigation landmark.
 */
const SECTIONS = [
  { key: "writing", href: "/writing/", label: "Writing" },
  { key: "projects", href: "/projects/", label: "Projects" },
  { key: "shop", href: "/shop/", label: "Shop" },
  { key: "partner", href: "/partner/", label: "Partner" },
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
          <span className="brand order-1 flex h-14 items-center gap-2.5 font-semibold tracking-tight">
            <span aria-hidden="true" className="grid size-7 place-items-center rounded-md border border-input bg-card font-mono text-xs font-bold tracking-tight">YH</span>
            Yehor Hrabovskyi
          </span>
        ) : (
          <Link className="brand order-1 flex h-14 items-center gap-2.5 font-semibold tracking-tight hover:text-foreground/80" href="/">
            <span aria-hidden="true" className="grid size-7 place-items-center rounded-md border border-input bg-card font-mono text-xs font-bold tracking-tight">YH</span>
            Yehor Hrabovskyi
          </Link>
        )}

        <nav
          aria-label="Primary"
          className="order-3 -mx-2 flex w-[calc(100%+1rem)] flex-wrap items-center gap-0.5 pb-2 md:order-2 md:mx-0 md:ml-4 md:w-auto md:flex-nowrap md:pb-0"
        >
          {SECTIONS.map((s) => (
            <Link
              key={s.key}
              href={s.href}
              aria-current={current === s.key ? "page" : undefined}
              className="inline-flex h-9 shrink-0 items-center rounded-lg px-1.5 text-[0.8125rem] font-medium md:px-3 md:text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground aria-[current=page]:bg-accent aria-[current=page]:text-foreground"
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

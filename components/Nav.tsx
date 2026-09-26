import Link from "next/link";
import Search from "@/components/Search";
import ThemeToggle from "@/components/ThemeToggle";

/**
 * Wordmark left, four links and search right, hairline underneath.
 *
 * Writing, Projects, About, CV. The CV is in the header because the home page
 * advertises contract work, and the CV is what a buyer forwards. Skills is not:
 * About and the CV both link to it.
 *
 * Search stays **outside** `<nav>`. Two reasons, both real: its result links
 * would otherwise land inside the navigation landmark, and `.site-header nav a`
 * is `inline-flex`, which every hit row would inherit and be broken by.
 */

const SECTIONS = [
  { key: "writing", href: "/writing/", label: "Writing" },
  { key: "projects", href: "/projects/", label: "Projects" },
  { key: "about", href: "/about/", label: "About" },
  { key: "cv", href: "/cv/", label: "CV" },
] as const;

export type Section = (typeof SECTIONS)[number]["key"] | "home";

export default function Nav({ current }: { current?: Section } = {}) {
  return (
    <header className="site-header bleed" data-pagefind-ignore>
      {current === "home" ? (
        <span className="brand">{/* on the home page the wordmark is not a link to itself */}
          Yehor Hrabovskyi
        </span>
      ) : (
        <Link className="brand" href="/">Yehor Hrabovskyi</Link>
      )}

      <div className="site-header-end">
        <nav aria-label="Primary">
          {SECTIONS.map((s) => (
            <Link
              key={s.key}
              href={s.href}
              aria-current={current === s.key ? "page" : undefined}
            >
              {s.label}
            </Link>
          ))}
        </nav>
        {/* One unit, so the two controls wrap together rather than the theme
            switch dropping to a line of its own at phone width. */}
        <span className="site-header-controls">
          <Search />
          <ThemeToggle />
        </span>
      </div>
    </header>
  );
}

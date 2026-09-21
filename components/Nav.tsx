import Link from "next/link";
import Search from "@/components/Search";

/**
 * Wordmark left, four links and search right, hairline underneath.
 *
 * The previous design had no primary navigation at all: the home page was a
 * trial balance and every page was reached by opening the claim it was evidence
 * for. It was coherent and it was unusable by a stranger, who cannot navigate by
 * claims they do not know exist. Four links, and they are the four things anyone
 * actually arrives wanting.
 *
 * Search stays **outside** `<nav>`. Two reasons, both real: its result links
 * would otherwise land inside the navigation landmark, and `.site-header nav a`
 * is `inline-flex`, which every hit row used to inherit and be broken by.
 */

const SECTIONS = [
  { key: "work", href: "/work/", label: "Work" },
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
        <Search />
      </div>
    </header>
  );
}

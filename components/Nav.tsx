import Link from "next/link";

/**
 * Four primary destinations, plus search as an icon.
 *
 * This used to carry nine items — 77% of the bar width — mixing real routes with
 * homepage anchors (#experience, #homelab, #contact), and `hide-sm` dropped five
 * of them on mobile, which made those pages unreachable there rather than
 * reorganised. Everything cut is now in the footer, on every page, at every width.
 *
 * Search is an icon because it is a different kind of action from a destination;
 * breaking it out of the word-list is most of what makes the bar readable.
 */
/** `current` marks the active destination — the nav has a focal point instead of
 *  five equal words, and screen readers get aria-current. */
export default function Nav({ current }: { current?: "blog" | "about" | "projects" | "resume" | "search" } = {}) {
  const mark = (key: string) => (current === key ? ({ "aria-current": "page" } as const) : {});
  return (
    <nav className="nav" data-pagefind-ignore aria-label="Primary">
      <div className="inner">
        <Link className="brand" href="/">
          <span className="accent">&gt;</span>
          <span className="brand-name"> hrabovskyi</span>
          <span className="accent brand-tld">.online</span>
        </Link>

        <div className="links">
          <Link href="/blog/" {...mark("blog")}>blog</Link>
          <Link href="/about/" {...mark("about")}>about</Link>
          <Link href="/#projects" {...mark("projects")}>projects</Link>
          <Link href="/resume/" {...mark("resume")}>résumé</Link>

          <Link className="nav-search" href="/search/" aria-label="Search" {...mark("search")}>
            {/* aria-hidden: the link already has an accessible name */}
            <svg viewBox="0 0 20 20" width="15" height="15" aria-hidden="true" focusable="false">
              <circle cx="9" cy="9" r="6" fill="none" stroke="currentColor" strokeWidth="2" />
              <path d="M13.5 13.5 L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </Link>
        </div>
      </div>
    </nav>
  );
}

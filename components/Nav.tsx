import Link from "next/link";
import Search from "@/components/Search";

/**
 * Full-bleed header row. Wordmark left, destinations right, hairline underneath.
 *
 * The current destination is `--heading`, deliberately not `--accent`: in this
 * design accent means "this is a link", so colouring the current page with it
 * would say the opposite of what is true.
 *
 * Search is a magnifier that opens a modal, not a nav destination — it belongs
 * on every page, and a link to a search *page* is a worse version of that. The
 * /search/ route still exists as a no-JS fallback and is linked from the footer.
 *
 * On the home page the wordmark is a <span>, not a link to itself.
 */
export default function Nav({
  current,
  links = true,
}: {
  current?: "home" | "blog" | "about" | "projects" | "resume" | "search";
  /**
   * The trial balance is the site's index: every page here is reached by opening
   * the claim it is evidence for. A destination list above it would be a second,
   * shorter index that says nothing about why any of those pages exist — so the
   * home page sets this false and keeps only the wordmark and search.
   */
  links?: boolean;
} = {}) {
  const mark = (key: string) => (current === key ? ({ "aria-current": "page" } as const) : {});
  return (
    <header className="site-header bleed" data-pagefind-ignore>
      {current === "home" ? (
        <span className="brand">hrabovskyi.online</span>
      ) : (
        <Link className="brand" href="/">hrabovskyi.online</Link>
      )}

      {/*
        Search sits beside <nav>, never inside it. Two reasons, both real: the
        dialog's result links would land inside the primary navigation landmark,
        and `.site-header nav a` is inline-flex, which every hit row inherited.
      */}
      <div className="site-header-end">
        {links && (
          <nav aria-label="Primary">
            <Link href="/blog/" {...mark("blog")}>blog</Link>
            <Link href="/about/" {...mark("about")}>about</Link>
            <Link href="/projects/" {...mark("projects")}>projects</Link>
            <Link href="/resume/" {...mark("resume")}>résumé</Link>
          </nav>
        )}
        <Search />
      </div>
    </header>
  );
}
